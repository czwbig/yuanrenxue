## 说明
1. 文档中部分代码已省略，完整代码已存放于 git 仓库中 [https://github.com/czwbig/yuanrenxue](https://github.com/czwbig/yuanrenxue)
2. 运行环境默认为 node:22
3. 读者应已具备 web 基础，掌握 node es6 语言，能使用浏览器 Devtools 工具进行网站分析

## 题目描述
题目1：抓取所有（5页）机票的价格，并计算所有机票价格的平均值，填入答案。

链接：[https://match.yuanrenxue.cn/match/1](https://match.yuanrenxue.cn/match/1)

## 题目分析
打开题目链接，打开 F12，发现有个简单的防 debug

```javascript
setInterval(function () {
    debugger
}, 500)
```

直接在 debugger 这行前面鼠标右键 `Never pause here`就可以了  
![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756808574768-ef261e7d-c3a5-4a91-9fac-a758f23ba9f3.png)

接下来查看Network，发现数据是通过XHR请求获取的

```bash
curl 'https://match.yuanrenxue.cn/api/match/1?page=2&m=1c9814ad9ca24c1dae7bb24dab43c6fa%E4%B8%A81756819123' \
  -H 'accept: application/json, text/javascript, */*; q=0.01' \
  -H 'accept-language: zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6' \
  -H 'cache-control: no-cache' \
  -b 'Hm_lvt_434c501fe98c1a8ec74b813751d4e3e3=1750735528,1751443282; sessionid=l3u9wa8mh6ajlez9ivhjb6829l9ocslx; no-alert3=true; tk=6375714849390985278' \
  -H 'pragma: no-cache' \
  -H 'priority: u=0, i' \
  -H 'referer: https://match.yuanrenxue.cn/match/1' \
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
| m | 验证参数 |


这里大概率就是要求解 m 参数的生成了


![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756808574867-fd49228b-cbae-44be-b8bd-b834b7234575.png)

### m 参数分析
1. m 参数是一个加密参数，长度固定为 40 位
2. m 参数的前 32 位，貌似是一个 MD5 值，后 8 位是一个时间戳

通过该请求的调用栈，我们可以轻易发现 m 参数的生成入口，request() 方法  
![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756808574933-add3b5a8-4bed-4f10-a8b9-b2cf36d7896b.png)

request方法定义如下:

```javascript
window['\x75\x72\x6c'] = '\x2f\x61\x70\x69\x2f' + '\x6d\x61\x74\x63\x68' + '\x2f\x31',
    request = function () {
        var _0x2268f9 = Date['\x70\x61\x72\x73\x65'](new Date()) + (16798545 + -72936737 + 156138192)
            , _0x57feae = oo0O0(_0x2268f9['\x74\x6f\x53\x74\x72' + '\x69\x6e\x67']()) + window['\x66'];
        const _0x5d83a3 = {};
        _0x5d83a3['\x70\x61\x67\x65'] = window['\x70\x61\x67\x65'],
            _0x5d83a3['\x6d'] = _0x57feae + '\u4e28' + _0x2268f9 / (-1 * 3483 + -9059 + 13542);
        var _0xb89747 = _0x5d83a3;
        // ... 中间代码省略
    }
    ,
    request();

```

代码量不多，使用 ob 解混淆工具([https://tool.yuanrenxue.cn/decode_obfuscator)](https://tool.yuanrenxue.cn/decode_obfuscator))  试试

```javascript
window["url"] = "/api/match/1";

request = function () {
    var _0x2268f9 = Date["parse"](new Date()) + 100000000,
        _0x57feae = oo0O0(_0x2268f9["toString"]()) + window["f"];

    const _0x5d83a3 = {
        "page": window["page"],
        "m": _0x57feae + "丨" + _0x2268f9 / 1000
    };
    $["ajax"]({
        "url": window["url"],
        "dataType": "json",
        "async": false,
        "data": _0x5d83a3,
        "type": "GET",
        "beforeSend": function (_0x4c488e) {
        },
        "success": function (_0x131e59) {
            _0x131e59 = _0x131e59["data"];
            // ...中间代码省略
        },
        "complete": function () {
        },
        "error": function () {
            alert("数据拉取失败。可能是触发了风控系统，若您是正常访问，请使用谷歌浏览器无痕模式，并且校准电脑的系统时间重新尝试");
            alert("生而为虫，我很抱歉，请刷新页面，查看问题是否存在");
            $(".page-message")["eq"](0)["addClass"]("active");
            $(".page-message")["removeClass"]("active");
        }
    });
};

request();
```

复制这段代码到浏览器运行，发现能正常获取到数据，在第 11 行打断点运行试试

![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756808575166-d5a5bb15-863c-4ced-ba93-057c56428cd2.png)

```javascript
      _0x57feae = oo0O0(_0x2268f9["toString"]()) + window["f"];
```



这行代码，window["f"]的值和最终_0x57feae变量的值是一样的，说明oo0O0函数返回的是空字符串，可以复制  
`oo0O0(_0x2268f9["toString"]())`在Console执行来验证一下


但 window["f"] 的值每次都不同，所以 oo0O0 函数的作用应该就是给 window["f"] 赋值。

因此，我们破解 oo0O0 方法即可。

在 Console 中执行 `oo0O0`，得到函数的源码

```javascript
    function oo0O0(mw) {
    window.b = '';
    for (var i = 0, len = window.a.length; i < len; i++) {
        console.log(window.a[i]);
        window.b += String[document.e + document.g](window.a[i][document.f + document.h]() - i - window.c)
    }
    var U = ['W5r5W6VdIHZcT8kU', 'WQ8CWRaxWQirAW=='];
      // ... 中间代码省略
    eval(atob(window['b'])[J('0x0', ']dQW')](J('0x1', 'GTu!'), '\x27' + mw + '\x27'));
    return ''
}
```

直接复制在浏览器运行，发现能得到 window["f"] 的值  
![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756808575227-7532fe34-263a-4c1e-9063-0fe769ded708.png)

---

通过断点分析，可以发现 window['b'] 是一个常量，这个常量字符串是后面要eval执行的函数文本。

先分析 eval 这行  
![](https://cdn.nlark.com/yuque/0/2025/png/35830811/1756808575287-8b5a5f1c-c88e-4544-8b20-9eb9ed12e88d.png)

在 eval 这行断点时，console 执行 `atob(window['b']).replace('mwqqppz', '\x27' + mw + '\x27')`

得到的值保存到一个 hex_md5.js 文件

```javascript
// biome-ignore-all lint: <explanation>

var hexcase = 0;
var b64pad = "";
var chrsz = 16;

function hex_md5(a) {
    return binl2hex(core_md5(str2binl(a), a.length * chrsz));
}

// ... 中间代码省略

function binl2b64(d) {
    var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var f = "";
    for (var b = 0; b < d.length * 4; b += 3) {
        var e =
            (((d[b >> 2] >> (8 * (b % 4))) & 255) << 16) |
            (((d[(b + 1) >> 2] >> (8 * ((b + 1) % 4))) & 255) << 8) |
            ((d[(b + 2) >> 2] >> (8 * ((b + 2) % 4))) & 255);
        for (var a = 0; a < 4; a++) {
            if (b * 8 + a * 6 > d.length * 32) {
                f += b64pad;
            } else {
                f += c.charAt((e >> (6 * (3 - a))) & 63);
            }
        }
    }
    return f;
}

module.exports = { hex_md5 };

```

## 验证
### hex_md5 验证
取一次正确的 m 值记录下来，方便验证

```javascript
a98212fe5f67ea053d0c78aa140685d2丨1756905061
```

也就是说要确保，hex_md5('1756905061000') === 'a98212fe5f67ea053d0c78aa140685d2'

可以使用如下代码测试

```javascript
const {hex_md5} = require("./hex_md5.js");

(async () => {
    console.assert(
        hex_md5("1756905061000") === "a98212fe5f67ea053d0c78aa140685d2",
    );
})();

```

---

### 接口验证
```javascript
async function getData(page = 1) {
    // 这里的 sessionId 需要换成你自己的
    // 可以通过浏览器开发者工具查看请求头中的 Cookie 获取
    const sessionId = "l3u9wa8mh6ajlez9ivhjb6829l9ocslx";
    const url = "https://match.yuanrenxue.cn/api/match/1";
    const timestamp = Date["parse"](new Date()) + 100000000,
        hexMd5Value = hex_md5(timestamp.toString());

    const queryString = new URLSearchParams({
        page: page,
        m: `${hexMd5Value}丨${timestamp / 1000}`,
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
            cookie: `sessionid=${sessionId}`,
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

```

最终代码:

```javascript
/**
 * 使用 hex_md5.js 来获取 m 值，发送请求获取前 5 页的机票价格
 */

(async () => {
    let prices = [];
    for (let page = 1; page < 6; page++) {
        const pagePrices = await getData(page);
        console.log(`第 ${page} 页机票价格:`, pagePrices);
        prices = prices.concat(pagePrices);
    }
    const sum = prices.reduce((acc, cur) => acc + cur, 0);
    const avg = sum / prices.length;
    console.log("所有机票价格的平均值:", avg);
})();
```

输出: `所有机票价格的平均值: 4700`

