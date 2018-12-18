let MAX_INT = 2 ** 32 - 1;

export class Field
{
	constructor(factory = () => {})
	{
		this.factory = factory;
		this.array = Array(MAX_INT);
		this.xrange = [MAX_INT, 0];
		this.yrange = [MAX_INT, 0];
		this.zrange = [MAX_INT, 0];
	}

	updateRanges(x, y, z)
	{
		this.xrange[0] = Math.min(this.xrange[0], x);
		this.xrange[1] = Math.max(this.xrange[1], x);
		this.yrange[0] = Math.min(this.yrange[0], y);
		this.yrange[1] = Math.max(this.yrange[1], y);
		this.zrange[0] = Math.min(this.zrange[0], z);
		this.zrange[1] = Math.max(this.zrange[1], z);
	}

	each(fn)
	{
		for(let z = this.zrange[0]; z <= this.zrange[1]; z++) {
			let slice = this.array[z];
			
			if(slice) {
				for(let y = this.yrange[0]; y <= this.yrange[1]; y++) {
					let column = slice[y];
					
					if(column) {
						for(let x = this.xrange[0]; x <= this.xrange[1]; x++) {
							let cell = column[x];

							if(cell) {
								fn(cell);
							}
						}
					}
				}
			}
		}
	}

	softGet(x, y, z)
	{
		x += 2 ** 31;
		y += 2 ** 31;
		z += 2 ** 31;

		if(this.array[z] === undefined) {
			this.array[z] = Array(2 ** 32 - 1);
		}

		let slice = this.array[z];

		if(slice[y] === undefined) {
			slice[y] = Array(2 ** 32 - 1);
		}

		let column = slice[y];

		return column[x];
	}

	get(x, y, z)
	{
		let ux = x + 2 ** 31;
		let uy = y + 2 ** 31;
		let uz = z + 2 ** 31;

		if(this.array[uz] === undefined) {
			this.array[uz] = Array(2 ** 32 - 1);
		}

		let slice = this.array[uz];

		if(slice[uy] === undefined) {
			slice[uy] = Array(2 ** 32 - 1);
		}

		let column = slice[uy];

		if(column[ux] === undefined) {
			column[ux] = this.factory(x, y, z);
		}

		this.updateRanges(ux, uy, uz);

		return column[ux];
	}

	set(x, y, z, a)
	{
		x += 2 ** 31;
		y += 2 ** 31;
		z += 2 ** 31;

		if(this.array[z] === undefined) {
			this.array[z] = Array(2 ** 32 - 1);
		}

		let slice = this.array[z];

		if(slice[y] === undefined) {
			slice[y] = Array(2 ** 32 - 1);
		}

		let column = slice[y];

		this.updateRanges(x, y, z);
		column[x] = a;
	}
}
