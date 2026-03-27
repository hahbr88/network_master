import { FiChevronUp } from 'react-icons/fi'
import { totalExamCount, totalQuestionCount } from '../../data'

export function HeaderSection({
  currentSubject,
  noteCount,
  onToggle,
  titleOpen,
  wrongQuestionCount,
}: {
  currentSubject: string
  noteCount: number
  onToggle: () => void
  titleOpen: boolean
  wrongQuestionCount: number
}) {
  if (!titleOpen) {
    return (
      <button
        type="button"
        aria-expanded={titleOpen}
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-[2rem] border border-white/70 bg-white/72 p-4 text-left shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur transition hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 md:p-6"
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Network Master
          </p>
          <div className="mt-2 flex items-center gap-3">
            <BrandLogo className="h-10 w-10 shrink-0 rounded-xl shadow-[0_16px_30px_-20px_rgba(15,23,42,0.8)]" />
            <h1 className="text-xl font-black tracking-[-0.04em] text-slate-950 md:text-2xl">
              네트워크관리사 2급 랜덤 문제
            </h1>
          </div>
        </div>
        <ChevronIcon open={titleOpen} />
      </button>
    )
  }

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/72 p-4 shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur transition-all duration-300 ease-out md:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Network Master
          </p>
          <div className="mt-3 flex items-start gap-3 md:gap-4">
            <div>
              <div className="flex gap-3">
                <BrandLogo className="mt-1 h-11 w-11 shrink-0 rounded-xl shadow-[0_18px_38px_-22px_rgba(15,23,42,0.8)] md:h-14 md:w-14" />
                <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
                  네트워크관리사 2급
                  <br />
                  랜덤 문제 풀이
                </h1>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                기출 문제를 랜덤으로 풀고, 오답과 메모를 함께 관리할 수 있는 학습용 문제 풀이 앱입니다.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="시험 수" value={`${totalExamCount}`} />
          <StatCard label="전체 문제" value={`${totalQuestionCount}`} />
          <StatCard label="오답 수" value={`${wrongQuestionCount}`} />
          <StatCard label="메모 수" value={`${noteCount}`} />
        </div>

        <button
          type="button"
          aria-expanded={titleOpen}
          onClick={onToggle}
          className="self-start rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          <FiChevronUp />
        </button>
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-slate-200/70 bg-white/70 px-4 py-3 text-sm text-slate-600">
        현재 과목: <span className="font-semibold text-slate-900">{currentSubject}</span>
      </div>
    </section>
  )
}

function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Network Master logo"
    >
      <defs>
        <linearGradient
          id="brand-bg"
          x1="12"
          y1="10"
          x2="52"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient
          id="brand-line"
          x1="18"
          y1="18"
          x2="46"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#brand-bg)" />
      <path
        d="M18 18 32 12 46 18 48 34 36 48 20 46 16 30Z"
        fill="none"
        stroke="url(#brand-line)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      <path
        d="M18 18 36 48M46 18 20 46M32 12 16 30M48 34 20 46"
        fill="none"
        stroke="rgba(255,255,255,0.32)"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <circle cx="18" cy="18" r="4.5" fill="#f8fafc" />
      <circle cx="32" cy="12" r="4.5" fill="#fde68a" />
      <circle cx="46" cy="18" r="4.5" fill="#f8fafc" />
      <circle cx="48" cy="34" r="4.5" fill="#bae6fd" />
      <circle cx="36" cy="48" r="4.5" fill="#f8fafc" />
      <circle cx="20" cy="46" r="4.5" fill="#bae6fd" />
      <circle cx="16" cy="30" r="4.5" fill="#fde68a" />
    </svg>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-white/70 bg-slate-950 px-4 py-4 text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.6)]">
      <p className="text-[9px] font-semibold tracking-[0.26em] text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-2 text-lg font-black tracking-[-0.04em]">{value}</p>
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`}
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
  )
}
