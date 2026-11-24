const float PI = 3.14159265358979;
const float TAU = 6.28318530718;
const float BODY_CENTER = 0.22;

layout(std140) uniform Jellies {
	vec4 u_pose[MAX_JELLIES];
	vec4 u_body[MAX_JELLIES];
	vec4 u_motion[MAX_JELLIES];
	vec4 u_tilt[MAX_JELLIES];
	vec4 u_frame;
	vec4 u_focus;
};

float hash(uint x) {
	x ^= x >> 16u;
	x *= 0x7feb352du;
	x ^= x >> 15u;
	x *= 0x846ca68bu;
	x ^= x >> 16u;
	return float(x) / 4294967295.0;
}

float rand(int particle, int channel, uint salt) {
	return hash(uint(particle) * 0x9e3779b9u ^ uint(channel) * 0x85ebca6bu ^ salt);
}

float contraction(float phase) {
	float p = fract(phase);
	return p < CONTRACT_END ? smoothstep(0.0, CONTRACT_END, p) : 1.0 - smoothstep(CONTRACT_END, 1.0, p);
}

vec3 bellSurface(float u, float phi, float c, float seed, float t, out vec3 normal) {
	const float OPEN = 1.45;
	float s = u * OPEN;
	float sinS = sin(s);
	float cosS = cos(s);
	float cosPhi = cos(phi);
	float sinPhi = sin(phi);
	float cos8 = cos(8.0 * phi);
	float wave = 3.0 * phi + t * 0.6 + seed * TAU;
	float sinWave = sin(wave);

	float r0 = sinS / sin(OPEN);
	float f1 = 1.0 - 0.28 * c * u * u;
	float g = smoothstep(0.8, 1.0, u);
	float f2 = 1.0 + 0.03 * cos8 * g;
	float f3 = 1.0 + 0.03 * u * sinWave;
	float r = r0 * f1 * f2 * f3;
	float depth = 0.4 + 0.3 * c;
	float height = (1.0 - cosS) / (1.0 - cos(OPEN));

	float x = clamp((u - 0.8) / 0.2, 0.0, 1.0);
	float dr0 = OPEN * cosS / sin(OPEN);
	float df1 = -0.56 * c * u;
	float df2 = 0.03 * cos8 * 30.0 * x * (1.0 - x);
	float df3 = 0.03 * sinWave;
	float ru = dr0 * f1 * f2 * f3 + r0 * (df1 * f2 * f3 + f1 * (df2 * f3 + f2 * df3));
	float hu = OPEN * sinS / (1.0 - cos(OPEN));
	float rphi = r0 * f1 * (-0.24 * sin(8.0 * phi) * g * f3 + f2 * 0.09 * u * cos(wave));

	vec3 pu = vec3(ru * cosPhi, -hu * depth, ru * sinPhi);
	vec3 pphi = vec3(rphi * cosPhi - r * sinPhi, 0.0, rphi * sinPhi + r * cosPhi);
	normal = cross(pu, pphi) + vec3(0.0, 1e-6, 0.0);
	return vec3(r * cosPhi, -height * depth, r * sinPhi);
}

vec3 bellPoint(float u, float phi, float c, float seed, float t) {
	vec3 unused;
	return bellSurface(u, phi, c, seed, t, unused);
}

vec3 orient(vec3 v, int i) {
	vec2 heading = u_pose[i].zw;
	vec2 tilt = u_tilt[i].xy;
	v = vec3(v.x, v.y * tilt.x - v.z * tilt.y, v.y * tilt.y + v.z * tilt.x);
	v = vec3(v.x * heading.x - v.y * heading.y, v.x * heading.y + v.y * heading.x, v.z);
	return vec3(v.x, -v.y, v.z);
}

float towardViewer(vec3 v, int i) {
	return v.y * u_tilt[i].y + v.z * u_tilt[i].x;
}

vec2 toScreen(vec3 local, int i) {
	return u_pose[i].xy + orient(local + vec3(0.0, BODY_CENTER, 0.0), i).xy * u_body[i].x;
}

float focusBrightness(vec2 screen) {
	float outside = max(u_focus.x - screen.x, screen.x - u_focus.y);
	return mix(u_focus.z, u_focus.w, smoothstep(0.0, FOCUS_FEATHER, outside));
}

vec4 toClip(vec2 screen) {
	vec2 ndc = screen / u_frame.xy * 2.0 - 1.0;
	return vec4(ndc.x, -ndc.y, 0.0, 1.0);
}
