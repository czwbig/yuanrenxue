const { spawn } = require("node:child_process");

const jsFile = "./decode_one_line.js";

async function getMValue() {
	return new Promise((resolve, reject) => {
		const child = spawn("node", [jsFile]);

		let output = "";
		child.stdout.on("data", (data) => {
			output = data.toString();
			child.kill();
		});

		child.on("close", (code) => {
			if (output) {
				resolve(output.match(/mundefined=([a-f0-9]{32}\|\d+); path=\//)[1]);
			} else {
				reject(`子进程退出，退出码 ${code}`);
			}
		});
	});
}

getMValue().then(console.log).catch(console.error);
module.exports = getMValue;
