export type InterfaceLanguage = 'zh' | 'en'

type LanguageToggleProps = {
  language: InterfaceLanguage
  onToggle: () => void
  className?: string
}

export function LanguageToggle({ language, onToggle, className = '' }: LanguageToggleProps) {
  return (
    <button
      aria-label={`Switch interface language to ${language === 'zh' ? 'English' : 'Chinese'}`}
      aria-pressed={language === 'en'}
      className={`theme-toggle atlas-language-toggle pointer-events-auto relative inline-flex h-11 w-[158px] items-center rounded-full border border-white/70 bg-white/58 p-1 text-xs font-semibold text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition hover:bg-white/80 ${className}`}
      onClick={onToggle}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`theme-toggle-thumb absolute inset-y-1 left-1 w-[74px] rounded-full transition duration-300 ${
          language === 'en'
            ? 'translate-x-[76px] bg-sky-300 shadow-[0_12px_30px_rgba(56,189,248,0.28)]'
            : 'translate-x-0 bg-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.18)]'
        }`}
      />
      <span className={`relative z-10 flex w-1/2 items-center justify-center transition ${language === 'zh' ? 'text-white' : 'text-slate-500'}`}>
        中文
      </span>
      <span className={`relative z-10 flex w-1/2 items-center justify-center transition ${language === 'en' ? 'text-slate-950' : 'text-slate-500'}`}>
        English
      </span>
    </button>
  )
}
