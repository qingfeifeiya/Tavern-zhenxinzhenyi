# 甄心甄意·衣柜开发目录

这里维护 SillyTavern 衣柜插件的源码。当前 `main` 是重构前的快照。接下来的工作主要是重写功能实现，文件名和职责划分可参考现有结构。

## 源码结构

源码位于 [`src/wardrobe/`](src/wardrobe/)。下表按入口及其 `@include` 顺序列出当前快照中的文件。

| 文件 | 用途 |
| --- | --- |
| `index.js` | 脚本入口、片段加载顺序、面板挂载和实例清理 |
| `wardrobe-config.js` | 分类、分级、默认槽位和存储键等常量 |
| `state-read.js` | 读取存档，校验服饰、套装、衣柜和组合记录 |
| `state-init.js` | 从存档初始化衣柜、服饰索引和面板状态 |
| `panel-templates.js` | 图标、卡片、弹窗和表单等可复用模板 |
| `styles.js` | 面板样式和主题配色 |
| `panel-html.js` | 面板、工作区和弹窗的 HTML |
| `panel-controls.js` | 控件查找、悬浮按钮菜单和拖动 |
| `panel-modals.js` | 弹窗开关、焦点恢复和表单反馈 |
| `state-write.js` | 保存衣柜快照并反馈写入错误 |
| `wardrobe-management.js` | 衣柜与组合管理、衣柜删除和服饰迁移 |
| `settings-panel.js` | 设置表单回填、校验、保存和显示预览 |
| `selection-controls.js` | 服饰批量勾选及跨视图同步 |
| `panel-navigation.js` | 画廊与搭配台切换、页签状态 |
| `outfit-matrix.js` | 搭配台槽位、套装草稿和保存 |
| `slot-picker.js` | 搭配台选衣弹窗、衣柜筛选和槽位选择 |
| `gallery-inspector.js` | 画廊视图、服饰详情、装备状态和衣柜范围 |
| `wardrobe-forms.js` | 新增服饰、衣柜与组合表单、批量移动提交 |
| `gallery-delete.js` | 服饰删除确认及删除后的视图更新 |
| `tag-editor.js` | 服饰标签和绑定人物的行内编辑 |
| `panel-events.js` | 面板点击分发和 Esc 关闭交互 |
| `panel-entrances.js` | 面板开关、酒馆扩展菜单入口和插件启停 |

## 构建和发布

首次在本仓库安装依赖时运行 `pnpm install --frozen-lockfile`。需要生成发布文件时运行 `pnpm build`。构建按 `index.js` 中的 `@include` 顺序合并片段，生成 `dist/wardrobe/index.js`，可直接粘贴到酒馆助手脚本库。

如果本机的发布仓库 `1122` 与本仓库同级，可以从本仓库运行以下命令同步构建产物，然后在 `1122` 中运行 `node --test` 检查发布脚本。

```powershell
Copy-Item -LiteralPath .\dist\wardrobe\index.js -Destination ..\1122\index.js
```

本仓库的 `tests/` 中仍有旧版回归测试，会读取当前快照中已移除的 `host-context.js` 或 `prompts.js`。这些测试需要随实现重写一起更新。
