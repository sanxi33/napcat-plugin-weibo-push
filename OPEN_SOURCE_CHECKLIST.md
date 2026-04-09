# Weibo Push Open Source Checklist

- 移除默认 UID、管理员 QQ、Cookie 文件路径和私有脚本路径
- 默认脚本路径使用仓库内置 `./scripts/weibo_reader.py`
- README 明确说明需要 Python 和 `requests`
- Release 包含 `scripts/weibo_reader.py`
