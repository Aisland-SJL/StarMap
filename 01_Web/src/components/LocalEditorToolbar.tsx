import { Check, Plus, Settings2, Undo2, X } from 'lucide-react'

type LocalEditorToolbarProps = {
  editing: boolean
  busy?: boolean
  label: string
  onToggle: () => void
  onReset?: () => void
  onSave?: () => void
  onAdd?: () => void
}

export function LocalEditorToolbar({
  editing,
  busy = false,
  label,
  onToggle,
  onReset,
  onSave,
  onAdd,
}: LocalEditorToolbarProps) {
  return (
    <div className="atlas-local-editor-actions" onClick={(event) => event.stopPropagation()}>
      {editing ? (
        <>
          {onReset ? (
            <button type="button" onClick={onReset} disabled={busy} aria-label={`撤销本轮${label}调整`} title="撤销本轮未保存调整">
              <Undo2 />
            </button>
          ) : null}
          {onAdd ? (
            <button type="button" onClick={onAdd} disabled={busy} aria-label={`添加${label}`} title="添加">
              <Plus />
            </button>
          ) : null}
          {onSave ? (
            <button type="button" data-primary="true" onClick={onSave} disabled={busy} aria-label={`保存${label}`} title="保存">
              <Check />
            </button>
          ) : null}
        </>
      ) : null}
      <button
        type="button"
        data-active={editing}
        onClick={onToggle}
        disabled={busy}
        aria-label={editing ? `退出${label}编辑` : `编辑${label}`}
        title={editing ? '退出编辑' : '本地编辑'}
      >
        {editing ? <X /> : <Settings2 />}
      </button>
    </div>
  )
}
