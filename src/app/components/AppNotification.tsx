import { FiCheckCircle, FiXCircle } from 'react-icons/fi'

export function AppNotification({
  isOpen,
  message,
  onClose,
  tone = 'success',
}: {
  isOpen: boolean
  message: string
  onClose: () => void
  tone?: 'success' | 'error'
}) {
  if (!isOpen) {
    return null
  }

  const isSuccess = tone === 'success'
  const Icon = isSuccess ? FiCheckCircle : FiXCircle

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[60] w-[min(92vw,26rem)]">
      <div
        className={`pointer-events-auto rounded-2xl border bg-white/95 px-4 py-3 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur transition ${
          isSuccess ? 'border-emerald-200' : 'border-rose-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-full p-1.5 ${
              isSuccess
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {isSuccess ? 'Done' : 'Error'}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close notification"
          >
            <FiXCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

