export class Queue
{
	constructor()
	{
		this.queue = [];
	}
	
	enqueue(cb)
	{
		this.queue.push(cb);
	}
	
	processQueue()
	{
		while(this.queue.length > 0) {
			this.queue.shift()();
		}
	}
}
