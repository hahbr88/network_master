
export function HeaderSection() {
    return (
        <div className="flex w-full items-center justify-between rounded-[2rem] border border-white/70 bg-white/72 p-4 text-left shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur transition hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 md:p-6">
          <div className="mt-2 flex items-center gap-3">
            <BrandLogo className="h-10 w-10 shrink-0 rounded-xl shadow-[0_16px_30px_-20px_rgba(15,23,42,0.8)]" />
            <h1 className="text-xl font-black tracking-[-0.04em] text-slate-950 md:text-2xl">
              네트워크관리사 2급 랜덤 문제
            </h1>
          </div>
          <p className="text-xs hidden md:block font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Network Master
          </p>
        </div>
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