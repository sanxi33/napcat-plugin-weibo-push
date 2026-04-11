# napcat-plugin-weibo-push

一个用于 NapCat 的微博查询与推送插件。支持在群聊中查看指定微博账号的最新内容，并可定时将新微博推送至已启用的群组。

## 适用场景

- 监控特定微博账号的动态更新
- 在群聊中快速获取最新微博列表
- 自动将新发布的微博推送至 QQ 群

## 环境要求

- 已部署 NapCat，了解如何导入插件包 (`.zip`)
- 目标微博用户的数字 UID（非昵称）
- （可选但推荐）微博 Cookie 以提升抓取稳定性

## 安装步骤

### 1. 下载插件

前往 [Releases](https://github.com/sanxi33/napcat-plugin-weibo-push/releases) 页面，下载最新版本的 `napcat-plugin-weibo-push.zip`。

### 2. 导入 NapCat

在 NapCat 的插件管理界面中导入 zip 文件，并启用插件。

### 3. 最小化配置示例

首次使用时，建议使用以下基础配置模板：

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
  "weiboCookie": "",
  "weiboReaderScript": "./scripts/weibo_reader.py"
}
```

关键配置项说明：

- `userId`：目标微博用户的数字 UID
- `adminQqList`：管理员 QQ 号，多个使用英文逗号分隔
- `weiboCookieFile` 或 `weiboCookie`：填写 Cookie 可显著提高数据抓取稳定性

> 注：`weiboReaderScript` 路径保持默认即可，无需修改。

## 使用方法

### 查询微博

```
/微博
/微博列表
/最新微博
/第1条微博
```

### 群推送控制（仅群管理员可用）

```
/开启微博推送
/关闭微博推送
```

命令前缀取决于配置中的 `commandPrefix` 设置。

## 验证安装

按以下顺序测试插件是否正常工作：

1. 配置正确的 `userId`
2. 发送命令 `/微博` 检查是否返回微博列表
3. 发送命令 `/第1条微博` 查看详情内容
4. 在群内发送 `/开启微博推送` 启用定时推送

若步骤 2 成功返回列表，则说明插件核心功能运行正常。

## 快捷安装链接

NapCat 版本 ≥ `4.15.19` 时，可点击下方按钮快速跳转至插件安装页面：

<a href="https://napneko.github.io/napcat-plugin-index?pluginId=napcat-plugin-weibo-push" target="_blank">
  <img src="https://github.com/NapNeko/napcat-plugin-index/blob/pages/button.png?raw=true" alt="在 NapCat WebUI 中打开" width="170">
</a>

## 故障排查

插件的微博抓取功能依赖仓库自带的 `scripts/weibo_reader.py` 脚本，内部会执行 `py -3 scripts/weibo_reader.py` 命令。

若遇到类似以下报错：

- `'py' 不是内部或外部命令`
- `ModuleNotFoundError: No module named 'requests'`
- `weibo_reader_failed`

请执行以下排查步骤：

1. 确认系统可执行 `py -3` 命令
2. 安装所需依赖：
   ```bash
   py -3 -m pip install requests
   ```
3. 重启 NapCat 并重新启用插件

## 已知限制

- 依赖微博页面及接口的可访问性
- 无有效 Cookie 时，部分微博账号内容可能无法正常抓取
- 本插件仅负责内容查询与推送，不涉及微博账号管理或互动操作

## License

MIT
