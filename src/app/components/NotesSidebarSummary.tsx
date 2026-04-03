export function NotesSidebarSummary({
  noteCount,
}: {
  noteCount: number
}) {
  return (
    <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
        Notes
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        메모를 남긴 선택지를 다시 모아 보고, 필요한 문제만 빠르게 복습할 수
        있습니다.
      </p>
      <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
        메모가 있는 문제 {noteCount}개
      </div>
    </div>
  )
}
