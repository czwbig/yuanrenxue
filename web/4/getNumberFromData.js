const crypto = require("node:crypto");
// 图像识别库
const { createWorker } = require("tesseract.js");
// 图片处理库，组合多个图片，灰度处理等
const { Jimp } = require("jimp");

async function getNumberFromData(data) {
	const base64Str = Buffer.from(data.key + data.value)
		.toString("base64")
		.replace(/=/g, "");
	const hideClassName = crypto
		.createHash("md5")
		.update(base64Str)
		.digest("hex");
	const numbers = [];
	const tdContents = data.info.match(/(<td>[\s\S]+?<\/td>)/g);
	const worker = await createWorker("eng");
	for (const tdContent of tdContents) {
		const imgs = tdContent.match(/<img [^>]*src="([^"]+)"[^>]*>/g);
		const filterImgs = imgs.filter((img) => !img.includes(hideClassName));
		numbers.push(await getNumberFromImgs(worker, filterImgs));
	}
	await worker.terminate();
	return numbers;
}

async function getNumberFromImgs(worker, imgs) {
	const formatImgs = imgs.map((img) => {
		const imgBase64Content = img.match(
			/src="data:image\/png;base64,([^"]+)"/,
		)[1];
		const left = parseFloat(
			img.match(/style="[^"]*left:(-?[\d.]+)px;?[^"]*"/)[1],
		);
		return { content: imgBase64Content, left };
	});
	const sortedImgs = new Array(formatImgs.length);
	const step = 11.5;
	for (let i = 0; i < formatImgs.length; i++) {
		const idx = i + Math.round(formatImgs[i].left / step);
		sortedImgs[idx] = formatImgs[i].content;
	}
	const numberText = await getNumberFromImgByOcr(worker, sortedImgs);
	return parseInt(numberText, 10);
}

async function getNumberFromImgByOcr(worker, imgs) {
	await worker.setParameters({
		tessedit_char_whitelist: "0123456789", // 只识别数字
		tessedit_pageseg_mode: "8",
	});
	const imgBuffer = await preprocessImage(
		imgs.map((img) => Buffer.from(img, "base64")),
	);
	const fs = require("fs");
	fs.writeFileSync("./test.png", imgBuffer);
	const ret = await worker.recognize(imgBuffer);
	return ret.data.text.trim();
}

// 图像预处理函数
async function preprocessImage(imgBuffers) {
	// 从左到右拼接，然后再处理
	const padding = 10; // 每张图片之间的间隔
	const images = await Promise.all(imgBuffers.map((buf) => Jimp.read(buf)));
	const totalWidth = images.reduce(
		(sum, img) => sum + img.bitmap.width + padding,
		padding,
	);
	const maxHeight =
		Math.max(...images.map((img) => img.bitmap.height)) + padding * 2;
	const combinedImage = new Jimp({
		width: totalWidth,
		height: maxHeight,
		color: "black",
	});
	let xOffset = padding;
	for (const img of images) {
		combinedImage.composite(img, xOffset, padding);
		xOffset += img.bitmap.width + padding;
	}
	return await combinedImage
		.greyscale() // 灰度化
		.contrast(1) // 增强对比
		.normalize() // 标准化
		.getBuffer("image/png");
}

module.exports = getNumberFromData;
