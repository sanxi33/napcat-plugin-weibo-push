# napcat-plugin-weibo-push

在 QQ 群里直接查微博，还能自动推送新微博到群聊。不用打开微博 App，也不用爬虫配环境。

## 下载安装

去 [Releases](https://github.com/sanxi33/napcat-plugin-weibo-push/releases) 下载最新的 `napcat-plugin-weibo-push.zip`，然后在 NapCat 的插件管理里导入并启用就行。

NapCat 版本 >= `4.15.19` 的，点这个按钮直接跳转安装页：

<a href="https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-weibo-push" target="_blank">
  <img src="https://github.com/NapNeko/napcat-plugin-index/blob/pages/button.png?raw=true" alt="在 NapCat WebUI 中打开" width="170">
</a>

## 配置

第一次装好后，先填这两个最重要的字段：

- `userId` —— 目标微博账号的数字 UID（比如 `1195242865`）
- `adminQqList` —— 你的 QQ 号，只有这个号能控制开关

完整默认配置参考：

```json
{
  "enabled": true,
  "commandPrefix": "/",
  "userId": "1195242865",
  "requestTimeoutMs": 10000,
  "pollMinutes": 240,
  "adminQqList": "123456789",
  "pushStatePath": "data/weibo-push-state.json",
  "weiboCookieFile": "",
  "weiboCookie": ""
}
```

`weiboCookie` 和 `weiboCookieFile` 是可选的。不带 Cookie 也能用，但某些账号抓取稳定性会差一些。

## 命令

查微博：

```
/微博
/微博列表
/最新微博
/第1条微博
```

控制推送：

```
/开启微博推送
/关闭微博推送
```

简单说下顺序：先配好 `userId`，发个 `/微博` 看看能不能拉到列表，能返回了再试 `/第1条微博`，最后在群里开推送就行。

## 注意

- 插件走的是微博页面和公开接口，不是官方开发者 API
- 没有有效 Cookie 时部分账号可能受限
- 上游接口结构改了的话，插件得跟着更新

## License

MIT
