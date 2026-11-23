const int GONAD_START = BELL_POINTS;
const int TENTACLE_START = GONAD_START + GONADS * GONAD_POINTS;
const int ARM_START = TENTACLE_START + TENTACLES * TENTACLE_POINTS;
const int SPARK_START = ARM_START + ARMS * ARM_LANES * ARM_POINTS;

uniform vec3 u_bodyColor;
uniform vec3 u_gonadColor;
uniform vec3 u_tintColor;
uniform float u_pointSize;

out vec3 v_color;

vec3 tentacle(int j, float s, float c, float seed, float phase, float t, uint salt) {
	float h = rand(j, 1, salt);
	float phi = (float(j) + 0.6 * h) / float(TENTACLES) * TAU;
	float reach = 0.5 + 0.6 * rand(j, 2, salt);
	vec3 radial = vec3(cos(phi), 0.0, sin(phi));
	vec3 tangent = vec3(-sin(phi), 0.0, cos(phi));
	vec3 root = bellPoint(1.0, phi, c, seed, t);
	float spread = mix(0.45, -0.1, contraction(phase - s * 0.3));
	vec3 p = root + (vec3(0.0, -1.0, 0.0) + radial * spread) * reach * s;
	p += (tangent * sin(s * 4.5 - t * 1.1 + h * TAU) + radial * 0.6 * sin(s * 3.0 - t * 0.7 + h * 17.0)) * 0.13 * reach * s;
	return p;
}

vec3 oralArm(int arm, int lane, float s, float seed, float phase, float t, uint salt) {
	float a = float(arm) * PI * 0.5 + (seed - 0.5) * 0.4;
	vec3 radial = vec3(cos(a), 0.0, sin(a));
	vec3 tangent = vec3(-sin(a), 0.0, cos(a));
	float reach = 0.95 + 0.4 * rand(arm, 3, salt);
	float lagged = contraction(phase - s * 0.45);
	float fa = float(arm);

	vec3 p = vec3(0.0, -0.12, 0.0) + radial * 0.05;
	p += vec3(0.0, -1.0, 0.0) * reach * s + radial * (0.12 + 0.2 * (1.0 - lagged)) * s;
	p += (tangent * sin(s * 2.6 - t * 0.6 + fa * 1.9) + radial * cos(s * 2.1 - t * 0.45 + fa * 2.7)) * 0.22 * s;
	float offset = float(lane) / float(ARM_LANES - 1) - 0.5;
	float width = 0.26 * (1.0 - 0.5 * s) * (0.6 + 0.4 * sin(s * 15.0 - t * 1.4 + float(lane) * 1.3 + fa));
	p += tangent * offset * width + radial * 0.05 * sin(s * 9.0 - t * 0.9 + offset * 4.0);
	return p;
}

void main() {
	int i = gl_InstanceID;
	int id = gl_VertexID;
	float phase = u_body[i].y;
	float seed = u_body[i].w;
	float t = u_frame.z;
	uint salt = uint(seed * 16777215.0);
	float c = contraction(phase);

	float twinkle = 0.65 + 0.35 * sin(t * (1.0 + 2.0 * rand(id, 4, salt)) + rand(id, 5, salt) * TAU);

	vec3 color;
	float size;
	vec2 screen;
	if (id < GONAD_START) {
		float flow = fract(rand(id, 6, salt) + t * BELL_FLOW);
		float u = sqrt(flow);
		float phi = TAU * rand(id, 7, salt);
		vec3 normal;
		vec3 p = bellSurface(u, phi, c, seed, t, normal);
		vec3 n = normalize(normal);
		p += n * 0.025 * sin(t * 0.9 + rand(id, 8, salt) * TAU);
		float rim = 1.0 - abs(towardViewer(n, i));
		float fade = smoothstep(0.0, 0.05, flow) * (1.0 - smoothstep(0.96, 1.0, flow));
		color = u_bodyColor * (0.2 + 0.8 * rim * rim + 0.45 * smoothstep(0.85, 1.0, u)) * fade;
		size = 0.75 + 0.6 * rim;
		screen = toScreen(p, i);
	} else if (id < TENTACLE_START) {
		int local = id - GONAD_START;
		float a = PI * (0.25 + 0.5 * float(local / GONAD_POINTS));
		vec2 dir = vec2(cos(a), sin(a));
		float theta = a + 0.6 + (TAU - 1.2) * rand(local, 9, salt);
		float r = 0.1 + 0.06 * (rand(local, 10, salt) - 0.5);
		vec2 disk = dir * 0.3 + vec2(cos(theta), sin(theta)) * r;
		vec3 p = bellPoint(length(disk), atan(disk.y, disk.x), c, seed, t);
		color = u_gonadColor;
		size = 0.9;
		screen = toScreen(p, i);
	} else if (id < ARM_START) {
		int local = id - TENTACLE_START;
		float s = (float(local % TENTACLE_POINTS) + rand(local, 11, salt)) / float(TENTACLE_POINTS);
		vec3 p = tentacle(local / TENTACLE_POINTS, s, c, seed, phase, t, salt);
		color = u_bodyColor * 1.3 * pow(1.0 - s, 1.2);
		size = 0.9 - 0.4 * s;
		screen = toScreen(p, i) - u_motion[i].xy * 0.5 * s * s;
	} else if (id < SPARK_START) {
		int local = id - ARM_START;
		int strand = local / ARM_POINTS;
		float s = (float(local % ARM_POINTS) + rand(local, 12, salt)) / float(ARM_POINTS);
		vec3 p = oralArm(strand / ARM_LANES, strand % ARM_LANES, s, seed, phase, t, salt);
		color = u_tintColor * 1.4 * pow(1.0 - s, 0.8) * smoothstep(0.0, 0.06, s);
		size = 1.0 - 0.3 * s;
		screen = toScreen(p, i) - u_motion[i].xy * 0.9 * s * s;
	} else {
		int local = id - SPARK_START;
		float life = 3.0 + 3.0 * rand(local, 13, salt);
		float age = fract(t / life + rand(local, 14, salt));
		float elapsed = age * life;
		float born = t - elapsed;
		int j = int(rand(local, 15, salt) * float(TENTACLES));
		float s = 0.3 + 0.7 * rand(local, 16, salt);
		vec3 p = tentacle(j, s, c, seed, phase, born, salt);
		screen = toScreen(p, i) - u_motion[i].zw * (0.5 * s * s + elapsed);
		screen += vec2(sin(born * 0.7 + rand(local, 17, salt) * TAU) * 6.0 * age, -elapsed * 3.0);
		color = u_tintColor * 1.6 * smoothstep(0.0, 0.08, age) * pow(1.0 - age, 2.0);
		size = 1.4;
	}

	gl_Position = toClip(screen);
	gl_PointSize = u_pointSize * size * u_frame.w;
	v_color = color * u_body[i].z * twinkle * focusBrightness(screen);
}
