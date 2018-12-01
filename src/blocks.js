/*
	types:
		0: empty/air
		1: solid
	faces:
		[front, right, back, left, top, bottom]
*/

export let blocks = [
	{
		name: "air",
		type: 0,
	},
	{
		name: "grass",
		type: 1,
		faces: [2, 2, 2, 2, 0, 1],
	},
	{
		name: "stone",
		type: 1,
		faces: [3, 3, 3, 3, 3, 3],
	},
	{
		name: "dirt",
		type: 1,
		faces: [1, 1, 1, 1, 1, 1],
	},
];
