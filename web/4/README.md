## 说明
1. 文档中部分代码已省略，完整代码已存放于 git 仓库中 [https://github.com/czwbig/yuanrenxue](https://github.com/czwbig/yuanrenxue)
2. 运行环境默认为 node:22
3. 读者应已具备 web 基础，掌握 node es6 语言，能使用浏览器 Devtools 工具进行网站分析

## 题目描述
任务4：采集这5页的全部数字，计算加和并提交结果（雪碧图、样式干扰）

链接：[https://match.yuanrenxue.cn/match/4](https://match.yuanrenxue.cn/match/4)

## 题目分析
![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757328072950-24e4fcc9-5339-4407-ab4e-acac01ccdb05.png)

打开隐身窗口重新登录，打开题目链接，打开 F12 ，接口的返回值是一些 html 文本

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757328164453-c16a260d-98ee-4783-b95d-795862b337fb.png)

对 DOM 元素简单分析

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757328264348-fcba83e5-3390-4cc8-9e54-6fb22aec613b.png)



初步断定接口返回的是多张图片的 base64 值，多张图片通过 css 组合成一个数据进行展示。

### 编写测试脚本
先把接口数据拿到再分析，新建 `index.js`文件，内容如下：

```javascript
async function getData(page = 1) {
	// 这里的 sessionId 需要换成你自己的
	// 可以通过浏览器开发者工具查看请求头中的 Cookie 获取
	const sessionId = "l3u9wa8mh6ajlez9ivhjb6829l9ocslx";
	const url = "https://match.yuanrenxue.cn/api/match/4";
	const queryString = new URLSearchParams({
		page: page,
	}).toString();

	const result = await fetch(`${url}?${queryString}`, {
		headers: {
			accept: "application/json, text/javascript, */*; q=0.01",
			"accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
			"cache-control": "no-cache",
			pragma: "no-cache",
			priority: "u=0, i",
			"sec-ch-ua":
				'"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": '"Windows"',
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
			"x-requested-with": "XMLHttpRequest",
			cookie: `sessionid=${sessionId};`,
			Referer: "https://match.yuanrenxue.cn/match/4",
		},
		body: null,
		method: "GET",
	});
	const resJson = await result.json();
	console.debug("resJson:", resJson);
	if (result.ok) {
		return resJson;
	}
	throw new Error(`请求失败，状态码：${result.status}`);
}

(async () => {
	await getData();
})();

```



同样参数运行两次，获取到请求数据如下

```javascript
// 第一次请求
{
	"status": "1",
	"state": "success",
	"key": "KrNIhaqAvj",
	"value": "3jA5iN0p1t",
	"iv": "uyzhs",
  "info": "...省略"
}

// 第二次请求
{
  "status": "1",
  "state": "success",
  "key": "83i15dv0rx",
  "value": "lAsr31a51m",
  "iv": "aohry",
  "info": "...省略"
}
```

对比两次请求返回的数据

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757382267644-45981180-05f4-4a1f-921e-5abbdaba4d91.png)

不难发现 [key, value, iv, info] 这个 4 元组应该能通过某种运算渲染成网页数据。

接下来就是寻找运算方法。



### 页面 dom 分析


请求跟栈到 `request`方法

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757383471191-dfdd6848-0f67-4ac6-8292-0fe7a5e9a213.png)

Devtools-Srouces-Snippets 新建一个 Snippets，将跟栈得到的代码格式化保存到其中，代码如下

```javascript
window.url = '/api/match/4';
request = function () {
    var list = {
        "page": window.page,
    };
    $.ajax({
        url: window.url,
        dataType: "json",
        async: false,
        data: list,
        type: "GET",
        beforeSend: function (request) {
        },
        success: function (data) {
            datas = data.info;
            $('.number').text('').append(datas);
            var j_key = '.' + hex_md5(btoa(data.key + data.value).replace(/=/g, ''));
            $(j_key).css('display', 'none');
            $('.img_number').removeClass().addClass('img_number')
        },
        complete: function () {
        },
        error: function () {
            alert('因未知原因，数据拉取失败。可能是触发了风控系统');
            alert('生而为虫，我很抱歉');
            $('.page-message').eq(0).addClass('active');
            $('.page-message').removeClass('active')
        }
    })
}
;
request()
```



关注 `success`方法，在 `j_key`这打一个断点，运行拿到一组数据，保存到新建文件 `sample.json`中

```javascript
{
	"status": "1",
	"state": "success",
	"key": "KrNIhaqAvj",
	"value": "3jA5iN0p1t",
	"iv": "uyzhs",
  "info": "...省略"
}
```



新建 info.html 文件，单独把 info 的值保存下来

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757384017488-513b2d19-be3b-4094-9d16-1ec653bbdbc6.png)



在 info.html 中搜索`j_key = .51853c1de87185997c779477d38fcafc`的值，根据 `request` 方法逻辑，是要把 j_key 这些 class 设置为不可见。

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757384142568-a743d842-1e8e-45ce-9564-e61fbcdf9d81.png)



修改 info.html 文件，在底部增加样式代码，并在`td`标签外面包一层 `table``tr`，最终的 `info.html`文件如下：

```html
<table>
    <tbody>
      <tr>data.info内容，...省略</tr>
    </tbody>
</table>
<script>
    let hideImgDoms = document.getElementsByClassName('51853c1de87185997c779477d38fcafc')
    for (const hideImgDom of hideImgDoms) {
        hideImgDom.style.display = 'none';
    }
</script>

```

使用浏览器打开 info.html 文件，显示如下

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757384911764-4299cbce-5de4-4b97-9ac9-5c79b730ee2a.png)

对比一下网页原来的第一页数据截图

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757384928830-42b96b62-b42a-4953-bc93-a74ea1ea8f04.png)



数字已经出来了，但是部分数字的顺序不对，对比原网站的 Dom 元素和 info.html

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757405359081-fc90326b-642f-4ece-b0de-3f4b7630ba00.png)

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757405322063-a8cce883-80a2-4a61-a1f6-342b6da549a4.png)

从 html 结构来说，两个页面的第一个 `td``img`标签的图片都是 0，他们不同的地方是样式。

info.html 的 `img`标签的内联样式没有生效 `style="left:11.5px"`，这里涉及到前端页面布局的知识，需要把 `img`的定位方式改成相对定位，其 `left`样式才会生效

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757407178899-5b9f9f9e-a99b-487c-bae5-6165954cff32.png)



在 `info.html`底部增加如下 css

```css
<style>
    td {
        padding: 4px;
    }
    img {
        width: 11px;
        height: 19px;
        display: inline-block;
        position: relative;
    }
</style>
```

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757407375539-4a4b0444-9fba-45b2-9a00-05f792982dac.png)

数据正常显示。

## 验证
### 编写 ocr 数字识别方法
可以 tesseract 来做 ocr 识别，jimp 预处理图片，使用把`sample.json` 写在代码里面一次一次试，找到识别率最佳的方式，我一开始是一个一个数字识别，识别率不高，后来把多张图片合并到一起并且增加内边距识别率才好一些。

###   最终代码
新建 `getNumberFromData.js`文件，内容如下

```javascript
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

```



修改 `index.js`内容如下

```javascript
const getNumberFromData = require("./getNumberFromData.js");

async function getData(page = 1) {
	// 这里的 sessionId 需要换成你自己的
	// 可以通过浏览器开发者工具查看请求头中的 Cookie 获取
	const sessionId = "l3u9wa8mh6ajlez9ivhjb6829l9ocslx";
	const url = "https://match.yuanrenxue.cn/api/match/4";
	const queryString = new URLSearchParams({
		page: page,
	}).toString();

	const result = await fetch(`${url}?${queryString}`, {
		headers: {
			accept: "application/json, text/javascript, */*; q=0.01",
			"accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
			"cache-control": "no-cache",
			pragma: "no-cache",
			priority: "u=0, i",
			"sec-ch-ua":
				'"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": '"Windows"',
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
			"x-requested-with": "XMLHttpRequest",
			cookie: `sessionid=${sessionId};`,
			Referer: "https://match.yuanrenxue.cn/match/4",
		},
		body: null,
		method: "GET",
	});
	const resJson = await result.json();
	if (result.ok) {
		return getNumberFromData(resJson);
	}
	throw new Error(`请求失败，状态码：${result.status}`);
}

(async () => {
	let prices = [];
	for (let page = 1; page < 6; page++) {
		const pagePrices = await getData(page);
		console.log("page:", page, "pagePrices:", pagePrices);
		prices = prices.concat(pagePrices);
	}
	const sum = prices.reduce((acc, cur) => acc + cur, 0);
	console.log("sum:", sum);
})();

```



运行输出 `sum: 243701`



## 文件说明


+ eng.traineddata ocr识别库的训练文件，已提交到代码库，如果不存在需要联网下载
+ getNumberFromData.js 解析页面数据返回数字
+ index.js 脚本入口
+ info.html 用于分析的过程文件
+ package.json node 项目依赖
+ README.md 文章内容
+ sample.json 用于分析的过程文件
+ test.png 过程文件，预处理图片，识别前的图片，用于调试优化识别率

## 总结
此题主要考察的是 web 基本功，dom 和 css 相关知识，以及 ocr 库的使用

