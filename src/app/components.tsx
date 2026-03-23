import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  FiCheckCircle,
  FiChevronUp,
  FiEdit3,
  FiSearch,
  FiXCircle,
} from 'react-icons/fi'
import { totalExamCount, totalQuestionCount } from '../data'
import type {
  ChoiceNumber,
  QuestionCard,
  QuestionProgress,
} from '../types'
import type { NoteStudyItem, QuizFilter } from './types'
import {
  formatAttemptText,
  formatExamLabel,
  formatLastResult,
  TEXT_CORRECT,
  TEXT_WRONG,
} from './utils'

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
              네트워크관리사 2급 랜덤 문제 앱
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
              <div className='flex gap-3'>
                <BrandLogo className="mt-1 h-11 w-11 shrink-0 rounded-xl shadow-[0_18px_38px_-22px_rgba(15,23,42,0.8)] md:h-14 md:w-14" />
                <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
                  네트워크관리사 2급
                  <br />
                  랜덤 문제 학습 앱
                </h1>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                PDF 기출문제를 랜덤으로 풀고, 틀린 문제만 다시 모아 보거나, 직접
                적어둔 선지 메모를 따로 보며 공부할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="시험 수" value={`${totalExamCount}`} />
          <StatCard label="문항 수" value={`${totalQuestionCount}`} />
          <StatCard label="틀린문제" value={`${wrongQuestionCount}`} />
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
        현재 과목:{' '}
        <span className="font-semibold text-slate-900">{currentSubject}</span>
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

export function QuizFilterButton({
  active,
  count,
  disabled = false,
  label,
  onClick,
  tone,
}: {
  active: boolean
  count: number
  disabled?: boolean
  label: string
  onClick: () => void
  tone: 'slate' | 'rose' | 'amber'
}) {
  const activeClass =
    tone === 'rose'
      ? 'bg-rose-600 text-white hover:bg-rose-500'
      : tone === 'amber'
        ? 'bg-amber-500 text-white hover:bg-amber-400'
        : 'bg-slate-900 text-white hover:bg-slate-800'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
        disabled
          ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
          : active
          ? activeClass
          : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span>{count}문제</span>
    </button>
  )
}

export function QuizPanel({
  current,
  currentProgress,
  eligibleCount,
  onChoiceNoteChange,
  onNextQuestion,
  onSelect,
  onSubmit,
  onToggleChoiceNotes,
  openNotes,
  revealed,
  selected,
  quizFilter,
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
}) {
  if (!current) {
    return (
      <EmptyState
        title={
          quizFilter === 'wrong'
            ? '틀린 문제로 저장된 문항이 아직 없습니다.'
            : quizFilter === 'noted'
              ? '메모가 저장된 문항이 아직 없습니다.'
              : '조건에 맞는 문제가 없습니다.'
        }
        description={
          quizFilter === 'wrong'
            ? '먼저 일반 모드에서 문제를 풀고 틀린 문제가 생기면 다시 이 모드에서 복습할 수 있습니다.'
            : quizFilter === 'noted'
              ? '문제 풀이 화면에서 선택지 메모를 남기면 이 모드에서 메모가 있는 문제만 다시 풀 수 있습니다.'
              : '과목 필터를 바꾸거나 다른 문제 범위를 선택해 보세요.'
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-14 md:pb-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            {formatExamLabel(current)}
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950 md:text-3xl">
            {current.number}번 문제
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            현재 조건에 맞는 문제 {eligibleCount}개 중에서 랜덤 출제됩니다.
          </p>
        </div>

        <div className="hidden gap-3 md:flex">
          <button
            type="button"
            onClick={onNextQuestion}
            className="cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            다른 문제
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={selected === null}
            className="cursor-pointer rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            정답 확인
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="누적 풀이"
          value={formatAttemptText(currentProgress.attempts)}
        />
        <StatCard
          label="마지막 결과"
          value={formatLastResult(currentProgress)}
        />
        <StatCard label="맞은 횟수" value={`${currentProgress.correctCount}`} />
        <StatCard label="틀린 횟수" value={`${currentProgress.wrongCount}`} />
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="rounded-[1.5rem] bg-slate-950 px-5 py-6 text-slate-50 md:px-7">
        <p className="text-lg leading-8 md:text-xl">{current.question}</p>
      </div>

      <div className="grid gap-3">
        {current.choices.map((choice, index) => {
          const choiceNumber = (index + 1) as ChoiceNumber
          const notePanelKey = `${current.examId}-${current.number}-${choiceNumber}`
          const isSelected = selected === choiceNumber
          const isCorrect = current.answer === choiceNumber
          const showCorrect = revealed && isCorrect
          const showWrong = revealed && isSelected && !isCorrect
          const note = currentProgress.choiceNotes[choiceNumber] ?? ''
          const notesOpen = openNotes[notePanelKey] ?? false
          const hasNote = Boolean(note.trim())

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
                  className="min-w-0 flex-1 rounded-xl text-left outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
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
                  {notesOpen
                    ? '메모 닫기'
                    : hasNote
                      ? '메모 보기'
                      : '메모 쓰기'}
                </button>
              </div>

              {notesOpen ? (
                <textarea
                  value={note}
                  onChange={(event) =>
                    onChoiceNoteChange(choiceNumber, event.target.value)
                  }
                  placeholder="이 선지에 대한 해설이나 내가 헷갈린 포인트를 적어두세요."
                  className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-sky-400"
                />
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
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-2 text-sm leading-7 text-slate-600">
          선택지를 고른 뒤 정답 확인을 누르거나, 키보드 Enter를 눌러 바로 채점할
          수 있습니다.
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 px-4 py-2 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          <button
            type="button"
            onClick={onNextQuestion}
            className="flex-1 cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            다른 문제
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={selected === null}
            className="flex-1 cursor-pointer rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            정답 확인
          </button>
        </div>
      </div>
    </div>
  )
}

export function NotesStudyPanel({
  noteSearchOpen,
  noteQuery,
  notes,
  onNoteSearchToggle,
  onNoteQueryChange,
  onStudyNotedQuestions,
}: {
  noteSearchOpen: boolean
  noteQuery: string
  notes: NoteStudyItem[]
  onNoteSearchToggle: () => void
  onNoteQueryChange: (value: string) => void
  onStudyNotedQuestions: () => void
}) {
  const hasQuery = noteQuery.trim().length > 0
  const [pageSize, setPageSize] = useState<5 | 10 | 20>(5)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [noteQuery, notes.length, pageSize])

  const totalPages = Math.max(1, Math.ceil(notes.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedNotes = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return notes.slice(start, start + pageSize)
  }, [notes, pageSize, safePage])

  if (notes.length === 0 && !hasQuery) {
    return (
      <EmptyState
        title="저장된 선지 메모가 없습니다."
        description="문제 풀이 화면에서 선택지 메모를 남기면 이 페이지에서 따로 모아서 볼 수 있습니다."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Study Notes
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950 md:text-3xl">
            선지 해설 노트
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            문제 풀이 중 직접 적어둔 메모만 따로 모아서 복습할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            총 {notes.length}개 메모
          </div>
          <button
            type="button"
            aria-expanded={noteSearchOpen}
            onClick={onNoteSearchToggle}
            className="rounded-full border border-slate-300 bg-white p-3 text-slate-700 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.4)] transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            {noteSearchOpen ? (
              <FiChevronUp className="h-4 w-4" />
            ) : (
              <FiSearch className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {noteSearchOpen ? (
        <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Search
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {hasQuery
                ? `검색 결과 ${notes.length}개`
                : `현재 조건의 메모 ${notes.length}개`}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={noteQuery}
                onChange={(event) => onNoteQueryChange(event.target.value)}
                placeholder="문제, 선택지, 메모 내용 검색"
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400"
              />
              {hasQuery ? (
                <button
                  type="button"
                  onClick={() => onNoteQueryChange('')}
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  초기화
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onStudyNotedQuestions}
          className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
        >
          메모 있는 문제만 다시 풀기
        </button>
      </div>

      {notes.length > 0 ? (
        <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {([5, 10, 20] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPageSize(size)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    pageSize === size
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {size}개씩 보기
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                이전
              </button>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {safePage} / {totalPages}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safePage === totalPages}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          title="검색 결과가 없습니다."
          description="다른 키워드로 다시 검색해 보세요."
        />
      ) : null}

      {notes.length > 0 ? (
        <div className="grid gap-4">
          {paginatedNotes.map((item) => {
            return (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                      {formatExamLabel(item.question)}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-950">
                      {item.question.number}번 문제
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      메모 {item.notes.length}개
                    </span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {formatAttemptText(item.progress.attempts)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-500">문제</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {item.question.question}
                  </p>
                </div>

                <div className="mt-4 grid gap-4">
                  {item.notes.map((noteItem) => {
                    const isCorrectChoice =
                      item.question.answer === noteItem.choiceNumber

                    return (
                      <div
                        key={`${item.id}-${noteItem.choiceNumber}`}
                        className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Choice {noteItem.choiceNumber}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                              isCorrectChoice
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isCorrectChoice ? (
                              <FiCheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <FiXCircle className="h-3.5 w-3.5" />
                            )}
                            {isCorrectChoice ? '정답 선지' : '오답 선지'}
                          </span>
                        </div>

                        <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-sm font-semibold text-slate-500">
                            선택지
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-700">
                            {noteItem.choiceNumber}. {noteItem.choiceText}
                          </p>
                        </div>

                        <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                            <FiEdit3 className="h-4 w-4" />
                            <span>내 해설 메모</span>
                          </div>
                          <p className="mt-2 text-sm leading-7 whitespace-pre-wrap text-slate-700">
                            {noteItem.note}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </div>
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
