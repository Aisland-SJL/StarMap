import type { InterfaceLanguage } from './LanguageToggle'

type MouseControlGuideProps = {
  language: InterfaceLanguage
}

type MouseAction = 'left' | 'middle' | 'wheel'

const controlCopy: Record<InterfaceLanguage, Array<{ action: MouseAction; key: string; label: string }>> = {
  zh: [
    { action: 'left', key: '左键', label: '拖动' },
    { action: 'middle', key: '中键', label: '旋转' },
    { action: 'wheel', key: '滚轮', label: '缩放' },
  ],
  en: [
    { action: 'left', key: 'Left', label: 'Drag' },
    { action: 'middle', key: 'Middle', label: 'Rotate' },
    { action: 'wheel', key: 'Wheel', label: 'Zoom' },
  ],
}

function MouseIcon({ action }: { action: MouseAction }) {
  return (
    <svg
      aria-hidden="true"
      className="atlas-mouse-control-icon"
      viewBox="0 0 28 36"
    >
      <path
        className="atlas-mouse-control-shell"
        d="M14 2.5c-5.1 0-9 3.9-9 9v10.8c0 6.1 3.3 10.9 9 10.9s9-4.8 9-10.9V11.5c0-5.1-3.9-9-9-9Z"
      />
      <path className="atlas-mouse-control-divider" d="M5.4 11.6h17.2M14 2.9v8.7" />
      {action === 'left' ? (
        <path
          className="atlas-mouse-control-active"
          d="M13.1 4.3v6H6.7c.5-3.3 3.1-5.6 6.4-6Z"
        />
      ) : null}
      {action === 'middle' ? (
        <rect
          className="atlas-mouse-control-active atlas-mouse-control-wheel"
          x="12"
          y="5"
          width="4"
          height="7.5"
          rx="2"
        />
      ) : null}
      {action === 'wheel' ? (
        <>
          <rect
            className="atlas-mouse-control-active atlas-mouse-control-wheel"
            x="12"
            y="5"
            width="4"
            height="7.5"
            rx="2"
          />
          <path className="atlas-mouse-control-motion" d="m25 8 1.5-1.8L28 8M26.5 6.4v4.2m-1.5 2.1 1.5 1.8 1.5-1.8" />
        </>
      ) : null}
    </svg>
  )
}

export function MouseControlGuide({ language }: MouseControlGuideProps) {
  const controls = controlCopy[language]

  return (
    <footer
      aria-label={language === 'zh' ? '地图鼠标操作说明' : 'Map mouse controls'}
      className="atlas-mouse-guide"
    >
      <div className="atlas-mouse-guide-heading" aria-hidden="true">
        <span>{language === 'zh' ? '鼠标操作' : 'Mouse controls'}</span>
        <span className="atlas-mouse-guide-line" />
      </div>
      <div className="atlas-mouse-guide-grid">
        {controls.map((control) => (
          <div className="atlas-mouse-guide-item" key={control.action}>
            <MouseIcon action={control.action} />
            <span className="atlas-mouse-guide-copy">
              <span>{control.key}</span>
              <strong>{control.label}</strong>
            </span>
          </div>
        ))}
      </div>
    </footer>
  )
}
