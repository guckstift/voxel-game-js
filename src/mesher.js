import blocks from "./blocks.js";

let chunks = null;

onmessage = e => {
	chunks = e.data.chunks;
	
	let cx = e.data.cx;
	let cy = e.data.cy;
	let mesh = remesh(false);
	let transmesh = remesh(true);
	
	postMessage({mesh, transmesh, cx, cy});
};

function getBlock(x, y, z)
{
	if(z < 0 || z > 255) {
		return 0;
	}
	
	let cx = Math.floor(x / 16);
	let cy = Math.floor(y / 16);
	let ci = (cx + 1) + (cy + 1) * 3;
	let ch = chunks[ci];
	
	x -= cx * 16;
	y -= cy * 16;
	
	return ch[x + y * 16 + z * 16 * 16];
}

function remesh(meshTrans)
{
	let mesh = [];
	
	remeshSide(mesh, -1, 0, 0, 0, meshTrans, // left
		1, 2, 0, false, true, false,
		[-1,+1,+1], [-1, 0,+1], [-1,-1,+1],
		[-1,+1, 0],             [-1,-1, 0],
		[-1,+1,-1], [-1, 0,-1], [-1,-1,-1]);
	remeshSide(mesh,  0,-1, 0, 1, meshTrans, // front
		0, 2, 1, false, false, false,
		[-1,-1,+1], [ 0,-1,+1], [+1,-1,+1],
		[-1,-1, 0],             [+1,-1, 0],
		[-1,-1,-1], [ 0,-1,-1], [+1,-1,-1]);
	remeshSide(mesh,  0, 0,-1, 2, meshTrans, // bottom
		0, 1, 2, false, true, false,
		[-1,-1,-1], [ 0,-1,-1], [+1,-1,-1],
		[-1, 0,-1],             [+1, 0,-1],
		[-1,+1,-1], [ 0,+1,-1], [+1,+1,-1]);
	remeshSide(mesh, +1, 0, 0, 3, meshTrans, // right
		1, 2, 0, false, false, false,
		[+1,-1,+1], [+1, 0,+1], [+1,+1,+1],
		[+1,-1, 0],             [+1,+1, 0],
		[+1,-1,-1], [+1, 0,-1], [+1,+1,-1]);
	remeshSide(mesh,  0,+1, 0, 4, meshTrans, // back
		0, 2, 1, true, false, false,
		[+1,+1,+1], [ 0,+1,+1], [-1,+1,+1],
		[+1,+1, 0],             [-1,+1, 0],
		[+1,+1,-1], [ 0,+1,-1], [-1,+1,-1]);
	remeshSide(mesh,  0, 0,+1, 5, meshTrans, // top
		0, 1, 2, false, false, false,
		[-1,+1,+1], [ 0,+1,+1], [+1,+1,+1],
		[-1, 0,+1],             [+1, 0,+1],
		[-1,-1,+1], [ 0,-1,+1], [+1,-1,+1]);
	
	return mesh;
}

function remeshSide(
	mesh, nx, ny, nz, fid, meshTrans,
	ax0, ax1, ax2, fx, fy, fz, aov0, aov1, aov2, aov3, aov4, aov5, aov6, aov7
) {
	let map = [];
	
	for(let z=0, i=0; z<256; z++) {
		for(let y=0; y<16; y++) {
			for(let x=0; x<16; x++, i++) {
				let block = getBlock(x, y, z);
				let adjacent = getBlock(x + nx, y + ny, z + nz);
				let transparent = blocks[block].transparent || false;
				let adjTrans = blocks[adjacent].transparent || false;
				
				if(meshTrans) {
					map[i] = (
						block > 0 && transparent === true && adjacent !== block && adjTrans === true
						? block
						: 0
					);
				}
				else {
					map[i] = (
						block > 0 && transparent === false && adjTrans === true
						? block
						: 0
					);
				}
				
				if(map[i] > 0) {
					let ao0 = getOcclusion(
						[x + aov3[0], y + aov3[1], z + aov3[2]],
						[x + aov5[0], y + aov5[1], z + aov5[2]],
						[x + aov6[0], y + aov6[1], z + aov6[2]],
					);
					
					let ao1 = getOcclusion(
						[x + aov4[0], y + aov4[1], z + aov4[2]],
						[x + aov7[0], y + aov7[1], z + aov7[2]],
						[x + aov6[0], y + aov6[1], z + aov6[2]],
					);
					
					let ao2 = getOcclusion(
						[x + aov3[0], y + aov3[1], z + aov3[2]],
						[x + aov0[0], y + aov0[1], z + aov0[2]],
						[x + aov1[0], y + aov1[1], z + aov1[2]],
					);
					
					let ao3 = getOcclusion(
						[x + aov4[0], y + aov4[1], z + aov4[2]],
						[x + aov2[0], y + aov2[1], z + aov2[2]],
						[x + aov1[0], y + aov1[1], z + aov1[2]],
					);
					
					map[i] |= ao0 << 8 | ao1 << 10 | ao2 << 12 | ao3 << 14;
				}
			}
		}
	}
	
	let a = [fx ? 15 : 0,  fy ? 15 : 0,  fz ? 255 : 0];
	let b = [fx ? -1 : 16, fy ? -1 : 16, fz ? -1  : 256];
	let s = [fx ? -1 : +1, fy ? -1 : +1, fz ? -1  : +1];
	let i = [0,0,0];
	let j = [0,0,0];
	let k = [0,0,0];
	
	for(i[ax2] = a[ax2]; i[ax2] !== b[ax2]; i[ax2] += s[ax2]) {
		for(i[ax1] = a[ax1]; i[ax1] !== b[ax1]; i[ax1] += s[ax1]) {
			for(i[ax0] = a[ax0]; i[ax0] !== b[ax0]; i[ax0] += s[ax0]) {
				let I = i[0] + i[1] * 16 + i[2] * 16 * 16;
				let val = map[I];
				
				if(val > 0) {
					j[0] = i[0];
					j[1] = i[1];
					j[2] = i[2];
					k[0] = i[0];
					k[1] = i[1];
					k[2] = i[2];
					
					for(j[ax0] = i[ax0] + s[ax0]; j[ax0] !== b[ax0]; j[ax0] += s[ax0]) {
						let J = j[0] + j[1] * 16 + j[2] * 16 * 16;
						
						if(map[J] !== val) {
							break;
						}
						
						map[J] = 0;
					}
					
					outer:
					for(k[ax1] = i[ax1] + s[ax1]; k[ax1] !== b[ax1]; k[ax1] += s[ax1]) {
						for(k[ax0] = i[ax0]; k[ax0] !== j[ax0]; k[ax0] += s[ax0]) {
							let K = k[0] + k[1] * 16 + k[2] * 16 * 16;
							
							if(map[K] !== val) {
								break outer;
							}
						}
						
						for(k[ax0] = i[ax0]; k[ax0] !== j[ax0]; k[ax0] += s[ax0]) {
							let K = k[0] + k[1] * 16 + k[2] * 16 * 16;
							
							map[K] = 0;
						}
					}
					
					let block = val & 0xff;
					let face = blocks[block].faces[fid];
					let ao0 = val >>  8 & 3;
					let ao1 = val >> 10 & 3;
					let ao2 = val >> 12 & 3;
					let ao3 = val >> 14 & 3;
					let quadw = (j[ax0] - i[ax0]) * s[ax0];
					let quadh = (k[ax1] - i[ax1]) * s[ax1];
					let v0 = [...i, nx, ny, nz,     0, quadh, face, ao0];
					let v1 = [...i, nx, ny, nz, quadw, quadh, face, ao1];
					let v2 = [...i, nx, ny, nz,     0,     0, face, ao2];
					let v3 = [...i, nx, ny, nz, quadw,     0, face, ao3];
					
					v1[ax0] = j[ax0];
					v3[ax0] = j[ax0];
					v2[ax1] = k[ax1];
					v3[ax1] = k[ax1];
					
					if(s[ax0] < 0) {
						v0[ax0] ++;
						v1[ax0] ++;
						v2[ax0] ++;
						v3[ax0] ++;
					}
					
					if(s[ax1] < 0) {
						v0[ax1] ++;
						v1[ax1] ++;
						v2[ax1] ++;
						v3[ax1] ++;
					}
					
					if(nx > 0 || ny > 0 || nz > 0) {
						v0[ax2] ++;
						v1[ax2] ++;
						v2[ax2] ++;
						v3[ax2] ++;
					}
					
					if(ao0 + ao3 < ao1 + ao2) {
						mesh.push(...v1, ...v3, ...v0, ...v0, ...v3, ...v2);
					}
					else {
						mesh.push(...v0, ...v1, ...v2, ...v2, ...v1, ...v3);
					}
				}
			}
		}
	}
}

function getOcclusion(p0, p1, p2)
{
	let ao0 = getBlock(...p0) > 0 ? 1 : 0;
	let ao1 = getBlock(...p1) > 0 ? 1 : 0;
	let ao2 = getBlock(...p2) > 0 ? 1 : 0;
	
	return ao0 > 0 && ao2 > 0 ? 3 : ao0 + ao1 + ao2;
}
