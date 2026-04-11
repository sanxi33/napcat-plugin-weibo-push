# napcat-plugin-music-share

一个为 NapCat 设计的音乐分享与歌词查询插件。无需自行申请 API Key，安装后即可在群聊中通过命令快速分享音乐卡片或查询歌词。

## 适用场景

- 在群聊中快速分享网易云音乐歌曲
- 查询歌曲歌词并发送到聊天窗口
- 开箱即用，无需额外配置第三方 API

## 环境要求

- 已部署 NapCat，并了解如何导入插件包 (`.zip`)
- 无需额外依赖或 API 密钥

## 安装步骤

### 1. 下载插件

前往 [Releases](https://github.com/sanxi33/napcat-plugin-music-share/releases) 页面，下载最新版本的 `napcat-plugin-music-share.zip`。

### 2. 导入 NapCat

在 NapCat 的插件管理界面中导入下载的 zip 文件，并启用插件。

### 3. 默认配置

插件首次运行将使用以下默认配置：

```json
{
  "enabled": true,
  "commandPrefix": "/",
  "requestTimeoutMs": 8000
}
```

可根据需要修改 `commandPrefix`（命令前缀）和 `requestTimeoutMs`（请求超时时间）。

> 提示：若将 `commandPrefix` 设置为空字符串，则可以不使用前缀直接输入命令。

## 使用方法

### 点歌

```
/点歌 稻香
/来一首 晴天
/播放 夜曲
```

### 查询歌词

```
/查看歌词 七里香
/歌词 晴天
/查歌词 稻香
```

命令中的前缀取决于你在配置中设置的 `commandPrefix` 值。

## 验证安装

发送以下命令测试插件是否正常工作：

```
/点歌 稻香
/查看歌词 晴天
```

若返回音乐分享卡片或歌词文本，即表示插件已成功运行。

## 快捷安装链接

NapCat 版本 ≥ `4.15.19` 时，可点击下方按钮快速跳转至插件安装页面：

<a href="https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-music-share" target="_blank">
  <img src="https://github.com/NapNeko/napcat-plugin-index/blob/pages/button.png?raw=true" alt="在 NapCat WebUI 中打开" width="170">
</a>

## 已知限制

- 插件依赖公开的第三方接口，若上游服务调整可能导致功能异常，届时需更新插件
- 音乐卡片的渲染效果受 QQ 客户端及适配器能力影响
- 本插件仅提供音乐信息分享与歌词查询，不具备本地播放控制功能

## License

MIT
