<p align="center"><a href="README.md">English</a> · <b>简体中文</b></p>

# StarMap

一个开源、本地优先的 3D 旅行地图，用交互式地球展示地点、旅程、照片与无人机影像，也可以作为个人作品集中的旅行项目。

StarMap 使用 React、TypeScript、Vite 与 Cesium 构建。全新下载的仓库只包含中性的示例数据；你的旅行记录、媒体、编辑状态与环境配置默认都保存在被 Git 忽略的本地文件中。

## 产品预览

<table>
  <tr>
    <td width="68%"><img src="docs/images/01-globe-overview.webp" alt="StarMap 地球整体效果预览"></td>
    <td width="32%"><strong>浏览地球上的任何角落</strong><br><br>从完整的世界视角出发，前往地球上的任意地点；已经访问的国家、城市和旅程路线都会显示在地球上。</td>
  </tr>
  <tr>
    <td width="68%"><img src="docs/images/02-meteor-galaxy-closeup.webp" alt="流星雨、银河和地球近景"></td>
    <td width="32%"><strong>从银河一直看到地面瓦片</strong><br><br>拉近镜头可以观察流星雨和银河，并继续靠近地表，查看每一处地形与影像瓦片的细节。</td>
  </tr>
  <tr>
    <td width="68%"><img src="docs/images/03-city-location-and-altitude.webp" alt="城市面板与照片无人机坐标"></td>
    <td width="32%"><strong>精准显示城市中的拍摄位置</strong><br><br>打开城市面板后，可以按坐标与高度定位城市中的照片和无人机素材，同时浏览城市照片与媒体入口。</td>
  </tr>
  <tr>
    <td width="68%"><img src="docs/images/04-drone-panorama-viewer.webp" alt="无人机 360 度全景 Viewer"></td>
    <td width="32%"><strong>无人机 360° 全景 Viewer</strong><br><br>在地图内部直接打开无人机全景图，通过内置 Viewer 沉浸式浏览、拖动和缩放，无需离开 StarMap。</td>
  </tr>
</table>


## 主要功能

- 可交互的 Cesium 地球，支持国家、城市、路线与镜头导航。
- Map 与 Journey 双视图及响应式玻璃界面。
- 本地编辑器：新增和排序国家、城市，隐藏或恢复条目，管理城市照片与无人机媒体。
- 无人机文件优先读取元数据：选择文件后立刻读取日期、GPS 坐标、绝对海拔、相对高度与相机信息。
- 只有读取不到的字段才需要用户填写；日期必填，坐标与高度均可留空。
- 横图、竖图都能完整适配的大图相册。
- 私有媒体三级管线：轻量缩略图、预览图与保留的原始文件。
- 单击召唤流星雨，以及基于 GitHub Release 的站内更新指南。
- 面向开源复用设计的隐私检查与公私数据分层。

## 快速开始

需要 Git，以及与 Vite 8 兼容的当前 Node.js LTS 版本。

```powershell
git clone https://github.com/Aisland-SJL/StarMap.git
cd StarMap/01_Web
npm ci
npm run dev:public
```

打开 `http://127.0.0.1:5173/`。这是纯公共预览，只读取中性示例数据，也不需要凭据。

要使用个人地图，请在源码仓库外建立私有层（正式维护工作区固定为 `StarMap/06_private/`），把 `.env.example` 复制到私有层的 `config/.env.local`，再运行 `npm run dev:personal`。独立下载的仓库可以通过 `STARMAP_PRIVATE_ROOT` 指向任意私人目录，也可使用被忽略的 `StarMap/06_private/` 兜底目录。个人配置、旅程、媒体与编辑状态在物理上都不进入源码仓库。

## 图源凭据——第一次使用先看这里

不配置 token 时，StarMap 仍会使用内置的低清 Natural Earth II 底图启动。需要 Cesium ion 在线全球影像时：

1. 登录或注册 [Cesium ion](https://ion.cesium.com/)。
2. 打开 [Access Tokens](https://ion.cesium.com/tokens)，创建一个应用专用的公开 token。
3. 为了最容易地在本地启动，可以保留普通公开权限；所有 Private scopes 保持关闭。正式部署时，再把 Allowed URLs 与可访问资源限制到实际需要的范围。
4. 打开私有层的 `config/.env.local`，把 token 填在 `VITE_CESIUM_ION_TOKEN=` 后面。
5. 重新启动开发服务器。

不要把 token 提交到 Git，也不要把完整 token 粘贴到 AI 对话、Issue、截图、日志或 README。浏览器端的生产 token 对访问者可见，因此应单独创建生产 token，并限制域名和资源。

如果希望 AI 带你配置，可以把下面这段话交给 Agent：

> 请先阅读 `AGENTS.md`、`README.zh.md`、`01_Web/AGENTS.md`、`01_Web/README.md` 和 `01_Web/.env.example`。先解释 StarMap 的三种图源，并询问我是需要 Cesium ion、天地图，还是只使用内置本地图源；再引导我申请所选凭据，并配置 `VITE_MAP_SOURCE`、`VITE_CESIUM_ION_TOKEN` 与 `VITE_TIANDITU_TOKEN`。不要让我把完整 token 或 Key 粘贴或展示给你；只告诉我应在外置私有层的 `config/.env.local` 中如何填写，只检查非敏感的“是否存在”和实际地图加载结果。然后运行 `npm run dev:personal` 并介绍基本操作，绝不把私人数据复制进源码仓库。

## 在 Cesium 与天地图之间切换

StarMap 的 3D 地球引擎仍然是 Cesium，图源切换只改变地球上显示的影像。需要在中国大陆访问时，可前往[天地图开发资源](https://lbs.tianditu.gov.cn/)申请自己的 Key，并把两套凭据同时写入私有层的 `config/.env.local`：

```text
VITE_MAP_SOURCE=tianditu
VITE_CESIUM_ION_TOKEN=
VITE_TIANDITU_TOKEN=
```

`VITE_MAP_SOURCE` 支持 `auto`、`cesium`、`tianditu` 或 `local`。地图底部的“图源”按钮始终列出 Cesium、天地图和本地低清兜底：常亮绿灯表示所需变量已填写（或本地图源已内置），红灯表示在线图源尚未配置且不可选择。这个判断只检查变量是否存在，不会显示或验证凭据内容。浏览器会记住上次选择的可用图源。修改 `.env.local` 后仍需重启开发服务器。两种在线凭据都会随静态网站进入浏览器，因此正式部署时要使用应用专用凭据，并在对应平台限制允许的域名和使用范围。

## 添加自己的旅程和媒体

开发模式会显示本地编辑控件，可新增和排序国家、城市，隐藏或恢复条目，选择照片封面，以及导入城市照片和无人机媒体。生产构建不会包含这些写入控件。

选择无人机文件后，StarMap 会立即逐个读取可用的 EXIF/XMP 信息。文件中已经存在的值会作为“文件读取”结果锁定；只有缺失字段才可填写。缺少日期时必须补充，坐标与高度可以留空。

批量导入媒体时，参考仓库中的 `02_Assets/MediaInbox/` 模板，把真实源文件放进外置私有层的 `MediaInbox/`，然后在 `01_Web/` 运行：

```powershell
npm run media:check
npm run media:import
```

导入程序不会改写 Inbox 原文件。个人源媒体、生成图片、本地旅行记录、编辑状态与 `.env.local` 全部留在外置私有层，不进入源码仓库。

## 构建与检查

在 `01_Web/` 中运行：

```powershell
npm run lint
npm run build:public
npm run privacy:check
npm run media:check
```

`npm run build:public` 会在 `01_Web/dist/` 生成不带本地编辑能力的静态公开站点。`npm run release:check` 还会要求工作区干净，只把 Git 已跟踪文件归档到系统临时目录，在这个“无私有层”的洁净环境里重新安装、检查和构建，从机制上证明私人内容无法混入公开发布。`build:personal` 只用于你自己控制的私人部署。

## 后续更新

底部右侧的版本按钮最多每 12 小时检查一次最新 [GitHub Release](https://github.com/Aisland-SJL/StarMap/releases)。发现未读新版本后，按钮会显示呼吸灯；更新页会展示公告、版本说明和一段安全的 AI 更新指令。网站不会自动覆盖你的项目。

该按钮支持反选：第一次点击进入更新页，再次点击会回到此前使用的 Map 或 Journey 页面。

Fork 用户可以通过 `VITE_GITHUB_REPOSITORY=owner/repository` 改为检查自己的 Release。

## 目录说明

| 路径 | 用途 |
| --- | --- |
| `01_Web/` | React、TypeScript、Vite 与 Cesium 应用 |
| `02_Assets/MediaInbox/` | 外置私人投递箱的中性目录模板 |
| `03_Reference/` | 架构、隐私与媒体工作流说明 |
| `05_Test/` | 验证说明 |

## 隐私与安全

- 真实 token 只存放在外置私有层或托管平台环境变量中。
- 个人旅行数据与用户媒体只存放在 Git 仓库之外的外置私有层。
- `.gitignore` 是第二道保险，不是唯一的隔离手段。
- 每次公开发布前运行 `npm run release:check`；不要上传 `.env.local`、私人媒体、个人数据目录或任何凭据。

## 许可证

[MIT](LICENSE)
