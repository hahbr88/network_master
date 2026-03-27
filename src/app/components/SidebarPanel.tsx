import type { ReactNode } from 'react'
import { FiAlignJustify, FiChevronsLeft } from 'react-icons/fi'

export function SidebarPanel({
  children,
  isOpen,
  onClose,
  onOpen,
  onSelectSubject,
  selectedSubject,
  subjects,
}: {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  onSelectSubject: (subject: string) => void
  selectedSubject: string
  subjects: string[]
}) {
  return (
    <>
      {isOpen ? (
        <aside className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur transition-all duration-300 ease-out">
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={onClose}
            className="flex cursor-pointer w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            <span>설정바 접기</span>
            <FiChevronsLeft className="h-4 w-4" />
          </button>

          <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
            {subjects.map((item) => {
              const active = item === selectedSubject

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSelectSubject(item)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? 'border-sky-500 bg-sky-600 text-white shadow-lg shadow-sky-300/40'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>

          {children}
        </aside>
      ) : null}

      {!isOpen ? (
        <div className="mb-1">
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={onOpen}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            <FiAlignJustify className="h-4 w-4" />
            <span>설정바 열기</span>
          </button>
        </div>
      ) : null}
    </>
  )
}
