# StarMap 开源模板与个人数据边界

## 目标

StarMap 是一个产品、一套代码和一套数据模型，不维护两份代码。它支持两个显式运行配置：

1. **个人编辑配置**：`npm run dev:personal` 从外置私有层加载配置、旅行记录与媒体，并启动仅限本机的写入中间件。
2. **公共展示配置**：`npm run dev:public` 或 `npm run build:public` 只加载 Git 跟踪的中性示例，不渲染编辑按钮，也不存在本地写入接口。

每个下载开源项目的用户都拥有本地编辑能力；只有部署产物是只读展示。编辑能力不是原作者专属，也不依赖聊天框、DeepSeek Harness 或在线 AI。

本地编辑中的国家候选来自随开发依赖安装的结构化国家目录；城市候选由用户明确点击检索后，通过国家代码约束的 OpenStreetMap Nominatim 联网查询获得，不做逐键自动补全。它不需要 API Key，不把完整世界城市库打进前端，也不会把查询结果写入 Git；只有用户明确选中并确认的国家或城市才进入被忽略的本地数据。日期仍由用户明确填写。

正式维护工作区的私有层是与源码仓库并列的 `StarMap/06_private/`；独立下载用户可通过 `STARMAP_PRIVATE_ROOT` 指向任意私有目录，或使用源码根内被忽略的 `06_private/` 兜底目录。`.gitignore` 是第二道保险，主要边界是个人内容在物理上不属于源码 Git 仓库。

## 运行时优先级

```text
dev:personal / build:personal
        ↓
加载 <private-root>/config、data 与 media

dev:public / build:public
        ↓
只加载 src/data/travel-map.sample.json
```

公共模式从不自动发现个人数据，即使私有层存在也不会读取。`npm run release:check` 还会只归档 Git 已跟踪文件，在系统临时目录中重新安装、Lint 和公共构建，确保检查过程看不到私有层。

## 边界表

| 内容 | 私人开发仓库 | 干净公开仓库 | 说明 |
| --- | --- | --- | --- |
| React / Cesium / UI 源码 | 保留 | 保留 | 产品主体 |
| `travel-map.sample.json` | 保留 | 保留 | 中性可运行示例 |
| `<private-root>/data/travel-map.local.json` | 外置私有层 | 不包含 | 个人国家、城市、路线和显示规则 |
| `<private-root>/data/editor-state.local.json` | 外置私有层 | 不包含 | 排序、隐藏、封面和媒体布局等本地编辑状态 |
| `<private-root>/MediaInbox/<真实国家>/` | 外置私有层 | 不包含 | 原始媒体与私有旁车 |
| `<private-root>/media/user/` | 外置私有层 | 不包含 | 网页使用的个人媒体副本 |
| `<private-root>/data/user-media.local.json` | 外置私有层 | 不包含 | 个人媒体目录与无人机坐标 |
| `<private-root>/config/.env.local` | 外置私有层 | 不包含 | Token 与本地模式 |
| Inbox 模板、Schema、导入脚本 | 保留 | 保留 | 供其他用户和 Agent 使用 |
| 示例图片 | 可选 | 只包含明确授权或生成的样图 | 不得用个人照片占位 |

## 个人网站不受影响的原因

个人旅行记录、原图、网站衍生物、目录与环境配置全部进入外置私有层。`dev:personal` 显式注入这些文件，因此国家列表、城市、相机初始位置和 Drone Media 交互保持个人状态；`dev:public` 则明确忽略它们。

公开用户克隆仓库后默认显示 North Atlantic 中性示例。用户把示例结构复制到自己的 `<private-root>/data/travel-map.local.json`，再按[媒体导入协议](TravelAtlas_media_import_protocol.md)投放照片；国家和城市列表会从其数据自动生成，不继承原作者列表。

## GitHub 与网站公开性的区别

GitHub 不包含个人照片和旅行数据。若个人网站本身部署到公网，浏览器必须能够访问页面上显示的照片和国家城市信息，因此这些已展示内容对网站访客可见。可采用两种部署方式：

- 从本机完成包含私有数据的构建后直接部署构建产物，不通过公开 GitHub 构建。
- 把个人媒体放在独立对象存储中，公开仓库只保留应用代码。

本地开发服务中的 `/__travelatlas/editor/*` 由 Vite 的 `serve` 阶段临时注册，只接受本机同源请求。正式构建不携带这个服务端能力；隐藏编辑按钮本身不作为安全措施，真正的边界是公开部署中没有写入接口。

## 干净公开仓库允许清单

公共 GitHub 只维护源码仓库中的已跟踪文件。允许范围包括：

- 根目录 `README.md`、`README.zh.md`、`LICENSE`、`AGENTS.md` 与 `.gitignore`。
- `01_Web/` 中的源码、测试、脚本与 `.env.example`，不含任何私有层内容、构建输出和本地缓存。
- `02_Assets/MediaInbox/README.md` 与 `_country-template/`。
- `02_Assets/README.md`、媒体与旅行数据 Schema、导入协议、开源隐私边界、公开安装说明和明确授权的示例资产。

私人备案工作日志、项目级 Handoff、内部设计 QA、MediaLab 索引与本机路径说明不进入公共仓库。它们继续留在本地项目历史中，公共仓库只承载产品、使用说明和陌生用户真正需要的 Agent 规则。

任何私人内容即使通过检查，也不因此获得进入 GitHub 的授权。

## 发布前强制检查

从 `01_Web/` 运行：

```powershell
npm run release:check
```

`release:check` 要求源码工作区干净，检查 Git 跟踪清单与关键 `.gitignore` 防线，并在只含 Git 跟踪文件的系统临时目录中执行 `npm ci`、Lint 与 `build:public`。它不能清洗旧历史，也不替代发布授权。

## 相关文档

- [公共使用说明](../README.zh.md)
- [媒体导入协议](TravelAtlas_media_import_protocol.md)
- [Web 工作区说明](../01_Web/README.md)
