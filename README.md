# napcat-plugin-weibo-push

一个为 NapCat 设计的微博查询与推送插件。它可以在群里查看某个微博账号最近的内容，也可以把新微博定时推送到启用的群。

## 适用场景

- 监控固定微博账号的动态更新
- 在群聊中快速查看最新微博
- 将新微博自动推送到 QQ 群

## 环境要求

- 已部署 NapCat，并了解如何导入插件包 (`.zip`)
- 知道目标微博账号的数字 UID
- 无需额外安装 Python 或 `requests`

可选：

- `weiboCookieFile`
- `weiboCookie`

如果不带 Cookie，某些账号的抓取稳定性会差一些。

## 安装步骤

### 1. 下载插件

前往 [Releases](https://github.com/sanxi33/napcat-plugin-weibo-push/releases) 页面，下载最新版本的 `napcat-plugin-weibo-push.zip`。

### 2. 导入 NapCat

在 NapCat 的插件管理界面中导入 zip 文件，并启用插件。

### 3. 默认配置

插件首次运行建议先使用以下配置：

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

通常最关键的是：

- `userId`
- `adminQqList`

## 使用方法

查看微博列表：

```text
/微博
/微博列表
/最新微博
/第1条微博
```

控制群推送：

```text
/开启微博推送
/关闭微博推送
```

## 验证安装

建议按以下顺序测试：

1. 先配好 `userId`
2. 在聊天里发 `/微博`
3. 能返回列表后，再去试 `/第1条微博`
4. 最后在群里发 `/开启微博推送`

## 快捷安装链接

NapCat 版本 ≥ `4.15.19` 时，可点击下方按钮快速跳转至插件安装页面：

<a href="https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-weibo-push" target="_blank">
  <img src="https://github.com/NapNeko/napcat-plugin-index/blob/pages/button.png?raw=true" alt="在 NapCat WebUI 中打开" width="170">
</a>

## 已知限制

- 插件依赖微博页面和接口可访问性
- 没有有效 Cookie 时，部分账号抓取可能受限
- 上游接口结构变化时，插件可能需要更新

## License

MIT
