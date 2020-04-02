export default class Speaker
{
	constructor()
	{
		this.ctx = new AudioContext();
	}
	
	activate()
	{
		this.ctx.resume();
	}
	
	async loadSound(url)
	{
		let response = await fetch(url);
		let buffer = await response.arrayBuffer();
		
		return await this.ctx.decodeAudioData(buffer);
	}
	
	playSound(sound)
	{
		let source = this.ctx.createBufferSource();
		
		source.buffer = sound;
		source.connect(this.ctx.destination);
		source.start();
	}
}
