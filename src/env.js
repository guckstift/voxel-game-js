export let env = "";

try {
	if(window) {
		env = "web";
	}
}
catch(e) {
	try {
		if(module) {
			env = "node";
		}
	}
	catch(e) {
		env = "worker";
	}
}
