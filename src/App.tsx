import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  FiAlignJustify,
  FiBookOpen,
  FiCheckCircle,
  FiChevronsLeft,
  FiClipboard,
  FiEdit3,
  FiFileText,
  FiXCircle,
  FiChevronUp,
} from 'react-icons/fi'
import {
  allQuestions,
  subjects,
  totalExamCount,
  totalQuestionCount,
} from './data'
import {
  createEmptyProgress,
  exportProgress,
  getQuestionKey,
  importProgress,
  loadProgress,
  mergeProgress,
  saveProgress,
  updateChoiceNote,
  updateQuestionAttempt,
} from './storage'
import type { ChoiceNumber, ProgressMap, QuestionCard } from './types'

const LABEL_ALL = '전체'
const TEXT_UNKNOWN_ROUND = '회차 미상'
const TEXT_NOT_SOLVED = '미풀이'
const TEXT_CORRECT = '정답입니다.'
const TEXT_WRONG = '오답입니다.'
const UI_STATE_STORAGE_KEY = 'network-master-ui-state'

type AppView = 'quiz' | 'notes'
type QuizFilter = 'all' | 'wrong' | 'noted'

type UiState = {
  titleOpen: boolean
  sidebarOpen: boolean
  view: AppView
  quizFilter: QuizFilter
}

type NoteStudyItem = {
  id: string
  question: QuestionCard
  progress: ReturnType<typeof createEmptyProgress>
  notes: Array<{
    choiceNumber: ChoiceNumber
    choiceText: string
    note: string
  }>
}

const DEFAULT_UI_STATE: UiState = {
  titleOpen: true,
  sidebarOpen: true,
  view: 'quiz',
  quizFilter: 'all',
}

function pickRandomQuestion(pool: QuestionCard[], previousId?: string) {
  if (pool.length === 0) {
    return null
  }

  if (pool.length === 1) {
    return pool[0]
  }

  let candidate = pool[Math.floor(Math.random() * pool.length)]
  while (`${candidate.examId}-${candidate.number}` === previousId) {
    candidate = pool[Math.floor(Math.random() * pool.length)]
  }

  return candidate
}

function getQuestionId(question: QuestionCard) {
  return `${question.examId}-${question.number}`
}

function formatExamLabel(question: QuestionCard) {
  const date = question.examDate ?? question.examId
  const round = question.round ? `${question.round}회` : TEXT_UNKNOWN_ROUND
  return `${date} / ${round} / ${question.subject}`
}

function formatAttemptText(attempts: number) {
  return attempts <= 0 ? TEXT_NOT_SOLVED : `${attempts}번째 풀이`
}

function formatLastResult(progress: ReturnType<typeof createEmptyProgress>) {
  if (
    !progress.attempts ||
    progress.lastSelectedChoice === null ||
    progress.lastWasCorrect === null
  ) {
    return TEXT_NOT_SOLVED
  }

  return `${progress.lastSelectedChoice}번 / ${
    progress.lastWasCorrect ? '정답' : '오답'
  }`
}

function loadUiState(): UiState {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_STATE
  }

  try {
    const raw = window.localStorage.getItem(UI_STATE_STORAGE_KEY)
    if (!raw) {
      return DEFAULT_UI_STATE
    }

    const parsed = JSON.parse(raw) as Partial<UiState>
    return {
      titleOpen: parsed.titleOpen ?? DEFAULT_UI_STATE.titleOpen,
      sidebarOpen: parsed.sidebarOpen ?? DEFAULT_UI_STATE.sidebarOpen,
      view: parsed.view === 'notes' ? 'notes' : 'quiz',
      quizFilter:
        parsed.quizFilter === 'wrong' || parsed.quizFilter === 'noted'
          ? parsed.quizFilter
          : DEFAULT_UI_STATE.quizFilter,
    }
  } catch {
    return DEFAULT_UI_STATE
  }
}

function saveUiState(state: UiState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(state))
}

export default function App() {
  const initialUiState = loadUiState()
  const [subject, setSubject] = useState(LABEL_ALL)
  const [current, setCurrent] = useState<QuestionCard | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [progressMap, setProgressMap] = useState<ProgressMap>(() =>
    loadProgress(),
  )
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [dataToolsOpen, setDataToolsOpen] = useState(false)
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({})
  const [titleOpen, setTitleOpen] = useState(initialUiState.titleOpen)
  const [sidebarOpen, setSidebarOpen] = useState(initialUiState.sidebarOpen)
  const [view, setView] = useState<AppView>(initialUiState.view)
  const [quizFilter, setQuizFilter] = useState<QuizFilter>(
    initialUiState.quizFilter,
  )
  const [nextConfirmOpen, setNextConfirmOpen] = useState(false)

  const eligibleQuestions = useMemo(() => {
    const subjectMatched =
      subject === LABEL_ALL
        ? allQuestions
        : allQuestions.filter((question) => question.subject === subject)

    if (quizFilter === 'all') {
      return subjectMatched
    }

    return subjectMatched.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      const progress = progressMap[key]

      if (quizFilter === 'wrong') {
        return (progress?.wrongCount ?? 0) > 0
      }

      return Object.keys(progress?.choiceNotes ?? {}).length > 0
    })
  }, [progressMap, quizFilter, subject])

  const questionCounts = useMemo(() => {
    const subjectMatched =
      subject === LABEL_ALL
        ? allQuestions
        : allQuestions.filter((question) => question.subject === subject)

    const wrong = subjectMatched.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return (progressMap[key]?.wrongCount ?? 0) > 0
    }).length

    const noted = subjectMatched.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return Object.keys(progressMap[key]?.choiceNotes ?? {}).length > 0
    }).length

    return {
      all: subjectMatched.length,
      wrong,
      noted,
    }
  }, [progressMap, subject])

  const currentKey = current
    ? getQuestionKey(current.examId, current.number)
    : null
  const currentProgress = currentKey
    ? (progressMap[currentKey] ?? createEmptyProgress())
    : createEmptyProgress()
  const exportText = useMemo(() => exportProgress(progressMap), [progressMap])

  const notedChoices = useMemo<NoteStudyItem[]>(() => {
    return allQuestions.flatMap((question) => {
      const questionKey = getQuestionKey(question.examId, question.number)
      const progress = progressMap[questionKey]
      if (!progress) {
        return []
      }

      const notes = question.choices.flatMap((choiceText, index) => {
        const choiceNumber = (index + 1) as ChoiceNumber
        const note = progress.choiceNotes[choiceNumber]?.trim()

        return note
          ? [
              {
                choiceNumber,
                choiceText,
                note,
              },
            ]
          : []
      })

      return notes.length > 0
        ? [
            {
              id: questionKey,
              question,
              progress,
              notes,
            },
          ]
        : []
    })
  }, [progressMap])

  const subjectFilteredNotes = useMemo(() => {
    return subject === LABEL_ALL
      ? notedChoices
      : notedChoices.filter((item) => item.question.subject === subject)
  }, [notedChoices, subject])

  const wrongQuestionCount = questionCounts.wrong

  useEffect(() => {
    const currentStillEligible =
      current &&
      eligibleQuestions.some(
        (question) => getQuestionId(question) === getQuestionId(current),
      )

    if (currentStillEligible) {
      return
    }

    const next = pickRandomQuestion(eligibleQuestions)
    setCurrent(next)
    setSelected(null)
    setRevealed(false)
  }, [current, eligibleQuestions])

  useEffect(() => {
    saveProgress(progressMap)
  }, [progressMap])

  useEffect(() => {
    saveUiState({ titleOpen, sidebarOpen, view, quizFilter })
  }, [titleOpen, sidebarOpen, view, quizFilter])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }

      if (nextConfirmOpen) {
        if (event.key === 'Enter') {
          event.preventDefault()
          confirmNextQuestion()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          setNextConfirmOpen(false)
        }
        return
      }

      if (event.key === 'Tab' && revealed) {
        event.preventDefault()
        setNextConfirmOpen(true)
        return
      }

      if (event.key === 'Enter' && selected !== null && !revealed) {
        event.preventDefault()
        submitAnswer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextConfirmOpen, revealed, selected, current])

  const nextQuestion = () => {
    const previousId = current ? getQuestionId(current) : undefined
    const next = pickRandomQuestion(eligibleQuestions, previousId)
    setCurrent(next)
    setSelected(null)
    setRevealed(false)
  }

  const confirmNextQuestion = () => {
    setNextConfirmOpen(false)
    nextQuestion()
  }

  const submitAnswer = () => {
    if (!current || selected === null || !currentKey) {
      return
    }

    setProgressMap((previous) => ({
      ...previous,
      [currentKey]: updateQuestionAttempt(
        previous[currentKey],
        selected,
        current.answer,
      ),
    }))
    setRevealed(true)
  }

  const handleChoiceNoteChange = (choice: ChoiceNumber, note: string) => {
    if (!currentKey) {
      return
    }

    setProgressMap((previous) => ({
      ...previous,
      [currentKey]: updateChoiceNote(previous[currentKey], choice, note),
    }))
  }

  const handleImport = () => {
    try {
      const incoming = importProgress(importText)
      setProgressMap((previous) => mergeProgress(previous, incoming))
      setImportStatus('기록을 가져왔습니다.')
      setImportText('')
    } catch {
      setImportStatus('올바른 JSON 형식이 아니라서 가져오지 못했습니다.')
    }
  }

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const toggleChoiceNotes = (choiceNumber: ChoiceNumber) => {
    if (!current) {
      return
    }

    const key = `${current.examId}-${current.number}-${choiceNumber}`
    setOpenNotes((previous) => ({
      ...previous,
      [key]: !previous[key],
    }))
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.88),_rgba(255,255,255,0.62)_32%,_rgba(239,246,255,0.96)_70%),linear-gradient(135deg,_#dbeafe,_#fef3c7_42%,_#dcfce7)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeaderSection
          currentSubject={subject}
          noteCount={notedChoices.length}
          onToggle={() => setTitleOpen((previous) => !previous)}
          titleOpen={titleOpen}
          wrongQuestionCount={wrongQuestionCount}
        />

        <section className="rounded-[1.75rem] border border-white/70 bg-white/72 p-3 shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="grid gap-2 md:grid-cols-2">
            <ViewToggleButton
              active={view === 'quiz'}
              description="랜덤으로 문제를 풀고 정답을 확인합니다."
              icon={<FiFileText />}
              onClick={() => setView('quiz')}
              title="문제 풀이"
            />
            <ViewToggleButton
              active={view === 'notes'}
              description="직접 적어둔 선지 메모만 따로 모아서 봅니다."
              icon={<FiBookOpen />}
              onClick={() => setView('notes')}
              title="해설 노트"
            />
          </div>
        </section>

        <section
          className={`grid gap-6 transition-all duration-300 ease-out ${
            sidebarOpen
              ? 'lg:grid-cols-[280px_minmax(0,1fr)]'
              : 'lg:grid-cols-1'
          }`}
        >
          {sidebarOpen ? (
            <aside className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur transition-all duration-300 ease-out">
              <button
                type="button"
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen(false)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              >
                <span>과목 필터</span>
                <FiChevronsLeft className="h-4 w-4" />
              </button>

              <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
                {subjects.map((item) => {
                  const active = item === subject
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSubject(item)}
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

              {view === 'quiz' ? (
                <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                      문제 범위
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      전체 문제, 틀린 문제, 메모 있는 문제만 따로 골라서 다시 풀
                      수 있습니다.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <QuizFilterButton
                      active={quizFilter === 'all'}
                      count={questionCounts.all}
                      label="전체 문제"
                      onClick={() => setQuizFilter('all')}
                      tone="slate"
                    />
                    <QuizFilterButton
                      active={quizFilter === 'wrong'}
                      count={questionCounts.wrong}
                      label="틀린 문제만"
                      onClick={() => setQuizFilter('wrong')}
                      tone="rose"
                    />
                    <QuizFilterButton
                      active={quizFilter === 'noted'}
                      count={questionCounts.noted}
                      label="메모 있는 문제만"
                      onClick={() => setQuizFilter('noted')}
                      tone="amber"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                    해설 노트
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    현재 과목 기준으로 저장된 선지 메모를 모아서 보여줍니다.
                  </p>
                  <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                    저장된 메모 {subjectFilteredNotes.length}개
                  </div>
                </div>
              )}
            </aside>
          ) : null}

          <section className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:p-7">
            {!sidebarOpen ? (
              <div className="mb-5">
                <button
                  type="button"
                  aria-expanded={sidebarOpen}
                  onClick={() => setSidebarOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                >
                  <FiAlignJustify className="h-4 w-4" />
                  <span>과목 필터 열기</span>
                </button>
              </div>
            ) : null}

            {view === 'quiz' ? (
              <QuizPanel
                current={current}
                currentProgress={currentProgress}
                eligibleCount={eligibleQuestions.length}
                onChoiceNoteChange={handleChoiceNoteChange}
                onNextQuestion={nextQuestion}
                onSelect={setSelected}
                onSubmit={submitAnswer}
                onToggleChoiceNotes={toggleChoiceNotes}
                openNotes={openNotes}
                revealed={revealed}
                selected={selected}
                quizFilter={quizFilter}
              />
            ) : (
              <NotesStudyPanel
                notes={subjectFilteredNotes}
                onStudyNotedQuestions={() => {
                  setView('quiz')
                  setQuizFilter('noted')
                }}
              />
            )}
          </section>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:p-7">
          <button
            type="button"
            onClick={() => setDataToolsOpen((previous) => !previous)}
            className="flex w-full items-center justify-between rounded-[1.3rem] border border-slate-200 bg-white/70 px-5 py-4 text-left transition hover:border-slate-300 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                기록 도구
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                저장한 풀이 기록과 메모를 JSON으로 내보내거나 가져옵니다.
              </p>
            </div>
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
              <span>{dataToolsOpen ? '닫기' : '열기'}</span>
              <ChevronIcon open={dataToolsOpen} />
            </span>
          </button>

          {dataToolsOpen ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.4rem] border border-slate-200/70 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                      내 기록 내보내기
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      다른 PC에 옮길 수 있도록 현재 풀이 기록과 메모를 JSON
                      형태로 복사합니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyExport}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                  >
                    <FiClipboard className="h-4 w-4" />
                    <span>{copied ? '복사됨' : '전체 복사'}</span>
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
                  다른 PC에서 내보낸 JSON을 붙여 넣으면 기존 기록과 병합합니다.
                </p>
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  placeholder="{ ... }"
                  className="mt-4 min-h-72 w-full rounded-[1.4rem] border border-slate-200 bg-white px-4 py-3 font-mono text-xs leading-6 text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-sky-400"
                />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!importText.trim()}
                    className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    기록 적용하기
                  </button>
                  {importStatus ? (
                    <p className="text-sm text-slate-600">{importStatus}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
        {nextConfirmOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
            <div className="w-full max-w-sm rounded-[1.5rem] border border-white/70 bg-white p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.45)]">
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                Next Question
              </p>
              <h2 className="mt-3 text-xl font-bold text-slate-950">
                다음 문제로 넘어가시겠습니까?
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                확인 버튼을 클릭하거나 Enter를 누르면 다음 문제로 이동합니다.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={confirmNextQuestion}
                  className="flex-1 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                >
                  확인
                </button>
                <button
                  type="button"
                  onClick={() => setNextConfirmOpen(false)}
                  className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

function HeaderSection({
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
          <h1 className="mt-2 text-xl font-black tracking-[-0.04em] text-slate-950 md:text-2xl">
            네트워크관리사 2급 랜덤 문제 앱
          </h1>
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
          <h1 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
            네트워크관리사 2급
            <br />
            랜덤 문제 학습 앱
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
            PDF 기출문제를 랜덤으로 풀고, 틀린 문제만 다시 모아 보거나, 직접
            적어둔 선지 메모를 따로 보며 공부할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="시험 수" value={`${totalExamCount}`} />
          <StatCard label="문항 수" value={`${totalQuestionCount}`} />
          <StatCard label="틀린 문제" value={`${wrongQuestionCount}`} />
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

function ViewToggleButton({
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

function QuizFilterButton({
  active,
  count,
  label,
  onClick,
  tone,
}: {
  active: boolean
  count: number
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
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
        active
          ? activeClass
          : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span>{count}문제</span>
    </button>
  )
}

function QuizPanel({
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
  currentProgress: ReturnType<typeof createEmptyProgress>
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
    <div className="flex flex-col gap-6">
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

        <div className="flex gap-3">
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
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-600">
          선택지를 고른 뒤 정답 확인을 누르거나, 키보드 Enter를 눌러 바로 채점할
          수 있습니다.
        </div>
      )}
    </div>
  )
}

function NotesStudyPanel({
  notes,
  onStudyNotedQuestions,
}: {
  notes: NoteStudyItem[]
  onStudyNotedQuestions: () => void
}) {
  if (notes.length === 0) {
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

        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
          총 {notes.length}개 메모
        </div>
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onStudyNotedQuestions}
          className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
        >
          메모 있는 문제만 다시 풀기
        </button>
      </div>

      <div className="grid gap-4">
        {notes.map((item) => {
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
