import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { ExamHistoryEntry } from '../../types'
import { formatExamOnlyLabel } from '../../app/utils'

type ExamHistoryCarouselProps = {
  examHistory: ExamHistoryEntry[]
  examTitleMap: Map<string, string>
  onReviewWrongQuestions: (wrongQuestionKeys: string[]) => void
}

export function ExamHistoryCarousel({
  examHistory,
  examTitleMap,
  onReviewWrongQuestions,
}: ExamHistoryCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex((previous) => {
      if (examHistory.length === 0) {
        return 0
      }

      return Math.min(previous, examHistory.length - 1)
    })
  }, [examHistory.length])

  if (examHistory.length === 0) {
    return (
      <EmptySection
        compact
        description="모의고사를 끝내면 결과가 여기에 누적됩니다."
        title="아직 모의고사 기록이 없습니다."
      />
    )
  }

  const activeEntry = examHistory[activeIndex]
  const previewEntries = examHistory.slice(0, 5)

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Latest First
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {activeIndex + 1} / {examHistory.length}번째 기록
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <CarouselButton
              direction="prev"
              disabled={examHistory.length <= 1}
              onClick={() =>
                setActiveIndex((previous) =>
                  previous === 0 ? examHistory.length - 1 : previous - 1,
                )
              }
            />
            <CarouselButton
              direction="next"
              disabled={examHistory.length <= 1}
              onClick={() =>
                setActiveIndex((previous) =>
                  previous === examHistory.length - 1 ? 0 : previous + 1,
                )
              }
            />
          </div>
        </div>

        <article className="rounded-[1.4rem] border border-slate-200 bg-white px-5 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-950">
                {formatExamOnlyLabel({
                  examDate: activeEntry.examDate,
                  examId: activeEntry.examId,
                  round: activeEntry.round,
                })}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {examTitleMap.get(activeEntry.examId) ?? activeEntry.examTitle}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                완료 시각: {formatDateTime(activeEntry.completedAt)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-white">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase">
                Score
              </p>
              <p className="mt-1 text-2xl font-bold">{activeEntry.score}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <MiniStat
              label="정답"
              value={`${activeEntry.correctCount} / ${activeEntry.totalQuestions}`}
            />
            <MiniStat label="오답" value={`${activeEntry.wrongCount}`} />
            <MiniStat
              label="시작 시각"
              value={formatDateTime(activeEntry.startedAt)}
            />
          </div>

          {activeEntry.wrongQuestionKeys.length > 0 ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onReviewWrongQuestions(activeEntry.wrongQuestionKeys)}
                className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                틀린 문제 다시보기
              </button>
            </div>
          ) : activeEntry.wrongCount > 0 ? (
            <p className="mt-4 text-sm leading-7 text-slate-500">
              이 기록은 예전 저장 방식으로 남아 있어, 어떤 문제를 틀렸는지
              복원할 수 없어 다시보기를 지원하지 않습니다.
            </p>
          ) : null}

          <div className="mt-4 grid gap-3">
            {activeEntry.subjectStats.map((subject) => {
              const percent =
                subject.total === 0
                  ? 0
                  : Math.round((subject.correct / subject.total) * 100)

              return (
                <div
                  key={`${activeEntry.examId}-${activeEntry.completedAt}-${subject.subject}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {subject.subject}
                    </p>
                    <p className="text-sm text-slate-700">
                      {subject.correct} / {subject.total}
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#22c55e)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        {examHistory.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {previewEntries.map((entry, index) => (
              <button
                key={`${entry.examId}-${entry.completedAt}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  index === activeIndex
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {formatExamOnlyLabel({
                  examDate: entry.examDate,
                  examId: entry.examId,
                  round: entry.round,
                })}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
      aria-label={direction === 'prev' ? '이전 기록 보기' : '다음 기록 보기'}
    >
      {direction === 'prev' ? (
        <FiChevronLeft className="h-5 w-5" />
      ) : (
        <FiChevronRight className="h-5 w-5" />
      )}
    </button>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  )
}

function EmptySection({
  compact = false,
  description,
  title,
}: {
  compact?: boolean
  description: string
  title: string
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center ${
        compact ? 'mt-5 min-h-[180px]' : 'mt-5 min-h-[220px]'
      }`}
    >
      <div className="max-w-md">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
