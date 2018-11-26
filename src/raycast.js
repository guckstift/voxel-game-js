let sqrt  = Math.sqrt;
let floor = Math.floor;
let ceil  = Math.ceil;
let abs   = Math.abs;

export function raycast(px, py, pz, vx, vy, vz, vox)
{
	let len = sqrt(vx ** 2 + vy ** 2 + vz ** 2);
	let dx = vx / len;
	let dy = vy / len;
	let dz = vz / len;
	let ix = dx > 0 ? ceil(px) - 1 : floor(px);
	let iy = dy > 0 ? ceil(py) - 1 : floor(py);
	let iz = dz > 0 ? ceil(pz) - 1 : floor(pz);
	let sx = dx > 0 ? 1 : -1;
	let sy = dy > 0 ? 1 : -1;
	let sz = dz > 0 ? 1 : -1;
	let tdx = abs(1 / dx);
	let tdy = abs(1 / dy);
	let tdz = abs(1 / dz);
	let dnx = dx > 0 ? ceil(px) - px : px - floor(px);
	let dny = dy > 0 ? ceil(py) - py : py - floor(py);
	let dnz = dz > 0 ? ceil(pz) - pz : pz - floor(pz);
	let ntx = tdx === Infinity ? Infinity : tdx * dnx;
	let nty = tdy === Infinity ? Infinity : tdy * dny;
	let ntz = tdz === Infinity ? Infinity : tdz * dnz;
	let t = 0;
	let axis = 0;
	
	while(t <= len) {
		if(ntx < nty && ntx < ntz) {
			t = ntx;
			ntx += tdx;
			ix += sx;
			axis = 0;
		}
		else if(nty < ntz) {
			t = nty;
			nty += tdy;
			iy += sy;
			axis = 1;
		}
		else {
			t = ntz;
			ntz += tdz;
			iz += sz;
			axis = 2;
		}
		
		if(t <= len && vox(ix, iy, iz)) {
			return {
				axis,
				ix, iy, iz,
				cx: px + t * dx,
				cy: py + t * dy,
				cz: pz + t * dz,
				nx: axis === 0 ? -sx : 0,
				ny: axis === 1 ? -sy : 0,
				nz: axis === 2 ? -sz : 0,
			};
		}
	}
}
