export const MAX_JELLIES = 12;
export const CONTRACT_END = 0.25;

const THRUST = 0.65;
const DRAG = 0.8;
const AVERAGE_TIME = 4;
const WRAP_MARGIN = 2.2;

export type SwarmOptions = {
	areaPerJelly: number;
	minRadius: number;
	maxRadius: number;
};

type Jelly = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	avgVx: number;
	avgVy: number;
	radius: number;
	period: number;
	phase: number;
	brightness: number;
	seed: number;
	baseHeading: number;
	baseTilt: number;
	wander: readonly [number, number, number];
};

export type Swarm = Jelly[];

export const SWARM_BUFFER_LENGTH = (MAX_JELLIES * 4 + 2) * 4;

const headingAt = (jelly: Jelly, time: number): number =>
	jelly.baseHeading + 0.45 * Math.sin(time * 0.043 + jelly.wander[0]) + 0.2 * Math.sin(time * 0.11 + jelly.wander[1]);

const tiltAt = (jelly: Jelly, time: number): number => jelly.baseTilt + 0.2 * Math.sin(time * 0.057 + jelly.wander[2]);

export const createSwarm = (width: number, height: number, options: SwarmOptions): Swarm => {
	const count = Math.min(MAX_JELLIES, Math.max(2, Math.round((width * height) / options.areaPerJelly)));
	const cols = Math.max(1, Math.ceil(Math.sqrt((count * width) / height)));
	const rows = Math.max(1, Math.ceil(count / cols));
	const slots = Array.from({ length: cols * rows }, (_, i) => i).toSorted(() => Math.random() - 0.5);

	return Array.from({ length: count }, (_, i) => {
		const slot = slots[i] ?? 0;
		const depth = Math.random();
		return {
			x: (((slot % cols) + 0.2 + Math.random() * 0.6) / cols) * width,
			y: ((Math.floor(slot / cols) + 0.2 + Math.random() * 0.6) / rows) * height,
			vx: 0,
			vy: 0,
			avgVx: 0,
			avgVy: 0,
			radius: options.minRadius + (options.maxRadius - options.minRadius) * depth,
			period: 2.8 + 1.4 * depth + Math.random() * 0.6,
			phase: Math.random(),
			brightness: 0.45 + 0.55 * depth,
			seed: Math.random(),
			baseHeading: (Math.random() - 0.5) * 1.3,
			baseTilt: 0.3 + Math.random() * 0.45,
			wander: [Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28],
		};
	});
};

export const stepSwarm = (swarm: Swarm, dt: number, time: number, width: number, height: number): void => {
	for (const jelly of swarm) {
		const previous = jelly.phase;
		jelly.phase = (jelly.phase + dt / jelly.period) % 1;

		if (previous < CONTRACT_END) {
			const x = previous / CONTRACT_END;
			const accel = (THRUST * jelly.radius * 6 * x * (1 - x)) / (CONTRACT_END * jelly.period);
			const heading = headingAt(jelly, time);
			jelly.vx += -Math.sin(heading) * accel * dt;
			jelly.vy += -Math.cos(heading) * accel * dt;
		}

		const damping = Math.exp(-DRAG * dt);
		jelly.vx *= damping;
		jelly.vy *= damping;
		jelly.x += jelly.vx * dt;
		jelly.y += jelly.vy * dt;
		const follow = 1 - Math.exp(-dt / AVERAGE_TIME);
		jelly.avgVx += (jelly.vx - jelly.avgVx) * follow;
		jelly.avgVy += (jelly.vy - jelly.avgVy) * follow;

		const margin = jelly.radius * WRAP_MARGIN;
		const spanX = width + 2 * margin;
		const spanY = height + 2 * margin;
		jelly.x = ((((jelly.x + margin) % spanX) + spanX) % spanX) - margin;
		jelly.y = ((((jelly.y + margin) % spanY) + spanY) % spanY) - margin;
	}
};

const BODY_OFFSET = MAX_JELLIES * 4;
const MOTION_OFFSET = MAX_JELLIES * 8;
const TILT_OFFSET = MAX_JELLIES * 12;
const FRAME_OFFSET = MAX_JELLIES * 16;
const FOCUS_OFFSET = FRAME_OFFSET + 4;

export const writeSwarm = (
	swarm: Swarm,
	time: number,
	width: number,
	height: number,
	dpr: number,
	out: Float32Array,
): void => {
	for (const [i, jelly] of swarm.entries()) {
		const heading = headingAt(jelly, time);
		const tilt = tiltAt(jelly, time);
		const pose = i * 4;
		out[pose] = jelly.x;
		out[pose + 1] = jelly.y;
		out[pose + 2] = Math.cos(heading);
		out[pose + 3] = Math.sin(heading);
		const body = BODY_OFFSET + i * 4;
		out[body] = jelly.radius;
		out[body + 1] = jelly.phase;
		out[body + 2] = jelly.brightness;
		out[body + 3] = jelly.seed;
		const motion = MOTION_OFFSET + i * 4;
		out[motion] = jelly.vx;
		out[motion + 1] = jelly.vy;
		out[motion + 2] = jelly.avgVx;
		out[motion + 3] = jelly.avgVy;
		const tiltIndex = TILT_OFFSET + i * 4;
		out[tiltIndex] = Math.cos(tilt);
		out[tiltIndex + 1] = Math.sin(tilt);
	}
	out[FRAME_OFFSET] = width;
	out[FRAME_OFFSET + 1] = height;
	out[FRAME_OFFSET + 2] = time;
	out[FRAME_OFFSET + 3] = dpr;
};

export const writeFocus = (out: Float32Array, left: number, right: number, inside: number, outside: number): void => {
	out[FOCUS_OFFSET] = left;
	out[FOCUS_OFFSET + 1] = right;
	out[FOCUS_OFFSET + 2] = inside;
	out[FOCUS_OFFSET + 3] = outside;
};
