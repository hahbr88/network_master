export function QuizFilterButton({
  active,
  count,
  disabled = false,
  label,
  onClick,
  tone,
}: {
  active: boolean
  count: number
  disabled?: boolean
  label: string
  onClick: () => void
  tone: 'slate' | 'rose' | 'amber'
}) {
  const activeClass =
    tone === 'rose'
      ? 'bg-rose-600 text-white hover:bg-rose-500'
      : tone === 'amber'
        ? 'bg-amber-500 text-white hover:bg-amber-400'
        : 'bg-slate-900 text-white hover:bg-slate-800'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
        disabled
          ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
          : active
            ? activeClass
            : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span>{count}문제</span>
    </button>
  )
}
