# TravelAtlas 批量媒体导入协议

## 目标与入口

用户只负责把原始媒体放入 `02_Assets/MediaInbox/<国家名>/<城市名>/`。城市是 TravelAtlas 的最小媒体单位；Agent 负责解释规则、检查结构、确认元数据、运行导入和报告结果，不要求用户逐张上传。

用户只需表达一次意图，例如：

> 请阅读 TravelAtlas 的相关规则，并告诉我如何上传照片。

陌生 Agent 必须先从项目根 `AGENTS.md` 的媒体导入路由进入，再阅读短版 `02_Assets/MediaInbox/README.md`。本协议负责执行契约和边界情况，不要求普通用户预先阅读。

```text
MediaInbox（私有投递箱）
        ↓ Agent 解释、预检与确认
public/media/user（私有三级网页资源）
        ↓ 导入器生成本地目录
thumb → City Info / City Cards / Drone Media
preview → City Photos Viewer
original → 原图或 360 Viewer 按需加载
```

## 规则优先级

发生冲突或信息不足时，严格按以下顺序决策：

1. **先读再问**：先读取文件内可用的 EXIF/XMP 和尺寸信息。国家、城市、媒体类型、日期、隐私属性或用途不可靠时，提出最少且必要的问题；没有可靠答案就停止，不猜测、不导入。坐标与高度允许缺失，但不得伪造。
2. **保护原始媒体**：Inbox 中的原始媒体不可移动、重命名、覆盖、删除或编辑。
3. **先预检后导入**：`npm run media:check` 出现任何“需要处理”时，禁止正式导入；即使命令成功退出，只要提醒暴露了未解决的必要数据，也必须先询问并停止。
4. **只处理明确范围**：导入器只接收 TravelAtlas 私有旅行数据中已经存在的国家和城市，以及当前明确支持的浏览器格式。
5. **最后验收**：导入后必须检查页面、隐私门禁、Lint 和构建结果并向用户报告。

## 用户唯一需要维护的结构

```text
02_Assets/MediaInbox/
└─ Iceland/
   ├─ country.json            可选：Agent 生成的国家映射旁车
   ├─ Reykjavik/
   │  ├─ photos/               雷克雅未克普通照片
   │  ├─ drone/                360 全景、航拍照片和视频
   │  └─ media.json            可选：Agent 生成的无人机元数据旁车
   └─ Vik/
      ├─ photos/
      ├─ drone/
      └─ media.json
```

国家与城市目录可以使用 TravelAtlas 数据中已经存在的中文名或英文名。若国家目录名称有歧义，Agent 可在国家目录创建或更新 `country.json`，明确填写现有 `countryId`。未知国家或城市不得靠媒体导入流程自动创建；Agent 应说明必须先用单独任务更新私有 `travel-map.local.json`。

文件名不需要用户手工整理。导入器读取内容哈希并生成稳定网页文件名；同一内容重复投递不会产生重复目录记录。若希望指定城市首图，可把其中一张普通照片命名为 `cover.jpg` 或 `cover-说明.jpg`，否则按文件名排序自动选择第一张。

## 原始媒体与旁车文件

`MediaInbox` 采用“原始媒体不可变”原则，而不是所有文件绝对只读。Agent 只能创建或更新以下两个私有 JSON 控制旁车：

- `<国家>/country.json`：将有歧义的目录映射到既有 `countryId`。
- `<国家>/<城市>/media.json`：记录无人机媒体类型和拍摄元数据，结构参考模板中的 `media.example.json`。

旁车文件不是媒体衍生物。除这两个 JSON 外，Agent 不得在 Inbox 中生成任何新文件。转换、缩放、压缩、重编码或优化结果都不得写回 Inbox。

## Agent 执行契约

1. 判断用户是“询问如何上传”还是“要求实际导入”。前者只解释目录和准备要求，不修改文件、不运行导入。
2. 实际导入前，读取根 `AGENTS.md`、`02_Assets/MediaInbox/README.md`、本协议和 `_country-template/`，不得修改网站内置示例旅行数据。
3. 识别国家与城市。无法确认归属的文件留在导入范围外，不得把国家级目录、城市根目录或 `_unsorted` 当作有效媒体单位。
4. 普通照片无需额外元数据。无人机素材必须先读取文件尺寸和可用 EXIF/XMP，并在必要时创建或更新城市级 `media.json`：`kind` 只能是 `panorama360`、`aerialPhoto` 或 `video`；日期缺失时必须询问，坐标与高度可以缺失但不得伪造。
5. 自动导入支持 JPEG、PNG、WebP、AVIF、MP4 和 WebM。受支持的静态图片会在 Inbox 外自动校正方向，并生成 `640 px` WebP 缩略图、`2400 px` WebP 浏览预览和原图副本三级资源。HEIC、HEIF、TIFF、RAW 和 MOV 不由当前导入器自动转换；保持原文件不变，说明原因，并在任何单独转换工作前取得用户确认。
6. 在 `01_Web/` 运行 `npm run media:check`。只要报告仍有“需要处理”，禁止执行正式导入。若提醒项表示媒体类型、日期、分辨率或其他必要数据仍不确定，即使命令退出码为零也必须先询问并停止，不能静默继续。坐标缺失本身不阻止导入。
7. 预检通过后运行 `npm run media:import`。工具按内容哈希建立媒体目录，保留 `original`，并为静态图片生成 `thumb.webp` 与 `preview.webp`；它不移动、不覆盖、不删除投递箱原图，也不会清理历史生成文件。
8. 重启预览并检查城市首图、City Cards/Photos、Drone Media、照片 Viewer 和 360 Viewer。确认列表界面只请求 `thumb`、照片 Viewer 请求 `preview`、360 Viewer 才请求全景 `original`。最后运行 `npm run privacy:check`、`npm run lint` 与 `npm run build`，报告导入数量、未解决项目和验证结果。

## 自动生成与展示规则

| 输入 | 自动生成结果 | 当前网站展示 |
| --- | --- | --- |
| `<国家>/<城市>/photos/` | `thumb.webp` + `preview.webp` + `original` | thumb 用于 City Info / City Cards / City Photos；preview 用于照片 Viewer；原图保留按需使用 |
| `<国家>/<城市>/drone/` + `kind: panorama360` | `thumb.webp` + `preview.webp` + `original` | thumb 用于 Drone Media；original 仅在 360 Viewer 打开后加载 |
| `<国家>/<城市>/drone/` + `kind: aerialPhoto` | `thumb.webp` + `preview.webp` + `original` | 日期与分辨率完整时进入 Drone Media；有坐标时额外支持地图标记和镜头定位 |
| `<国家>/<城市>/drone/` + `kind: video` | 航拍视频目录 | 已入库，当前版本暂不展示播放器 |

普通城市照片无需额外元数据即可显示。无人机内容在城市匹配、类型、日期和分辨率齐全时进入 Drone Media。有效坐标是地图标记与镜头定位的条件，不是列表展示的条件；缺少坐标时不得使用城市中心或其他猜测值代替。

## 失败与询问原则

- 未知国家或未知城市：停止，告诉用户需要先建立私有旅行数据记录。
- 无法判断文件属于哪个城市：只询问所属城市；没有答案就不导入该文件。
- 无法判断无人机类型：询问类型。只有文件名明确包含 `360`、`pano` 或 `panorama` 时，导入器才可识别为全景；不得把不确定素材静默归类。
- 缺少日期或分辨率：询问缺失字段；没有可靠答案就不激活 Drone Media。缺少坐标或高度：允许留空，并明确说明该条目不会产生地图标记或镜头定位。
- HEIC、HEIF、TIFF、RAW 或 MOV：停止自动导入，说明当前需要单独且经用户确认的转换工作。受支持的大尺寸静态图片由三级资源流水线自动优化，不需要修改 Inbox 原图。
- 媒体放在国家根目录、城市根目录或未知子目录：预检失败，不写入。
- 同名文件：按内容哈希区分；同内容重复文件只保留一条目录记录。
- 工具从不删除旧文件。需要清理、替换或迁移时必须由用户单独确认。

## 隐私与开源边界

以下内容只存在于用户本机，并由 `.gitignore` 排除：

- `02_Assets/MediaInbox/<真实国家>/`，包括私有旁车文件。
- `01_Web/public/media/user/`。
- `01_Web/src/data/generated/*.local.json`。

公开仓库只包含 `_country-template/`、导入脚本、本协议和 JSON Schema。个人原图、网页副本和媒体目录均在 Git 边界之外；公开示例图只能使用明确授权或专门生成的素材。

## 相关文档

- [公共使用说明](../README.zh.md)
- [项目 Agent 规则](../AGENTS.md)
- [资产边界](../02_Assets/README.md)
- [投递箱短版说明](../02_Assets/MediaInbox/README.md)
- [Web 工作区说明](../01_Web/README.md)
- [开源隐私边界](TravelAtlas_open_source_privacy_boundary.md)
