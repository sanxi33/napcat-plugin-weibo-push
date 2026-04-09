# napcat-plugin-weibo-push

一个 NapCat 原生插件，用于查询指定微博账号的微博，并支持定时推送到 QQ 群。

## 功能

- 查看微博列表：`微博`
- 查看指定条目：`第N条微博`
- 群管理员可开启/关闭本群微博推送
- 定时轮询最新微博并推送到已启用群

## 依赖

仓库内已包含 `scripts/weibo_reader.py`，插件默认通过：

```text
py -3 scripts/weibo_reader.py
```

执行抓取逻辑。

运行前请确认：

- 系统已安装 Python
- `py -3` 可用
- Python 环境中安装了 `requests`

## 配置

```json
{
  "enabled": true,
  "commandPrefix": "球鳖",
  "userId": "",
  "requestTimeoutMs": 10000,
  "pollMinutes": 240,
  "adminQqList": [],
  "pushStatePath": "data/weibo-push-state.json",
  "weiboCookieFile": "",
  "weiboCookie": "",
  "weiboReaderScript": "./scripts/weibo_reader.py"
}
```

## 安装

1. 安装 Python，并确保 `py -3` 可用
2. 安装依赖：`py -3 -m pip install requests`
3. 下载当前仓库 [Releases](https://github.com/sanxi33/napcat-plugin-weibo-push/releases) 中的 `napcat-plugin-weibo-push.zip`
4. 在 NapCat 插件管理中导入压缩包
5. 配置 `userId`、Cookie 和管理员 QQ

## 已知限制

- 插件依赖微博页面和接口可访问性
- 没有有效 Cookie 时，部分账号抓取可能受限
- 需要本机 Python 运行环境

## License

MIT
