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
