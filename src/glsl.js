export let chunkSrc = {
	vert: `
		uniform mat4 proj;
		uniform mat4 viewmodel;
		uniform vec3 sun;

		attribute vec3 pos;
		attribute vec2 texcoord;
		attribute float faceid;

		varying vec2 vTexcoord;
		varying float vCoef;

		void main()
		{
			gl_Position = proj * viewmodel * vec4(pos, 1.0);

			vTexcoord = texcoord / 16.0;

			vec3 normal =
				faceid == 0.0 ? vec3(0, 0, -1) :
				faceid == 1.0 ? vec3(+1, 0, 0) :
				faceid == 2.0 ? vec3(0, 0, +1) :
				faceid == 3.0 ? vec3(-1, 0, 0) :
				faceid == 4.0 ? vec3(0, +1, 0) :
				faceid == 5.0 ? vec3(0, -1, 0) :
				vec3(0,0,0);

			vCoef = 0.25 + max(0.0, dot(normal, -sun)) * 0.75;
		}
	`,
	frag: `
		precision highp float;

		uniform sampler2D tex;

		varying vec2 vTexcoord;
		varying float vCoef;

		void main()
		{
			gl_FragColor = texture2D(tex, vTexcoord);
			gl_FragColor.rgb *= vCoef;
		}
	`,
};
