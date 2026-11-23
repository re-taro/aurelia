#version 300 es
precision mediump float;

in vec3 v_color;
out vec4 outColor;

void main() {
	float d = length(gl_PointCoord - 0.5) * 2.0;
	float glow = exp(-d * d * 3.0) * (1.0 - smoothstep(0.7, 1.0, d));
	outColor = vec4(v_color * glow, 1.0);
}
