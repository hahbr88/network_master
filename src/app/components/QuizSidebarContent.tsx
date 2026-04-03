import { QuizFilterButton } from './QuizFilterButton'
import { formatExamOnlyLabel } from '../utils'
import type { QuizFilter, QuizMode } from '../types'

type QuestionCounts = {
  all: number
  wrong: number
  noted: number
}

type ExamSummary = {
  examId: string
  questionCount: number
  examDate: string | null
  round: number | null
  title?: string
}

type ExamSession = {
  answeredCount: number
  totalQuestions: number
} | null

type QuizSidebarContentProps = {
  examSession: ExamSession
  progressOpen: boolean
  progressPercent: number
  prioritizeUnsolved: boolean
  questionCounts: QuestionCounts
  quizFilter: QuizFilter
  quizMode: QuizMode
  selectedExamId: string | null
  selectedExamSummary: ExamSummary | null
  solvedQuestionCount: number
  subjectQuestionCount: number
  examSummaries: ExamSummary[]
  onQuizModeChange: (mode: QuizMode) => void
  onQuizFilterChange: (filter: QuizFilter) => void
  onSelectedExamChange: (examId: string) => void
  onPrioritizeUnsolvedToggle: () => void
  onProgressToggle: () => void
}

export function QuizSidebarContent({
  examSession,
  examSummaries,
  onPrioritizeUnsolvedToggle,
  onProgressToggle,
  onQuizFilterChange,
  onQuizModeChange,
  onSelectedExamChange,
  prioritizeUnsolved,
  progressOpen,
  progressPercent,
  questionCounts,
  quizFilter,
  quizMode,
  selectedExamId,
  selectedExamSummary,
  solvedQuestionCount,
  subjectQuestionCount,
}: QuizSidebarContentProps) {
  const filterLockByUnsolved = prioritizeUnsolved

  if (quizMode === 'exam') {
    return (
      <div className="mt-6 grid gap-4">
        <ModeCard
          quizMode={quizMode}
          onQuizModeChange={onQuizModeChange}
        />

        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Exam Round
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            선택한 회차의 50문항을 문제 순서대로 풀 수 있습니다.
          </p>
          <div className="mt-4">
            <label
              htmlFor="exam-round-select"
              className="mb-2 block text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase"
            >
              회차 선택
            </label>
            <select
              id="exam-round-select"
              value={selectedExamId ?? ''}
              onChange={(event) => onSelectedExamChange(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              {examSummaries.map((exam) => (
                <option key={exam.examId} value={exam.examId}>
                  {formatExamOnlyLabel(exam)} · {exam.questionCount}문항
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedExamSummary ? (
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Selected Exam
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatExamOnlyLabel(selectedExamSummary)}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              전체 {selectedExamSummary.questionCount}문항
            </p>
            {examSession ? (
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#22c55e)] transition-[width] duration-300 ease-out"
                  style={{
                    width: `${
                      examSession.totalQuestions === 0
                        ? 0
                        : Math.round(
                            (examSession.answeredCount /
                              examSession.totalQuestions) *
                              100,
                          )
                    }%`,
                  }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-4">
      <ModeCard quizMode={quizMode} onQuizModeChange={onQuizModeChange} />

      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            랜덤 문제 설정
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            과목, 오답, 메모 조건을 기준으로 다음 문제를 랜덤하게 출제합니다.
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <ToggleCard
            checked={prioritizeUnsolved}
            description="아직 한 번도 풀지 않은 문제가 있으면 먼저 보여줍니다."
            label="미풀이 우선 출제"
            onClick={onPrioritizeUnsolvedToggle}
          />

          <ToggleCard
            checked={progressOpen}
            description="현재 과목 기준으로 얼마나 풀었는지 확인합니다."
            label="진행률 보기"
            onClick={onProgressToggle}
          />
        </div>
      </div>

      {progressOpen ? (
        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                Progress
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                현재 선택한 과목 기준으로 풀이 진척도를 보여줍니다.
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-950">
              {progressPercent}%
            </p>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#22c55e)] transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-600">
            <p>
              풀이한 문제 {solvedQuestionCount} / {subjectQuestionCount}
            </p>
            <p>남은 문제 {questionCounts.all - solvedQuestionCount}</p>
          </div>
        </div>
      ) : null}

      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            문제 필터
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            전체, 오답, 메모 문제만 골라서 다시 학습할 수 있습니다.
          </p>
        </div>

        <div className="mt-4 grid gap-2">
          <QuizFilterButton
            active={quizFilter === 'all'}
            count={questionCounts.all}
            label="전체 문제"
            onClick={() => onQuizFilterChange('all')}
            tone="slate"
          />
          <QuizFilterButton
            active={quizFilter === 'wrong'}
            count={questionCounts.wrong}
            disabled={filterLockByUnsolved}
            label="오답 문제"
            onClick={() => onQuizFilterChange('wrong')}
            tone="rose"
          />
          <QuizFilterButton
            active={quizFilter === 'noted'}
            count={questionCounts.noted}
            disabled={filterLockByUnsolved}
            label="메모 문제"
            onClick={() => onQuizFilterChange('noted')}
            tone="amber"
          />
        </div>
        {filterLockByUnsolved ? (
          <p className="mt-3 text-xs leading-6 text-slate-500">
            미풀이 우선 출제가 켜져 있으면 필터는 전체 문제로 고정됩니다.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function ModeCard({
  onQuizModeChange,
  quizMode,
}: {
  onQuizModeChange: (mode: QuizMode) => void
  quizMode: QuizMode
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
        Quiz Mode
      </p>
      <div className="mt-4 grid gap-2">
        <ModeButton
          active={quizMode === 'random'}
          label="랜덤 문제"
          onClick={() => onQuizModeChange('random')}
        />
        <ModeButton
          active={quizMode === 'exam'}
          label="회차 모의고사"
          onClick={() => onQuizModeChange('exam')}
        />
      </div>
    </div>
  )
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? 'border border-sky-500 bg-sky-600 text-white shadow-lg shadow-sky-300/40'
          : 'border border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50'
      }`}
    >
      {label}
    </button>
  )
}

function ToggleCard({
  checked,
  description,
  label,
  onClick,
}: {
  checked: boolean
  description: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-xs leading-6 text-slate-500">{description}</p>
      </div>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-sky-500' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}
