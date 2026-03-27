export function ConfirmModal({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  confirmTone = 'slate',
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
  eyebrow,
}: {
  cancelLabel?: string
  confirmLabel?: string
  confirmTone?: 'slate' | 'red'
  description?: string
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  eyebrow: string
}) {
  if (!isOpen) {
    return null
  }

  const confirmClass =
    confirmTone === 'red'
      ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-300'
      : 'bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-sky-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-sm rounded-[1.5rem] border border-white/70 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-xl font-bold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${confirmClass}`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
