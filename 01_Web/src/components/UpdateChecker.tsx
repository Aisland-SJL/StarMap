import { ArrowUpRight, Check, Copy, RefreshCw } from 'lucide-react'
import type { ReleaseUpdateState } from '../data/releaseUpdates'

type ReleaseUpdateButtonProps = {
  active: boolean
  state: ReleaseUpdateState
  onToggle: () => void
}

export function ReleaseUpdateButton({ active, state, onToggle }: ReleaseUpdateButtonProps) {
  return (
    <button
      type="button"
      className="atlas-dock-button atlas-release-button pointer-events-auto"
      aria-label={active ? '返回上一界面' : '版本更新'}
      aria-current={active ? 'page' : undefined}
      title={active ? '返回上一界面' : state.hasUnseenUpdate ? '发现新版本，查看更新' : '版本更新'}
      data-update-available={state.hasUnseenUpdate ? 'true' : 'false'}
      onClick={onToggle}
    >
      <RefreshCw aria-hidden="true" className={state.status === 'checking' ? 'is-spinning' : ''} />
      {state.hasUnseenUpdate ? <span className="atlas-release-signal" aria-hidden="true" /> : null}
    </button>
  )
}

type ReleaseUpdatePageProps = {
  state: ReleaseUpdateState
}

export function ReleaseUpdatePage({ state }: ReleaseUpdatePageProps) {
  const statusCopy = state.status === 'checking'
    ? '正在检查最新版本'
    : state.status === 'available' && state.release
      ? `发现新版本 ${state.release.tag_name}`
      : state.status === 'current'
        ? state.message || '当前已是最新版本'
        : state.status === 'unconfigured'
          ? state.message || '尚未配置 GitHub 更新源'
          : state.message || '等待检查版本状态'

  const announcement = state.release?.body?.trim()
    || `StarMap v${state.currentVersion}\n\n当前公共版包含 Map、Journey 与版本更新中心；默认中文，支持本地数据与媒体边界，并恢复了单次点击召唤的 3 秒高密度流星雨。`

  return (
    <div className="atlas-update-scroll selector-scrollbar h-full overflow-y-auto overscroll-contain">
      <div className="atlas-update-shell mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8">
        <section className="update-command-panel">
          <div>
            <p className="journey-kicker">Release center</p>
            <h2>版本更新</h2>
            <p>在不覆盖私人数据和本地修改的前提下，了解并完成 StarMap 更新。</p>
          </div>
          <div className="update-status-card" data-status={state.status}>
            <span className="update-status-light" aria-hidden="true" />
            <div>
              <p>当前版本 v{state.currentVersion}</p>
              <strong>{statusCopy}</strong>
            </div>
          </div>
        </section>

        <div className="update-content-grid">
          <section className="update-content-card update-guide-card">
            <p className="update-card-index">01</p>
            <p className="update-card-kicker">Guide</p>
            <h3>更新指南</h3>
            <ol>
              <li>先保存或提交自己的本地修改，并确认私人照片和环境文件仍在忽略范围内。</li>
              <li>阅读本页的更新公告与版本说明，确认这次更新是否影响自己的定制内容。</li>
              <li>复制 AI 更新指令，交给能访问项目文件的 AI 以“合并”方式执行更新。</li>
              <li>更新后运行 lint、build、privacy:check 和 media:check，再打开网站检查地图与照片。</li>
            </ol>
          </section>

          <section className="update-content-card update-announcement-card">
            <p className="update-card-index">02</p>
            <p className="update-card-kicker">Announcement</p>
            <h3>更新公告</h3>
            <div className="update-release-copy">{announcement}</div>
            {state.release ? (
              <a className="update-release-link" href={state.release.html_url} target="_blank" rel="noreferrer">
                查看 GitHub Release <ArrowUpRight aria-hidden="true" />
              </a>
            ) : null}
          </section>

          <section className="update-content-card update-version-card">
            <p className="update-card-index">03</p>
            <p className="update-card-kicker">Version notes</p>
            <h3>版本说明</h3>
            <dl>
              <div><dt>当前版本</dt><dd>v{state.currentVersion}</dd></div>
              <div><dt>最新版本</dt><dd>{state.release?.tag_name ?? '尚未发布'}</dd></div>
              <div><dt>发布时间</dt><dd>{state.release?.published_at ? new Date(state.release.published_at).toLocaleDateString('zh-CN') : '—'}</dd></div>
              <div><dt>更新方式</dt><dd>人工确认 / AI 辅助合并</dd></div>
            </dl>
            <p className="update-caution">
              注意：更新不会自动覆盖项目。请勿替换 `.env.local`、私人旅行数据、个人媒体或未提交修改。
            </p>
            <div className="update-page-actions">
              <button
                type="button"
                disabled={!state.release}
                onClick={() => void state.copyUpdatePrompt()}
              >
                {state.copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {state.copied ? '已复制' : '复制 AI 更新指令'}
              </button>
              <button
                type="button"
                disabled={state.status === 'checking'}
                onClick={() => void state.checkForUpdates(true)}
              >
                <RefreshCw aria-hidden="true" />
                重新检查
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
