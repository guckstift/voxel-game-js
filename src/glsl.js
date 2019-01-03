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

export let axisSrc = {
	vert: `
		uniform mat4 proj;
		uniform mat4 view;
		attribute vec3 pos;
		attribute vec3 col;
		varying vec3 vCol;
		void main()
		{
			gl_Position = proj * view * vec4(pos, 1.0);
			vCol = col;
		}
	`,
	frag: `
		precision highp float;
		varying vec3 vCol;
		void main()
		{
			gl_FragColor = vec4(vCol, 1.0);
		}
	`,
};


export let selectorSrc = {
	vert: `
		uniform mat4 proj;
		uniform mat4 viewmodel;
		attribute vec3 pos;
		varying vec2 vPos;
		void main()
		{
			gl_Position = proj * viewmodel * vec4(pos, 1.0);
			vPos = pos.xy;
		}
	`,
	frag: `
		precision highp float;
		varying vec2 vPos;
		void main()
		{
			gl_FragColor = vec4(1.0, 1.0, 1.0, 0.0);

			float gap = 1.0/32.0;

			if(vPos.x < gap || vPos.x > 1.0 - gap || vPos.y < gap || vPos.y > 1.0 - gap) {
				gl_FragColor.a = 0.5;
			}
			else {
				discard;
			}
		}
	`,
};

export let cubeSrc = {
	vert: `
		uniform mat4 proj;
		uniform mat4 viewmodel;
		uniform mat4 bones[8];
		uniform vec3 roots[8];
		attribute vec3 pos;
		attribute vec2 texpos;
		attribute float bone;
		varying vec3 vCol;
		varying vec2 vTexpos;
		void main()
		{
			gl_Position = vec4(pos, 1.0);

			for(float i=0.0; i<8.0; i++) {
				if(i == bone - 1.0) {
					gl_Position.xyz -= roots[int(i)];
					gl_Position = bones[int(i)] * gl_Position;
					gl_Position.xyz += roots[int(i)];
				}
			}

			gl_Position = proj * viewmodel * gl_Position;
			vCol = pos;
			vTexpos = texpos;
		}
	`,
	frag: `
		precision highp float;
		uniform sampler2D tex;
		varying vec3 vCol;
		varying vec2 vTexpos;
		void main()
		{
			gl_FragColor = texture2D(tex, vTexpos);
		}
	`,
};
