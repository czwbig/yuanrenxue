## 说明
1. 文档中部分代码已省略，完整代码已存放于 git 仓库中 [https://github.com/czwbig/yuanrenxue](https://github.com/czwbig/yuanrenxue)
2. 运行环境默认为 node:22，Python 3.13.7
3. 读者应已具备 web 基础，掌握 node es6 python3 语言，能使用浏览器 Devtools 工具进行网站分析

## 题目描述
任务3：抓取下列5页商标的数据，并将出现频率最高的申请号填入答案中（访问逻辑 - 推心置腹）

链接：[https://match.yuanrenxue.cn/match/3](https://match.yuanrenxue.cn/match/3)

## 题目分析
![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757040323860-adf3f110-653c-4728-8074-738abdb364bd.png)

打开隐身窗口重新登录，打开题目链接，打开 F12 ，发现每次翻页都有两个 http 请求    ![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757040599605-a5dd0d35-d450-4682-8faf-d4942a1cadba.png)



直接对 `https://match.yuanrenxue.cn/api/match/3?page=2` 请求重放无法获取到数据

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757040578890-d5a01f9f-9d41-4dea-b3c7-8aaccbdc0913.png)

但是先对 `https://match.yuanrenxue.cn/jssm` 进行重放，再去请求获取数据的接口能正常拿到数据

思路暂时确定为：每次请求获取数据的 api 之前，先请求一次 `/jssm`接口

---

查看 Network 复制其中 `/jssm`接口的请求如下

```javascript
curl 'https://match.yuanrenxue.cn/jssm' \
  -X 'POST' \
  -H 'accept: */*' \
  -H 'accept-language: zh-CN,zh;q=0.9' \
  -H 'cache-control: no-cache' \
  -H 'content-length: 0' \
  -b 'sessionid=w55nydo3j1ak1u7uwhoppxrco32d20hq; tk=6375714849390985278' \
  -H 'origin: https://match.yuanrenxue.cn' \
  -H 'pragma: no-cache' \
  -H 'priority: u=0, i' \
  -H 'referer: https://match.yuanrenxue.cn/match/3' \
  -H 'sec-ch-ua: "Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0'
```

## 验证
### 第一次验证


新建 `index.js`文件，内容如下：

```javascript
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

```



运行报错 `SyntaxError: Unexpected token '<', "<script>va"... is not valid JSON`，也就是说我们请求接口返回的数据不是一个有效的 JSON 对象，返回了一段 text，明显是还有其他的反爬措施。



### 重新查找反爬入口
回到浏览器这边，我们之前直接使用 Devtools-Network 来重发请求是可以的，为啥代码的方式不行呢。

换一种方式，不使用 Replay XHR ，复制成浏览器 Fetch 代码在 Console 执行试试



![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757043938509-5e9c2ef8-14ac-4a20-a041-6077745a7d3e.png)



![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757043987819-ecd0909d-f3ab-41b3-82df-0bceb8763dd5.png)

同样是获取失败的

---

其实第一个 `jssm`请求就已经不对劲了，正常的情况下是有响应 cookie，用代码发送的没有响应 cookie

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757044112069-91463a34-a68e-4379-9082-45a7cfe508cd.png)

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757044148910-fbc03390-a50d-4c8d-a49a-56b4a71411ad.png)



但是两个请求的 Request Headers 又是一模一样的，这就奇怪了，请求体一样，响应不一样，只能进一步抓包看一下

### jssm请求抓包
使用抓包工具（文章中使用的是 Fiddler），在浏览器中请求一次 jssm 接口之后，复制成 Fetch 代码在 Console 中运行再请求一次，他们的请求对比结果如下

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757298082305-39fb3a38-4dd2-4b4f-9609-683906ffec1e.png)

请求头的内容是一样的，但是响应就是不一样。怀疑服务端对请求头的顺序进行了检测，通过对抓包 Header 的再次确认，发现请求头的部分字段顺序确实不一样

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1757298286596-891cd8ba-2284-4dc2-a82c-862dc5ddf66d.png)

### 根据抓包的请求头编写脚本
在 node 中指定请求头顺序比较麻烦，这里我们使用 python3 重写一下之前的 `index.js`

新建 `main.py`内容如下：

```python
from collections import OrderedDict
import requests

sessionId = "l3u9wa8mh6ajlez9ivhjb6829l9ocslx";
base_url = "https://match.yuanrenxue.cn"
jssm_url = "{0}/jssm".format(base_url)
api_url = "{0}/api/match/3".format(base_url)

headers = OrderedDict([
    ("content-length", "0"),
    ("pragma", "no-cache"),
    ("cache-control", "no-cache"),
    ("sec-ch-ua-platform", '"Windows"'),
    ("user-agent",
     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"),
    ("sec-ch-ua", '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"'),
    ("sec-ch-ua-mobile", "?0"),
    ("accept", "*/*"),
    ("origin", base_url),
    ("sec-fetch-site", "same-origin"),
    ("sec-fetch-mode", "cors"),
    ("sec-fetch-dest", "empty"),
    ("referer", api_url),
    ("accept-encoding", "gzip, deflate, br, zstd"),
    ("accept-language", "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6"),
    ("priority", "u=0, i"),
    ("cookie",
     "sessionid={0}".format(sessionId))
])
proxies = {
    # "http": "http://127.0.0.1:8888",
    # "https": "http://127.0.0.1:8888"
}


def get_data(page=1):
    session = requests.Session()
    session.headers.clear()
    session.headers.update(
        headers
    )
    session.post(jssm_url)
    response = session.get(api_url, params={'page': page})
    value_list = response.json()['data']
    return list(map(lambda x: x['value'], value_list))


def main():
    count_dict = {}
    for i in range(1, 6):
        data = get_data(i)
        for key in data:
            count_dict[key] = count_dict.get(key, 0) + 1
        print("第{0}页数据: {1}".format(i, data))
    # 统计频率最高的元素
    max_count = max(count_dict, key=count_dict.get)
    print("出现频率最高: {0}".format(max_count))


if __name__ == "__main__":
    main()

```



运行结果



```shell
第1页数据: [2838, 7609, 8717, 6923, 5325, 4118, 8884, 8717, 2680, 3721]
第2页数据: [8490, 3148, 6025, 8526, 8529, 6481, 9489, 6599, 5500, 8717]
第3页数据: [185, 8498, 6102, 9222, 8717, 2008, 9827, 8717, 8224, 2929]
第4页数据: [3762, 567, 672, 8717, 9524, 7159, 986, 505, 6535, 9491]
第5页数据: [3612, 9095, 7357, 9307, 5650, 2109, 23, 8717, 2110, 2792]
出现频率最高: 8717
```

## 文件说明
+ index.js js 版本脚本（过程文件）
+ main.py python 版本脚本
+ README.md 文章内容

## 总结
此题主要考察的是抓包工具的运用以及 http 请求头的自定义顺序。

题目网站使用自定义 XHR 来实现自定义 http 请求头字段顺序反爬，爬虫请求必须按照特定顺序才能成功获取数据。



