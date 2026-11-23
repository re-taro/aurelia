import type { BackgroundMode } from './mode';
import common from './shaders/common.glsl';
import dustVertex from './shaders/dust.vert';
import jellyVertex from './shaders/jelly.vert';
import particleFragment from './shaders/particle.frag';
import {
	CONTRACT_END,
	createSwarm,
	MAX_JELLIES,
	stepSwarm,
	SWARM_BUFFER_LENGTH,
	writeFocus,
	writeSwarm,
	type Swarm,
	type SwarmOptions,
} from './swarm';

export type ReadingOptions = {
	fps: number;
	laneBrightness: number;
	brightness: number;
	timeScale: number;
	feather: number;
	easeTime: number;
};

export type RendererOptions = {
	fps: number;
	reading: ReadingOptions;
	intensity: number;
	pointSize: number;
	areaPerDust: number;
	renderScale: number;
	maxDpr: number;
} & SwarmOptions;

export type Renderer = {
	setVisible: (visible: boolean) => void;
	setStatic: (isStatic: boolean) => void;
	setMode: (mode: BackgroundMode, immediate?: boolean) => void;
	setFocusLane: (left: number, right: number) => void;
	dispose: () => void;
};

type Oklch = readonly [l: number, c: number, h: number];
type Rgb = readonly [r: number, g: number, b: number];

const BELL_POINTS = 2200;
const GONADS = 4;
const GONAD_POINTS = 70;
const TENTACLES = 36;
const TENTACLE_POINTS = 36;
const ARMS = 4;
const ARM_LANES = 3;
const ARM_POINTS = 48;
const SPARKS = 120;
const BELL_FLOW = 0.025;
const MAX_DUST = 600;

const JELLY_POINTS =
	BELL_POINTS + GONADS * GONAD_POINTS + TENTACLES * TENTACLE_POINTS + ARMS * ARM_LANES * ARM_POINTS + SPARKS;

const MAX_DT = 0.1;
const UNIFORM_BINDING = 0;

const DEFINES = {
	MAX_JELLIES: String(MAX_JELLIES),
	CONTRACT_END: CONTRACT_END.toFixed(4),
	BELL_POINTS: String(BELL_POINTS),
	GONADS: String(GONADS),
	GONAD_POINTS: String(GONAD_POINTS),
	TENTACLES: String(TENTACLES),
	TENTACLE_POINTS: String(TENTACLE_POINTS),
	ARMS: String(ARMS),
	ARM_LANES: String(ARM_LANES),
	ARM_POINTS: String(ARM_POINTS),
	BELL_FLOW: BELL_FLOW.toFixed(4),
};

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

const vertexShader = (body: string, feather: number): string =>
	[
		'#version 300 es',
		'precision highp float;',
		...Object.entries(DEFINES).map(([name, value]) => `#define ${name} ${value}`),
		`#define FOCUS_FEATHER ${feather.toFixed(4)}`,
		common,
		body,
	].join('\n');

const parseOklch = (value: string): Oklch | null => {
	const m = /oklch\(\s*(?<l>[\d.]+)(?<unit>%?)\s+(?<c>[\d.]+)\s+(?<h>[\d.]+)/u.exec(value)?.groups;
	if (m?.['l'] == null || m['c'] == null || m['h'] == null) {
		return null;
	}
	const l = Number(m['l']) / (m['unit'] === '%' ? 100 : 1);
	return [l, Number(m['c']), Number(m['h'])];
};

const readColorToken = (style: CSSStyleDeclaration, name: string, fallback: Oklch): Oklch =>
	parseOklch(style.getPropertyValue(name)) ?? fallback;

const oklchToSrgb = ([L, C, h]: Oklch): Rgb => {
	const rad = (h * Math.PI) / 180;
	const a = C * Math.cos(rad);
	const b = C * Math.sin(rad);
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
	const linear = [
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
	const [r = 0, g = 0, bl = 0] = linear.map((c) => {
		const v = Math.min(1, Math.max(0, c));
		return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
	});
	return [r, g, bl];
};

const scale = ([r, g, b]: Rgb, k: number): Rgb => [r * k, g * k, b * k];

const nextFrame = (): Promise<void> =>
	new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			resolve();
		});
	});

type PendingProgram = {
	program: WebGLProgram;
	shaders: [WebGLShader, WebGLShader];
};

const startProgram = (
	gl: WebGL2RenderingContext,
	vertexSource: string,
	fragmentSource: string,
	feather: number,
): PendingProgram => {
	const vs = gl.createShader(gl.VERTEX_SHADER);
	const fs = gl.createShader(gl.FRAGMENT_SHADER);
	if (vs == null || fs == null) {
		throw new Error('Failed to create WebGL shader');
	}
	gl.shaderSource(vs, vertexShader(vertexSource, feather));
	gl.shaderSource(fs, fragmentSource);
	gl.compileShader(vs);
	gl.compileShader(fs);
	const program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	return { program, shaders: [vs, fs] };
};

const finishProgram = (gl: WebGL2RenderingContext, { program, shaders }: PendingProgram): WebGLProgram | null => {
	const linked = gl.getProgramParameter(program, gl.LINK_STATUS) === true;
	if (!linked && !gl.isContextLost()) {
		for (const shader of shaders) {
			if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
				console.error(gl.getShaderInfoLog(shader));
			}
		}
		console.error(gl.getProgramInfoLog(program));
	}
	for (const shader of shaders) {
		gl.detachShader(program, shader);
		gl.deleteShader(shader);
	}
	if (!linked) {
		gl.deleteProgram(program);
		return null;
	}
	gl.uniformBlockBinding(program, gl.getUniformBlockIndex(program, 'Jellies'), UNIFORM_BINDING);
	return program;
};

const waitForPrograms = async (
	gl: WebGL2RenderingContext,
	pending: PendingProgram[],
	isCancelled: () => boolean,
): Promise<void> => {
	const parallel = gl.getExtension('KHR_parallel_shader_compile');
	if (!parallel) {
		return;
	}
	while (
		!isCancelled() &&
		!pending.every(({ program }) => gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR) === true)
	) {
		await nextFrame();
	}
};

type Scene = {
	programs: { dust: WebGLProgram; jelly: WebGLProgram };
	vao: WebGLVertexArrayObject;
	uniformBuffer: WebGLBuffer;
};

export const createRenderer = async (canvas: HTMLCanvasElement, options: RendererOptions): Promise<Renderer | null> => {
	const gl = canvas.getContext('webgl2', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
		powerPreference: 'low-power',
		preserveDrawingBuffer: false,
		desynchronized: true,
	});
	if (!gl) {
		return null;
	}

	const rootStyle = getComputedStyle(document.documentElement);
	const base = readColorToken(rootStyle, '--aurelia-color-mono-50', [0.176, 0.012, 226.092]);
	const brand = readColorToken(rootStyle, '--aurelia-color-brand', [0.722, 0.177, 305.504]);
	const hue = brand[2];
	const palette = {
		clear: oklchToSrgb(base),
		body: scale(oklchToSrgb([0.93, 0.03, hue]), options.intensity * 0.55),
		gonad: scale(oklchToSrgb([brand[0], brand[1], hue]), options.intensity * 0.28),
		tint: scale(oklchToSrgb([0.84, 0.08, hue]), options.intensity * 0.55),
		dust: scale(oklchToSrgb([0.85, 0.02, hue]), options.intensity * 0.35),
	};

	const ambientInterval = 1000 / options.fps;
	const readingInterval = 1000 / options.reading.fps;
	const uniformData = new Float32Array(SWARM_BUFFER_LENGTH);
	let cssWidth = Math.max(1, canvas.clientWidth);
	let cssHeight = Math.max(1, canvas.clientHeight);
	const swarm: Swarm = createSwarm(cssWidth, cssHeight, options);
	const dustCount =
		options.areaPerDust > 0 ? Math.min(MAX_DUST, Math.round((cssWidth * cssHeight) / options.areaPerDust)) : 0;

	let scene: Scene | null = null;
	let rafId = 0;
	let lastTickAt = 0;
	let lastFrameAt = 0;
	let time = 0;
	let visible = false;
	let isStatic = false;
	let disposed = false;
	let generation = 0;
	let calm = 0;
	let calmTarget = 0;
	let laneLeft = 0;
	let laneRight = cssWidth;

	const setup = async (): Promise<boolean> => {
		const started = generation;
		const isCancelled = (): boolean => disposed || started !== generation;
		const { feather } = options.reading;
		const pending = [
			startProgram(gl, dustVertex, particleFragment, feather),
			startProgram(gl, jellyVertex, particleFragment, feather),
		];
		await waitForPrograms(gl, pending, isCancelled);
		const [dust, jelly] = pending.map((p) => finishProgram(gl, p));
		if (isCancelled() || !dust || !jelly) {
			if (dust) {
				gl.deleteProgram(dust);
			}
			if (jelly) {
				gl.deleteProgram(jelly);
			}
			return false;
		}

		const uniformBuffer = gl.createBuffer();
		gl.bindBuffer(gl.UNIFORM_BUFFER, uniformBuffer);
		gl.bufferData(gl.UNIFORM_BUFFER, uniformData.byteLength, gl.DYNAMIC_DRAW);
		gl.bindBufferBase(gl.UNIFORM_BUFFER, UNIFORM_BINDING, uniformBuffer);

		const vao = gl.createVertexArray();
		gl.bindVertexArray(vao);

		gl.useProgram(dust);
		gl.uniform3fv(gl.getUniformLocation(dust, 'u_dustColor'), palette.dust);
		gl.uniform1f(gl.getUniformLocation(dust, 'u_pointSize'), options.pointSize);
		gl.useProgram(jelly);
		gl.uniform3fv(gl.getUniformLocation(jelly, 'u_bodyColor'), palette.body);
		gl.uniform3fv(gl.getUniformLocation(jelly, 'u_gonadColor'), palette.gonad);
		gl.uniform3fv(gl.getUniformLocation(jelly, 'u_tintColor'), palette.tint);
		gl.uniform1f(gl.getUniformLocation(jelly, 'u_pointSize'), options.pointSize);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE);
		gl.clearColor(palette.clear[0], palette.clear[1], palette.clear[2], 1);

		scene = { programs: { dust, jelly }, vao, uniformBuffer };
		return true;
	};

	const teardown = (): void => {
		if (!scene) {
			return;
		}
		gl.deleteBuffer(scene.uniformBuffer);
		gl.deleteVertexArray(scene.vao);
		for (const program of Object.values(scene.programs)) {
			gl.deleteProgram(program);
		}
		scene = null;
	};

	const draw = (s: Scene): void => {
		if (gl.isContextLost()) {
			return;
		}
		writeSwarm(swarm, time, cssWidth, cssHeight, canvas.width / cssWidth, uniformData);
		const brightness = mix(1, options.reading.brightness, calm);
		const laneBrightness = mix(1, options.reading.brightness * options.reading.laneBrightness, calm);
		writeFocus(uniformData, laneLeft, laneRight, laneBrightness, brightness);
		gl.bindBuffer(gl.UNIFORM_BUFFER, s.uniformBuffer);
		gl.bufferSubData(gl.UNIFORM_BUFFER, 0, uniformData);

		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT);
		if (dustCount > 0) {
			gl.useProgram(s.programs.dust);
			gl.drawArrays(gl.POINTS, 0, dustCount);
		}
		gl.useProgram(s.programs.jelly);
		gl.drawArraysInstanced(gl.POINTS, 0, JELLY_POINTS, swarm.length);
	};

	const stop = (): void => {
		cancelAnimationFrame(rafId);
		rafId = 0;
	};

	const tick = (now: number): void => {
		rafId = requestAnimationFrame(tick);
		const frameInterval = calmTarget > 0.5 ? readingInterval : ambientInterval;
		if (!scene || now - lastFrameAt < frameInterval) {
			return;
		}
		lastFrameAt = now - ((now - lastFrameAt) % frameInterval);
		const elapsed = Math.min(MAX_DT, (now - lastTickAt) / 1000);
		lastTickAt = now;
		calm += (calmTarget - calm) * (1 - Math.exp(-elapsed / options.reading.easeTime));
		const dt = elapsed * mix(1, options.reading.timeScale, calm);
		time += dt;
		stepSwarm(swarm, dt, time, cssWidth, cssHeight);
		draw(scene);
	};

	const sync = (): void => {
		if (disposed || !scene) {
			return;
		}
		if (visible && !isStatic) {
			if (rafId === 0) {
				lastTickAt = performance.now();
				rafId = requestAnimationFrame(tick);
			}
		} else {
			stop();
			if (isStatic) {
				draw(scene);
			}
		}
	};

	const resize = (width: number, height: number): void => {
		if (width === 0 || height === 0 || !scene) {
			return;
		}
		canvas.width = width;
		canvas.height = height;
		if (rafId === 0) {
			draw(scene);
		}
	};

	const resizeObserver = new ResizeObserver(([entry]) => {
		if (!entry) {
			return;
		}
		cssWidth = Math.max(1, entry.contentRect.width);
		cssHeight = Math.max(1, entry.contentRect.height);
		const box = entry.devicePixelContentBoxSize?.[0];
		if (box) {
			resize(Math.round(box.inlineSize * options.renderScale), Math.round(box.blockSize * options.renderScale));
			return;
		}
		const dpr = Math.min(window.devicePixelRatio, options.maxDpr) * options.renderScale;
		resize(Math.round(entry.contentRect.width * dpr), Math.round(entry.contentRect.height * dpr));
	});

	const observe = (): void => {
		try {
			resizeObserver.observe(canvas, { box: 'device-pixel-content-box' });
		} catch {
			resizeObserver.observe(canvas);
		}
	};

	const onContextLost = (event: Event): void => {
		event.preventDefault();
		generation += 1;
		stop();
		scene = null;
	};
	const onContextRestored = (): void => {
		void (async () => {
			if (!(await setup())) {
				return;
			}
			resizeObserver.unobserve(canvas);
			observe();
			sync();
		})();
	};

	if (!(await setup())) {
		return null;
	}

	canvas.addEventListener('webglcontextlost', onContextLost);
	canvas.addEventListener('webglcontextrestored', onContextRestored);
	observe();

	return {
		setVisible(next) {
			visible = next;
			sync();
		},
		setStatic(next) {
			isStatic = next;
			sync();
		},
		setMode(mode, immediate = false) {
			calmTarget = mode === 'reading' ? 1 : 0;
			if (immediate || rafId === 0) {
				calm = calmTarget;
			}
			if (rafId === 0 && isStatic && scene) {
				draw(scene);
			}
		},
		setFocusLane(left, right) {
			laneLeft = left;
			laneRight = right;
			if (rafId === 0 && isStatic && scene) {
				draw(scene);
			}
		},
		dispose() {
			disposed = true;
			stop();
			resizeObserver.disconnect();
			canvas.removeEventListener('webglcontextlost', onContextLost);
			canvas.removeEventListener('webglcontextrestored', onContextRestored);
			teardown();
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		},
	};
};
