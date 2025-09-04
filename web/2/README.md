## 说明
1. 文档中部分代码已省略，完整代码已存放于 git 仓库中 [https://github.com/czwbig/yuanrenxue](https://github.com/czwbig/yuanrenxue)
2. 运行环境默认为 node:22
3. 读者应已具备 web 基础，掌握 node es6 语言，能使用浏览器 Devtools 工具进行网站

## 题目描述
题目2：提取全部5页发布日热度的值，计算所有值的加和,并提交答案（动态 cookie）

链接：[https://match.yuanrenxue.cn/match/1](https://match.yuanrenxue.cn/match/1)

## 题目分析
打开题目链接，打开 F12 ，跟第一题一样，有防爬的 debugger 直接在 debugger 这行前面鼠标右键 `Never pause here`就可以了。


查看Network，发现数据是通过 XHR 请求获取的

```bash
curl 'https://match.yuanrenxue.cn/api/match/2?page=1' \
  -H 'accept: application/json, text/javascript, */*; q=0.01' \
  -H 'accept-language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6' \
  -H 'cache-control: no-cache' \
  -b 'Hm_lvt_434c501fe98c1a8ec74b813751d4e3e3=1750735528,1751443282; sessionid=l3u9wa8mh6ajlez9ivhjb6829l9ocslx; no-alert3=true; tk=6375714849390985278; m=fc7c33b706625d87bb15b8ccb5cd22da|1756884679000' \
  -H 'pragma: no-cache' \
  -H 'priority: u=0, i' \
  -H 'referer: https://match.yuanrenxue.cn/match/2' \
  -H 'sec-ch-ua: "Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0' \
  -H 'x-requested-with: XMLHttpRequest'
```

### 请求参数
| 参数 | 说明 |
| --- | --- |
| page | 页码 |
| m | 验证参数，存于 cookie 中 |


这里大概率就是要求解 cookie 中 m 参数的生成了



### m 参数分析
> <font style="color:rgb(31, 31, 31);">m=fc7c33b706625d87bb15b8ccb5cd22da|1756884679000</font>
>

因为 cookie 是在请求之前就已经赋值了，所以无法通过该请求的调用栈来获取 m 的生成，我们需要 hook 的方式来拦截 cookie 的设置


浏览器安装油猴插件（tampermonkey），并新建如下用户脚本

```javascript
// ==UserScript==
// @name         爬虫hook
// @namespace    http://tampermonkey.net/
// @version      2025-05-20
// @description  try to take over the world!
// @author       You
// @include       *
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yuanrenxue.cn
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log('脚本加载于：', document.readyState);
    Function.prototype.constructor_ = Function.prototype.constructor;
    Function.prototype.constructor = function (a) {
        if (a == "debugger"){
            return function (){};
        }
        return Function.prototype.constructor_(a);
    }
    var cookieTemp = '';
    Object.defineProperty(document, 'cookie', {
        set: function(val) {
            if (val.indexOf('m') != -1) {
                debugger;
            }
            console.log('Hook捕获到cookie设置->', val);
            cookieTemp = val;
            return val;
        },
        get: function() {
            return cookieTemp;
        },
    });
})();
```



注意要设置脚本的运行时器为 `document-start`，滚动到页面底部点击保存。如果还是无法 hook 到 cookie 的设置，把浏览器其他插件都禁用，只保留油猴插件试试

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756885102800-7e6ce780-635c-4b64-9a13-4591b4171185.png)



新建浏览器隐身窗口，打开 [https://match.yuanrenxue.cn/list](https://match.yuanrenxue.cn/list) 并登录，打开 F12 调试窗口，点击第 2 题进入详情页面。

结果页面一直在加载进不去，并且 url 也一直在变

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756886526090-a7c84635-63c9-4a28-9d4f-1e09b3351c55.png)



网页应该做了反 hook，检测到我们 hook 了 cookie，一直重定向把网页卡住。可以尝试更换其他 hook 方式，例如使用 filldler 抓包注入。

hook 成功的情况下，我们可以看到 m 的生成位置，如下图



![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756953660749-720e83ba-15fd-43a5-a818-99dc01efdb36.png)

点击调用栈进入 VM1142 文件，复制整个文件保存到本地备用，命名为 `origin.js`，然后再使用 ob 解混淆工具([https://tool.yuanrenxue.cn/decode_obfuscator)](https://tool.yuanrenxue.cn/decode_obfuscator))  解混淆后保存到本地文件 `decode.js`



打开 web 题目列表页面，把 `decode.js`的内容放入新建的 snippet 中运行，发现浏览器控制器报错

```javascript
VM1119 Script snippet #6:15 
 Uncaught RangeError: Invalid string length
    at Object.setCookie (VM1119 Script snippet #6:15:36)
    at _0x40a0cc (VM1119 Script snippet #6:45:23)
    at VM1119 Script snippet #6:52:5
    at VM1119 Script snippet #6:53:2
```

根据报错信息点进去，报错的15行打断点，发现进入了死循环，如下图

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756955236612-7317b653-5eb3-4ada-b68f-5c5d7832049c.png)

沿着调用栈往上看，发现是 `_0x23f1e1`这个变量为 false 导致的

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756955444550-4b620d16-ff9a-4f04-b941-685aac909d35.png)

刷新网页，中止运行，我们先把 44 行这里的判断条件修改一下让其不进入试试

发现又进入了另一个死循环，查看两个死循环的入口条件，都是根据方法 `toString()`返回值判断的，也就是代码使用了正则来判断代码是否被格式化过，如果格式化了，就拒绝执行正确的逻辑。



把代码压缩成一行（可以使用 IDEA `ctrl + shift + j`或者一些在线工具[https://www.mayicms.com/js/](https://www.mayicms.com/js/)）重新执行试试

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756957258339-9dbd8726-0657-461c-944d-38bef0857a4d.png)



能正常运行，因此我们可以把代码格式化之后修改好，然后压缩成一行再运行即可。



![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756957400287-12ce1ff1-d9f2-4fde-b711-a86ad0b5610a.png)



等号的左边是 document.cookie ，右边应该就是生成 m 值的函数，通过在控制台输入下面这行代码能正常打印出 m 值

```javascript
_0x303990[$dbsm_0x283d("0xc5", "V#Su") + "nD"](_0x303990[$dbsm_0x283d("0x46", "hw(M") + "nD"](_0x303990[$dbsm_0x283d("0x3c0", "Tc9C") + "nD"](_0x303990[$dbsm_0x283d("0x39c", "CD1Q") + "DM"](_0x303990[$dbsm_0x283d("0x91", "x#vD") + "DM"](_0x303990[$dbsm_0x283d("0x31a", "^08G") + "DM"]("m", _0x303990.UQIlL(_0x5914e9)), "="), _0x303990[$dbsm_0x283d("0x19d", ")i$O") + "yv"](_0x2fb4a4, x)), "|"), x), _0x303990[$dbsm_0x283d("0x2a2", "Wch7") + "ub"])
```



![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756967353765-29ac966a-f4ed-44a6-8971-27fa8dbd2418.png)![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756967662120-753c0e92-b223-437a-bc56-c55dc8ee8264.png)

在头部定义一个变量`mValue`并把等号左边替换成给其赋值，把其下方的 location 这行删除，这行是刷新页面用的。



把代码压缩成一行运行测试

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756967833147-35965a60-8056-4e6f-965f-ca24c771b537.png)

成功拿到 m 值



## 脱离浏览器执行


接下来想办法让这段混淆后的代码能脱离浏览器环境运行，可以直接在 node 或者普通的 js 解释器中执行，我们先试试直接在 node 22 中运行

首先在脚本头部增加如下代码来屏蔽无限 debugger

```javascript
    Function.prototype.constructor_ = Function.prototype.constructor;
    Function.prototype.constructor = function (a) {
        if (a === "debugger"){
            return function (){};
        }
        return Function.prototype.constructor_(a);
    }
```

运行报如下错误

```javascript
TypeError [ERR_INVALID_ARG_TYPE]: The "callback" argument must be of type function. Received undefined
    at setInterval (node:timers:181:3)
    at _0x8c024a.<computed> [as vGDuh] (C:\Users\czwbi\IdeaProjects\yuanrenxue\web\2\decode_one_line.js:1:38701)
    at $dbsm_0x1d6dd6 (C:\Users\czwbi\IdeaProjects\yuanrenxue\web\2\decode_one_line.js:1:104035)
    at Object.<anonymous> (C:\Users\czwbi\IdeaProjects\yuanrenxue\web\2\decode_one_line.js:1:104192)
```



提示 `setInterval`方法的参数不能为 undefined ，这在浏览器环境中是被允许的，node 中该方法不允许这样，我们重写 `setInterval`试试

```javascript
window = globalThis;
// 重写setInterval，如果参数是undefined，则改为传入一个空函数
var originalSetInterval = globalThis.setInterval;
globalThis.setInterval = function (fn, delay) {
    if (!fn) fn = () => {};
    return originalSetInterval(fn, delay);
}
```

运行报错  `ReferenceError: history is not defined` ,继续根据提示补充 history 对象。

最终头部补充如下

```javascript
var mValue = null;
Function.prototype.constructor_ = Function.prototype.constructor;
Function.prototype.constructor = function (a) {
    if (a === "debugger"){
        return function (){};
    }
    return Function.prototype.constructor_(a);
}
var window = globalThis;
// 重写setInterval，如果参数是undefined，则改为传入一个空函数
var originalSetInterval = globalThis.setInterval;
globalThis.setInterval = function (fn, delay) {
    if (!fn) fn = () => {};
    return originalSetInterval(fn, delay);
}
var history = {}
```



尾部补充一行`module.exports = mValue;`把 `mValue`的值导出。

修改后，把压缩成一行的代码放入一个新的 `decode_one_line.js`文件中，使用 node 运行



![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756969619818-592e404c-ff45-42ac-bf46-9a3df9f22c18.png)

成功拿到 mValue，这里注意 `console.log(mValue)`会报错，定位到是 console 对象被重写了

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756970686242-335f95ef-944e-4c85-9031-6595eb700c6c.png)

因此我们需要把这段代码隔离开运行，跟主进程的解释器分开，防止主进程被污染，

`decode.js`尾部的 `module.exports = mValue;`改成 `process.stdout.write(mValue);`

新建一个 `getMValue.js`文件，内容如下：

```javascript
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

		child.stderr.on("data", (data) => {
			reject(data.toString());
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

getMValue().then(console.log);
module.exports = getMValue;

```

运行结果 `0da02fa8569a0e436623d47b24aa3389|1756973015000`

## 验证
### 接口验证


新建 `index.js`文件，内容如下：

```javascript
const getMValue = require("./getMValue.js");

async function getData(page = 1) {
	const mValue = await getMValue();
	// 这里的 sessionId 需要换成你自己的
	// 可以通过浏览器开发者工具查看请求头中的 Cookie 获取
	const sessionId = "l3u9wa8mh6ajlez9ivhjb6829l9ocslx";
	const url = "https://match.yuanrenxue.cn/api/match/2";
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
			cookie: `sessionid=${sessionId};m=${mValue};`,
			Referer: "https://match.yuanrenxue.cn/match/1",
		},
		body: null,
		method: "GET",
	});
	const resJson = await result.json();
	console.debug("resJson:", resJson);
	if (result.ok) {
		return resJson.data.map((item) => item.value);
	}
	throw new Error(`请求失败，状态码：${result.status}`);
}

(async () => {
	let prices = [];
	for (let page = 1; page < 6; page++) {
		const pagePrices = await getData(page);
		prices = prices.concat(pagePrices);
	}
	const sum = prices.reduce((acc, cur) => acc + cur, 0);
	console.log("sum:", sum);
})();

```



输出: `sum: 248974`



## 文件说明
+ decode.js 使用ob反混淆后的代码
+ decode_one_line.js decode.js压缩成一行的代码
+ getMValue.js 封装的获取 m 值方法
+ index.js 运行入口
+ origin.js 从浏览器从拿到的原始混淆js
+ README.md 文章内容



