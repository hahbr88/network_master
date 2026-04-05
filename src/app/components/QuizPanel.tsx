import { useEffect, useRef, useState } from 'react'
import { FiLoader } from 'react-icons/fi'
import type { ChoiceNumber, QuestionCard, QuestionProgress } from '../../types'
import type { QuizFilter, QuizMode } from '../types'
import {
  formatExamLabel,
  formatLastResult,
  getQuizModeLabel,
  TEXT_CORRECT,
  TEXT_WRONG,
} from '../utils'

type ExamSessionInfo = {
  currentIndex: number
  totalQuestions: number
  answeredCount: number
  correctCount: number
  hasNext: boolean
}

type ExamResultSummary = {
  totalQuestions: number
  answeredCount: number
  correctCount: number
  wrongCount: number
  score: number
  subjectStats: Array<{
    subject: string
    total: number
    correct: number
  }>
}

export function QuizPanel({
  current,
  currentProgress,
  onChoiceNoteChange,
  onNextQuestion,
  onSelect,
  onSubmit,
  onToggleChoiceNotes,
  openNotes,
  revealed,
  selected,
  quizFilter,
  quizMode,
  examSession,
  examReadyForResult,
  examResultOpen,
  examResultSummary,
  onOpenExamResult,
  onRestartExam,
  onSwitchToRandomMode,
}: {
  current: QuestionCard | null
  currentProgress: QuestionProgress
  eligibleCount: number
  onChoiceNoteChange: (choice: ChoiceNumber, note: string) => void
  onNextQuestion: () => void
  onSelect: (choice: number) => void
  onSubmit: () => void
  onToggleChoiceNotes: (choice: ChoiceNumber) => void
  openNotes: Record<string, boolean>
  revealed: boolean
  selected: number | null
  quizFilter: QuizFilter
  quizMode: QuizMode
  examSession: ExamSessionInfo | null
  examReadyForResult: boolean
  examResultOpen: boolean
  examResultSummary: ExamResultSummary | null
  onOpenExamResult: () => void
  onRestartExam: () => void
  onSwitchToRandomMode: () => void
}) {
  const questionTopRef = useRef<HTMLDivElement | null>(null)
  const hasMountedRef = useRef(false)
  const [aiExplanationRequested, setAiExplanationRequested] = useState<
    Record<string, boolean>
  >({})
  const [aiExplanationVisible, setAiExplanationVisible] = useState<
    Record<string, boolean>
  >({})
  const aiExplanationTimersRef = useRef<Record<string, number>>({})

  useEffect(() => {
    Object.values(aiExplanationTimersRef.current).forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })
    aiExplanationTimersRef.current = {}
    setAiExplanationRequested({})
    setAiExplanationVisible({})
  }, [current?.examId, current?.number, revealed])

  useEffect(() => {
    if (!current) {
      return
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    questionTopRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [current?.examId, current?.number])

  if (quizMode === 'exam' && examResultOpen && examResultSummary) {
    return (
      <div className="flex flex-col gap-6">
        <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-6 py-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
            Exam Result
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950">
            {examResultSummary.score}점
          </h2>
          <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                정답
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {examResultSummary.correctCount}문항
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                오답
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {examResultSummary.wrongCount}문항
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                응시
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {examResultSummary.answeredCount} / {examResultSummary.totalQuestions}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white px-6 py-6">
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Subject Breakdown
          </p>
          <div className="mt-4 grid gap-3">
            {examResultSummary.subjectStats.map((item) => (
              <div
                key={item.subject}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.subject}
                  </p>
                  <p className="text-sm text-slate-700">
                    {item.correct} / {item.total}
                  </p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#22c55e)]"
                    style={{
                      width: `${Math.round((item.correct / item.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={onRestartExam}
            className="rounded-full border border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            다시 회차 풀기
          </button>
          <button
            type="button"
            onClick={onSwitchToRandomMode}
            className="rounded-full bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            랜덤 풀기
          </button>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <EmptyState
        title={
          quizMode === 'exam'
            ? '선택한 회차에 표시할 문제가 없습니다.'
            : quizFilter === 'wrong'
              ? '오답 문제가 아직 없습니다.'
              : quizFilter === 'noted'
                ? '메모가 있는 문제가 아직 없습니다.'
                : '표시할 문제가 없습니다.'
        }
        description={
          quizMode === 'exam'
            ? '설정바에서 다른 회차를 선택하면 바로 모의고사를 시작할 수 있습니다.'
            : quizFilter === 'wrong'
              ? '먼저 문제를 풀고 오답 기록을 쌓아 보세요.'
              : quizFilter === 'noted'
                ? '선택지에 메모를 남기면 메모가 있는 문제만 따로 학습할 수 있습니다.'
                : '과목이나 필터 조건을 바꾸면 문제를 다시 볼 수 있습니다.'
        }
      />
    )
  }

  const answerAiPanelKey = `${current.examId}-${current.number}-answer-ai`
  const answerAiRequested = aiExplanationRequested[answerAiPanelKey] ?? false
  const answerAiVisible = aiExplanationVisible[answerAiPanelKey] ?? false

  const requestAiExplanation = (panelKey: string) => {
    if (aiExplanationVisible[panelKey]) {
      const timeoutId = aiExplanationTimersRef.current[panelKey]
      if (timeoutId) {
        window.clearTimeout(timeoutId)
        delete aiExplanationTimersRef.current[panelKey]
      }
      setAiExplanationRequested((previous) => ({
        ...previous,
        [panelKey]: false,
      }))
      setAiExplanationVisible((previous) => ({
        ...previous,
        [panelKey]: false,
      }))
      return
    }

    if (aiExplanationRequested[panelKey]) {
      const timeoutId = aiExplanationTimersRef.current[panelKey]
      if (timeoutId) {
        window.clearTimeout(timeoutId)
        delete aiExplanationTimersRef.current[panelKey]
      }
      setAiExplanationRequested((previous) => ({
        ...previous,
        [panelKey]: false,
      }))
      return
    }

    setAiExplanationRequested((previous) => ({ ...previous, [panelKey]: true }))

    const timeoutId = window.setTimeout(() => {
      setAiExplanationVisible((previous) => ({ ...previous, [panelKey]: true }))
      delete aiExplanationTimersRef.current[panelKey]
    }, 450)

    aiExplanationTimersRef.current[panelKey] = timeoutId
  }

  const nextActionDisabled =
    quizMode === 'exam' ? !revealed || !examSession?.hasNext : false

  return (
    <div className="flex flex-col gap-6 pb-14 md:pb-0">
      <div ref={questionTopRef} className="scroll-mt-6 md:scroll-mt-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              <span>{getQuizModeLabel(quizMode)}</span>
              <span className="text-slate-300">/</span>
              <span>{formatExamLabel(current)}</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950 md:text-3xl">
              {quizMode === 'exam' && examSession
                ? `${examSession.currentIndex + 1} / ${examSession.totalQuestions}`
                : `${current.number}번`}
            </h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm leading-7 text-slate-600">
              <div>시도 횟수: {currentProgress.attempts}회</div>
              <span>/</span>
              <div>최근 결과: {formatLastResult(currentProgress)}</div>
              <span>/</span>
              <div>정답 횟수: {currentProgress.correctCount}회</div>
              <span>/</span>
              <div>오답 횟수: {currentProgress.wrongCount}회</div>
            </div>

            {quizMode === 'exam' && examSession ? (
              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <p>
                  진행률 {examSession.answeredCount} / {examSession.totalQuestions}
                </p>
                <p className="mt-1">
                  지금까지 맞춘 문항 수 {examSession.correctCount}개
                </p>
              </div>
            ) : null}
          </div>

          <div className="hidden gap-3 md:flex md:self-end xl:shrink-0">
            {examReadyForResult ? (
              <button
                type="button"
                onClick={onOpenExamResult}
                className="cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold whitespace-nowrap text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                결과 확인
              </button>
            ) : (
              <button
                type="button"
                onClick={onNextQuestion}
                disabled={nextActionDisabled}
                className="cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold whitespace-nowrap text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                다음 문제
              </button>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={selected === null || revealed}
              className="cursor-pointer rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              정답 확인
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] bg-slate-950 px-5 py-6 text-slate-50 md:px-7">
        <p className="text-lg leading-8 whitespace-pre-line break-words md:text-xl">
          {current.question}
        </p>
      </div>

      <div className="grid gap-3">
        {current.choices.map((choice, index) => {
          const choiceNumber = (index + 1) as ChoiceNumber
          const notePanelKey = `${current.examId}-${current.number}-${choiceNumber}`
          const aiPanelKey = `${notePanelKey}-ai`
          const isSelected = selected === choiceNumber
          const isCorrect = current.answer === choiceNumber
          const showCorrect = revealed && isCorrect
          const showWrong = revealed && isSelected && !isCorrect
          const note = currentProgress.choiceNotes[choiceNumber] ?? ''
          const notesOpen = openNotes[notePanelKey] ?? false
          const hasNote = Boolean(note.trim())
          const choiceExplanation = current.choiceExplanations?.[index]
          const aiRequested = aiExplanationRequested[aiPanelKey] ?? false
          const aiVisible = aiExplanationVisible[aiPanelKey] ?? false

          return (
            <div
              key={`${current.examId}-${current.number}-${choiceNumber}`}
              className={`rounded-[1.4rem] border px-5 py-4 transition ${
                showCorrect
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                  : showWrong
                    ? 'border-rose-500 bg-rose-50 text-rose-900'
                    : isSelected
                      ? 'border-sky-500 bg-sky-50 text-sky-900'
                      : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelect(choiceNumber)}
                  disabled={revealed}
                  className="min-w-0 flex-1 rounded-xl text-left outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-default"
                >
                  <span className="block text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                    Choice {choiceNumber}
                  </span>
                  <span className="mt-2 block text-base leading-7">
                    {choice}
                  </span>
                </button>

                <button
                  type="button"
                  aria-expanded={notesOpen}
                  onClick={() => onToggleChoiceNotes(choiceNumber)}
                  className={`shrink-0 rounded-full border px-1.5 py-1 text-[9px] leading-none font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 md:px-2 md:py-1 md:text-[11px] ${
                    notesOpen
                      ? 'border-sky-300 bg-sky-50 text-sky-700'
                      : hasNote
                        ? 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {notesOpen ? '메모 닫기' : hasNote ? '메모 보기' : '메모 쓰기'}
                </button>
              </div>

              {notesOpen ? (
                <textarea
                  value={note}
                  onChange={(event) =>
                    onChoiceNoteChange(choiceNumber, event.target.value)
                  }
                  placeholder="이 선택지에 대한 헷갈린 포인트나 암기 내용을 적어 두세요."
                  className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-sky-400"
                />
              ) : null}

              {revealed && choiceExplanation ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => requestAiExplanation(aiPanelKey)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-sky-200 disabled:bg-sky-50 disabled:text-sky-700"
                  >
                    <span>{aiVisible ? 'AI 해설 닫기' : 'AI 해설 보기'}</span>
                    {aiRequested && !aiVisible ? (
                      <FiLoader className="h-3 w-3 animate-spin" />
                    ) : null}
                  </button>
                </div>
              ) : null}

              {revealed && aiRequested && !aiVisible && choiceExplanation ? (
                <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                    AI 해설
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-11/12 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-3 w-10/12 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-3 w-8/12 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
              ) : null}

              {revealed && aiVisible && choiceExplanation ? (
                <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                    AI 해설
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {choiceExplanation}
                  </p>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      {revealed ? (
        <div
          className={`rounded-[1.5rem] border px-5 py-5 ${
            selected === current.answer
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-amber-300 bg-amber-50'
          }`}
        >
          <p className="text-sm font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Result
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-900">
            {selected === current.answer ? TEXT_CORRECT : TEXT_WRONG}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            정답은 {current.answer}번, {current.answerText}입니다.
          </p>
          {current.answerExplanation ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => requestAiExplanation(answerAiPanelKey)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-sky-200 disabled:bg-sky-50 disabled:text-sky-700"
              >
                <span>{answerAiVisible ? 'AI 해설 닫기' : 'AI 해설 보기'}</span>
                {answerAiRequested && !answerAiVisible ? (
                  <FiLoader className="h-3 w-3 animate-spin" />
                ) : null}
              </button>
            </div>
          ) : null}
          {answerAiRequested && !answerAiVisible && current.answerExplanation ? (
            <div className="mt-4 rounded-[1.2rem] border border-slate-200/80 bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
                정답 해설
              </p>
              <div className="mt-3 space-y-2">
                <div className="h-3 w-11/12 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-10/12 animate-pulse rounded-full bg-slate-200" />
                <div className="h-3 w-9/12 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
          ) : null}
          {answerAiVisible && current.answerExplanation ? (
            <div className="mt-4 rounded-[1.2rem] border border-slate-200/80 bg-white/70 px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">
                정답 해설
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                {current.answerExplanation}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-2 text-sm leading-7 text-slate-600">
          선택지를 고른 뒤 정답 확인을 누르거나, Enter 키로 바로 채점할 수 있습니다.
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-2 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          {examReadyForResult ? (
            <button
              type="button"
              onClick={onOpenExamResult}
              className="flex-1 cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              결과 확인
            </button>
          ) : (
            <button
              type="button"
              onClick={onNextQuestion}
              disabled={nextActionDisabled}
              className="flex-1 cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              다음 문제
            </button>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={selected === null || revealed}
            className="flex-1 cursor-pointer rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            정답 확인
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="max-w-md">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  )
}
