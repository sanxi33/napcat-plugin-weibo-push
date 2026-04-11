# napcat-plugin-weibo-push

一个给 NapCat 用的微博查询与推送插件。它可以在群里查看某个微博账号最近的内容，也可以把新微博定时推送到启用的群。

## 这份 README 默认把你当作

- 已经装好了 NapCat，会导入插件 zip
- 希望插件尽量是“导入后直接配好就能用”
- 想监控固定微博账号，并把更新推到 QQ 群

## 先说结论

对于大多数普通用户，这个插件应该按下面这条路径理解：

1. 先导入插件
2. 先填 `userId`
3. 有条件的话再补 Cookie
4. 先直接试 `微博` / `第N条微博`
5. 只有真的报错了，再去看 Python 相关排查

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
  "weiboCookie": "",
  "weiboReaderScript": "./scripts/weibo_reader.py"
}
```

其中最关键的是：

- `userId`
- `adminQqList`
- `weiboCookieFile` 或 `weiboCookie`

如果你只是第一次装，**先不要管 `weiboReaderScript`**，保持默认即可。

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

## 如果真的启动失败，再看这里

当前版本的插件实现里，抓取逻辑是通过仓库自带的 `scripts/weibo_reader.py` 跑起来的，并且代码里是直接调用：

```text
py -3 scripts/weibo_reader.py
```

所以如果你在自己的环境里真的遇到下面这类报错：

- 找不到 `py`
- 找不到 `requests`
- `weibo_reader_failed`

再按下面排查：

1. 确认环境里能执行 `py -3`
2. 安装依赖：

```text
py -3 -m pip install requests
```

3. 再重新启用插件测试

这部分更像“故障排查”，不是普通用户的主安装步骤。

## 已知限制

- 插件依赖微博页面和接口可访问性
- 没有有效 Cookie 时，部分账号抓取可能受限
- 当前实现内部确实会调用 Python 脚本；只是普通用户不一定需要一开始就手工处理这件事

## License

MIT
