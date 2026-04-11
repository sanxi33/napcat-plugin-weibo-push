# napcat-plugin-weibo-push

一个给 NapCat 用的微博查询与推送插件。它可以在群里查看某个微博账号最近的内容，也可以把新微博定时推送到启用的群。

## 这份 README 默认把你当作

- 已经装好了 NapCat，会导入插件 zip
- 希望插件尽量是“导入后直接配好就能用”
- 想监控固定微博账号，并把更新推到 QQ 群

## 先说结论

当前版本已经改成了**纯 `.mjs` 实现**：

- 不需要额外装 Python
- 不需要 `requests`
- 不需要再依赖外部脚本

普通用户的主路径应该是：

1. 导入插件
2. 填 `userId`
3. 有条件的话补 Cookie
4. 直接试 `微博`
5. 能查出来后再开推送

## 这个插件适合谁

适合：

- 想监控一个固定微博 UID
- 想在群里快速查看最新微博
- 想把新微博推送到 QQ 群

不太适合：

- 不知道目标微博 UID 的人
- 想做复杂微博管理的人

## 装之前要准备什么

普通用户真正需要先准备的其实只有这 3 件事：

1. 目标微博 UID
2. 管理员 QQ
3. 可选但强烈建议准备的 Cookie

### 1. 目标微博 UID

插件配置里要填的是 `userId`，不是昵称。

### 2. 管理员 QQ

`adminQqList` 需要写成逗号分隔字符串，例如：

```text
123456789,987654321
```

### 3. Cookie（强烈建议）

虽然部分情况下不带 Cookie 也可能查到数据，但稳定性会差很多。能准备的话，建议至少准备其中一种：

- `weiboCookieFile`
- `weiboCookie`

## 安装

### 1. 下载插件

从 [Releases](https://github.com/sanxi33/napcat-plugin-weibo-push/releases) 下载：

- `napcat-plugin-weibo-push.zip`

### 2. 导入 NapCat

在 NapCat 插件管理里导入 zip，并启用插件。

### 3. 先填最少配置

第一次建议先这样填：

```json
{
  "enabled": true,
  "commandPrefix": "球鳖",
  "userId": "1195242865",
  "requestTimeoutMs": 10000,
  "pollMinutes": 240,
  "adminQqList": "123456789",
  "pushStatePath": "data/weibo-push-state.json",
  "weiboCookieFile": "",
  "weiboCookie": ""
}
```

其中最关键的是：

- `userId`
- `adminQqList`
- `weiboCookieFile` 或 `weiboCookie`

## 怎么用

查看微博列表：

- `球鳖 微博`
- `球鳖 微博列表`
- `球鳖 最新微博`

查看第 N 条：

- `球鳖 第1条微博`

群管理员控制推送：

- `球鳖 开启微博推送`
- `球鳖 关闭微博推送`

## 第一次怎么确认自己装好了

建议按这个顺序测：

1. 先配好 `userId`
2. 在聊天里发 `球鳖 微博`
3. 能返回列表后，再去试 `球鳖 第1条微博`
4. 最后在群里发 `球鳖 开启微博推送`

如果你已经能走到第 2 步并看到结果，说明插件主路径就是通的。

## 一键跳到 NapCat WebUI 安装页

如果你的 NapCat 版本是 `4.15.19` 或更高，可以直接点下面按钮跳到插件安装界面：

<a href="https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-weibo-push" target="_blank">
  <img src="https://github.com/NapNeko/napcat-plugin-index/blob/pages/button.png?raw=true" alt="在 NapCat WebUI 中打开" width="170">
</a>

## 已知限制

- 插件依赖微博页面和接口可访问性
- 没有有效 Cookie 时，部分账号抓取可能受限
- 上游接口结构变化时，插件可能需要更新

## License

MIT
