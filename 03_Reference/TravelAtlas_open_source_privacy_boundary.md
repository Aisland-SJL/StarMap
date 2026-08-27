# StarMap 开源模板与个人数据边界

## 目标

StarMap 是一个产品、一套代码和一套数据模型，不是需要分别维护的两个版本。它支持两种运行状态：

1. **本地编辑态**：`npm run dev` 启动 Vite 页面与仅限本机的写入中间件，显示编辑按钮，加载本机私有旅行记录与照片。
2. **公开展示态**：`npm run build` 生成静态网站，不渲染编辑按钮，也不存在本地写入接口；没有私有文件时自动加载中性示例数据。

每个下载开源项目的用户都拥有本地编辑能力；只有部署产物是只读展示。编辑能力不是原作者专属，也不依赖聊天框、DeepSeek Harness 或在线 AI。

本地编辑中的国家候选来自随开发依赖安装的结构化国家目录；城市候选由用户明确点击检索后，通过国家代码约束的 OpenStreetMap Nominatim 联网查询获得，不做逐键自动补全。它不需要 API Key，不把完整世界城市库打进前端，也不会把查询结果写入 Git；只有用户明确选中并确认的国家或城市才进入被忽略的本地数据。日期仍由用户明确填写。

公共仓库由下方允许清单生成，不继承私人开发仓库的本地 Git 历史。

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
| `editor-state.local.json` | 本机保留、Git 忽略 | 不包含 | 排序、隐藏、封面和媒体布局等本地编辑状态 |
| `MediaInbox/<真实国家>/` | 本机保留、Git 忽略 | 不包含 | 原始媒体不可修改；只允许 Agent 创建或更新私有控制旁车 `country.json` 与城市级 `media.json` |
| `public/media/user/` | 本机保留、Git 忽略 | 不包含 | 网页使用的个人媒体副本 |
| `user-media.local.json` | 本机保留、Git 忽略 | 不包含 | 个人媒体目录与无人机坐标 |
| `02_Assets/PrivateData/` | 本机保留、Git 忽略 | 不包含 | 迁移备份和非运行时私人档案 |
| `.env.local` | 本机保留、Git 忽略 | 不包含 | Token 与本地模式 |
| Inbox 模板、Schema、导入脚本 | 保留 | 保留 | 供其他用户和 Agent 使用 |
| 示例图片 | 可选 | 只包含明确授权或生成的样图 | 不得用个人照片占位 |

## 个人网站不受影响的原因

个人旅行记录已经进入被忽略的 `travel-map.local.json`，个人原图进入保持原始媒体不可变的 Inbox，网站副本和目录进入被忽略的 `public/media/user/` 与 `user-media.local.json`。Inbox 中只有私有映射旁车 `country.json` 与城市级 `media.json` 可由 Agent 创建或更新。应用仍优先加载这些文件，因此国家列表、城市、相机初始位置和 Drone Media 交互保持个人版本。

公开用户克隆仓库时没有这些文件，应用自动显示 North Atlantic 中性示例。用户复制示例数据到 `generated/travel-map.local.json`，替换成自己的记录，再按[媒体导入协议](TravelAtlas_media_import_protocol.md)投放照片；国家和城市列表会从其数据自动生成，不继承原作者列表。

## GitHub 与网站公开性的区别

GitHub 不包含个人照片和旅行数据。若个人网站本身部署到公网，浏览器必须能够访问页面上显示的照片和国家城市信息，因此这些已展示内容对网站访客可见。可采用两种部署方式：

- 从本机完成包含私有数据的构建后直接部署构建产物，不通过公开 GitHub 构建。
- 把个人媒体放在独立对象存储中，公开仓库只保留应用代码。

本地开发服务中的 `/__travelatlas/editor/*` 由 Vite 的 `serve` 阶段临时注册，只接受本机同源请求。正式构建不携带这个服务端能力；隐藏编辑按钮本身不作为安全措施，真正的边界是公开部署中没有写入接口。

## 干净公开仓库允许清单

正式开源时只从当前工作区复制：

- 根目录 `README.md`、`README.zh.md`、`LICENSE`、`AGENTS.md` 与 `.gitignore`。
- `01_Web/`，排除 `src/data/generated/`、`public/media/user/`、`.env.local`、构建输出和本地缓存。
- `02_Assets/MediaInbox/README.md` 与 `_country-template/`。
- `02_Assets/README.md`、媒体与旅行数据 Schema、导入协议、开源隐私边界、公开安装说明和明确授权的示例资产。

私人备案工作日志、项目级 Handoff、内部设计 QA、MediaLab 索引与本机路径说明不进入公共仓库。它们继续留在本地项目历史中，公共仓库只承载产品、使用说明和陌生用户真正需要的 Agent 规则。

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

## 相关文档

- [公共使用说明](../README.zh.md)
- [媒体导入协议](TravelAtlas_media_import_protocol.md)
- [Web 工作区说明](../01_Web/README.md)
