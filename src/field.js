export class Field
{
	constructor(factory = () => {})
	{
		this.factory = factory;
		this.array = Array(2 ** 32 - 1);
	}
	
	get(x, y, z)
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
		
		if(column[x] === undefined) {
			column[x] = this.factory(x, y, z);
		}
		
		return column[x];
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
		
		column[x] = a;
	}
}
