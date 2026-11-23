uniform vec3 u_dustColor;
uniform float u_pointSize;

out vec3 v_color;

void main() {
	int id = gl_VertexID;
	float t = u_frame.z;
	vec2 screenSize = u_frame.xy;
	float depth = rand(id, 1, 0u);
	float speed = 2.0 + 6.0 * depth;
	float sway = sin(t * (0.05 + 0.05 * rand(id, 2, 0u)) + rand(id, 3, 0u) * TAU) * 24.0;
	vec2 p = vec2(
		rand(id, 4, 0u) * screenSize.x + sway,
		mod(rand(id, 5, 0u) * screenSize.y - t * speed, screenSize.y + 20.0) - 10.0
	);
	float twinkle = 0.6 + 0.4 * sin(t * (0.7 + rand(id, 6, 0u)) + rand(id, 7, 0u) * TAU);

	gl_Position = toClip(p);
	gl_PointSize = u_pointSize * (0.6 + 0.8 * depth) * u_frame.w;
	v_color = u_dustColor * (0.3 + 0.7 * depth) * twinkle * focusBrightness(p);
}
