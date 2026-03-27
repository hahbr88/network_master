import type { ReactNode } from 'react'

export function ViewToggleButton({
  active,
  description,
  icon,
  onClick,
  title,
}: {
  active: boolean
  description: string
  icon: ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.4rem] border px-5 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
        active
          ? 'border-sky-500 bg-sky-50'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full p-2 ${
            active ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </button>
  )
}
