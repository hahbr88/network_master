import { FiClipboard } from 'react-icons/fi'

export function DataToolsPanel({
  copied,
  dataToolsOpen,
  exportText,
  importText,
  onCopyExport,
  onImport,
  onImportTextChange,
  onResetRequest,
  onToggle,
}: {
  copied: boolean
  dataToolsOpen: boolean
  exportText: string
  importText: string
  onCopyExport: () => void
  onImport: () => void
  onImportTextChange: (value: string) => void
  onResetRequest: () => void
  onToggle: () => void
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:p-7">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-[1.3rem] border border-slate-200 bg-white/70 px-5 py-4 text-left transition hover:border-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            기록 도구
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            풀이 기록과 메모를 JSON으로 내보내거나 가져올 수 있습니다.
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
          <span>{dataToolsOpen ? '닫기' : '열기'}</span>
          <span className={`h-4 w-4 transition ${dataToolsOpen ? 'rotate-180' : ''}`}>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path
                d="M5 7.5 10 12.5 15 7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
      </button>

      {dataToolsOpen ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.4rem] border border-slate-200/70 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                  기록 내보내기
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  현재 브라우저에 저장된 풀이 기록과 메모를 JSON 텍스트로 복사할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={onCopyExport}
                className="flex shrink-0 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              >
                <FiClipboard className="h-4 w-4" />
                <span>{copied ? '복사됨' : 'JSON 복사'}</span>
              </button>
            </div>
            <textarea
              readOnly
              value={exportText}
              className="mt-4 min-h-72 w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 font-mono text-xs leading-6 text-slate-700 outline-none"
            />
          </div>

          <div className="rounded-[1.4rem] border border-slate-200/70 bg-slate-50 p-5">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              기록 가져오기
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              다른 브라우저나 PC에서 내보낸 JSON을 붙여 넣어 기록을 합칠 수 있습니다.
            </p>
            <textarea
              value={importText}
              onChange={(event) => onImportTextChange(event.target.value)}
              placeholder="{ ... }"
              className="mt-4 min-h-72 w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 font-mono text-xs leading-6 text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-sky-400"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onImport}
                disabled={!importText.trim()}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                기록 가져오기
              </button>
              <button
                type="button"
                onClick={onResetRequest}
                className="rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                기록 초기화
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
