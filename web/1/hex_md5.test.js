const { hex_md5 } = require("./hex_md5.js");

(async () => {
	console.assert(
		hex_md5("1756905061000") === "a98212fe5f67ea053d0c78aa140685d2",
	);
})();
