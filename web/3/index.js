async function getData(page = 1) {
	// 这里的 sessionId 需要换成你自己的
	// 可以通过浏览器开发者工具查看请求头中的 Cookie 获取
	const sessionId = "l3u9wa8mh6ajlez9ivhjb6829l9ocslx";
	const url = "https://match.yuanrenxue.cn/api/match/3";
	const queryString = new URLSearchParams({
		page: page,
	}).toString();
	const jssmResult = await fetch("https://match.yuanrenxue.cn/jssm", {
		headers: {
			accept: "*/*",
			"accept-language": "zh-CN,zh;q=0.9",
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
			cookie: `sessionid=${sessionId};`,
			Referer: "https://match.yuanrenxue.cn/match/3",
		},
		body: null,
		method: "POST",
	});
	console.log(
		"jssmResult.status:",
		jssmResult.status,
		"jssm ok:",
		jssmResult.ok,
	);
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
			Referer: "https://match.yuanrenxue.cn/match/3",
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
	await getData();
})();
