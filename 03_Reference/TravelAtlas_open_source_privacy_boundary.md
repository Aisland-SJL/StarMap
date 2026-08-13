# TravelAtlas 开源模板与个人数据边界

## 目标

TravelAtlas 使用同一套应用代码支持两种运行状态：

1. 个人状态加载本机私有旅行记录与照片，保持完整个人网站体验。
2. 开源状态在没有任何私有文件时自动加载中性示例数据，形成可直接运行的公开模板。

当前私人开发仓库不直接公开。正式发布时从允许清单创建一个不继承私人 Git 历史的干净仓库。

## 运行时优先级

```text
存在 src/data/generated/travel-map.local.json
        ↓
加载个人国家、城市、路线和显示设置

不存在 local 文件
        ↓
加载 src/data/travel-map.sample.json
```

可以在 `.env.local` 中设置 `VITE_TRAVEL_ATLAS_DATA_MODE=sample`，强制本机显示公开示例，用于发布前验收。开发预览也可临时访问 `?data=sample`，无需修改本地设置。默认 `local` 会优先使用个人数据。

## 边界表

| 内容 | 私人开发仓库 | 干净公开仓库 | 说明 |
| --- | --- | --- | --- |
| React / Cesium / UI 源码 | 保留 | 保留 | 产品主体 |
| `travel-map.sample.json` | 保留 | 保留 | 中性可运行示例 |
| `travel-map.local.json` | 本机保留、Git 忽略 | 不包含 | 个人国家、城市、路线和显示规则 |
| `MediaInbox/<真实国家>/` | 本机保留、Git 忽略 | 不包含 | 原始媒体不可修改；只允许 Agent 创建或更新私有控制旁车 `country.json` 与城市级 `media.json` |
| `public/media/user/` | 本机保留、Git 忽略 | 不包含 | 网页使用的个人媒体副本 |
| `user-media.local.json` | 本机保留、Git 忽略 | 不包含 | 个人媒体目录与无人机坐标 |
| `02_Assets/PrivateData/` | 本机保留、Git 忽略 | 不包含 | 迁移备份和非运行时私人档案 |
| `.env.local` | 本机保留、Git 忽略 | 不包含 | Token 与本地模式 |
| Inbox 模板、Schema、导入脚本 | 保留 | 保留 | 供其他用户和 Agent 使用 |
| 示例图片 | 可选 | 只包含明确授权或生成的样图 | 不得用个人照片占位 |

## 个人网站不受影响的原因

个人旅行记录已经进入被忽略的 `travel-map.local.json`，个人原图进入保持原始媒体不可变的 Inbox，网站副本和目录进入被忽略的 `public/media/user/` 与 `user-media.local.json`。Inbox 中只有私有映射旁车 `country.json` 与城市级 `media.json` 可由 Agent 创建或更新。应用仍优先加载这些文件，因此国家列表、城市、相机初始位置和 Drone Media 交互保持个人版本。

公开用户克隆仓库时没有这些文件，应用自动显示 North Atlantic 中性示例。用户复制示例数据到 `generated/travel-map.local.json`，替换成自己的记录，再按 [[TravelAtlas_media_import_protocol]] 投放照片；国家和城市列表会从其数据自动生成，不继承原作者列表。

## GitHub 与网站公开性的区别

GitHub 不包含个人照片和旅行数据。若个人网站本身部署到公网，浏览器必须能够访问页面上显示的照片和国家城市信息，因此这些已展示内容对网站访客可见。可采用两种部署方式：

- 从本机完成包含私有数据的构建后直接部署构建产物，不通过公开 GitHub 构建。
- 把个人媒体放在独立对象存储中，公开仓库只保留应用代码。

## 干净公开仓库允许清单

正式开源时只从当前工作区复制：

- 根目录 `AGENTS.md`、`TravelAtlas_README.md`、`.gitignore`，以及公开用户和陌生 Agent 发现本项目规则所需的本地索引与说明文件。
- `01_Web/`，排除 `src/data/generated/`、`public/media/user/`、`.env.local`、构建输出和本地缓存。
- `02_Assets/MediaInbox/README.md` 与 `_country-template/`。
- `02_Assets/README.md`、媒体与旅行数据 Schema、导入协议、开源隐私边界、公开安装说明、许可证和明确授权的示例资产。

不得直接复制当前 `.git/`。这能避免已经从工作树删除的个人照片和旅行数据通过历史提交重新出现。

## 发布前强制检查

从 `01_Web/` 运行：

```powershell
npm run privacy:check
npm run media:check
npm run lint
npm run build
```

`privacy:check` 检查当前文件边界；它不能清洗历史。因此公开发布仍必须使用全新 Git 历史，或另行执行经过确认的历史清理。

## 结构链接

- 项目入口：[[TravelAtlas_README]]
- 项目索引：[[00_TravelAtlas_index]]
- 媒体导入协议：[[TravelAtlas_media_import_protocol]]
- Web 工作区：[[ProductionLab/04_Project/TravelAtlas/01_Web/README|Web README]]
