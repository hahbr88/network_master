import { useEffect, useMemo, useState } from 'react'
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
import { FiAlignJustify, FiChevronsLeft } from 'react-icons/fi'

const LABEL_ALL = '전체'
const TEXT_UNKNOWN_ROUND = '회차 미상'
const TEXT_NOT_SOLVED = '미풀이'
const TEXT_CORRECT = '정답.'
const TEXT_WRONG = '오답.'
const UI_STATE_STORAGE_KEY = 'network-master-ui-state'

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

function formatExamLabel(question: QuestionCard) {
  const date = question.examDate ?? question.examId
  const round = question.round ? `${question.round}회` : TEXT_UNKNOWN_ROUND
  return `${date} / ${round} / ${question.subject}`
}

function formatAttemptText(attempts: number) {
  if (attempts <= 0) {
    return TEXT_NOT_SOLVED
  }
  return `${attempts}번째 풀이`
}

function loadUiToggleState() {
  if (typeof window === 'undefined') {
    return { titleOpen: true, sidebarOpen: true }
  }

  try {
    const raw = window.localStorage.getItem(UI_STATE_STORAGE_KEY)
    if (!raw) {
      return { titleOpen: true, sidebarOpen: true }
    }

    const parsed = JSON.parse(raw) as Partial<{
      titleOpen: boolean
      sidebarOpen: boolean
    }>

    return {
      titleOpen: parsed.titleOpen ?? true,
      sidebarOpen: parsed.sidebarOpen ?? true,
    }
  } catch {
    return { titleOpen: true, sidebarOpen: true }
  }
}

function saveUiToggleState(state: {
  titleOpen: boolean
  sidebarOpen: boolean
}) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(state))
}

export default function App() {
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
  const [titleOpen, setTitleOpen] = useState(
    () => loadUiToggleState().titleOpen,
  )
  const [sidebarOpen, setSidebarOpen] = useState(
    () => loadUiToggleState().sidebarOpen,
  )

  const filteredQuestions = useMemo(() => {
    if (subject === LABEL_ALL) {
      return allQuestions
    }
    return allQuestions.filter((question) => question.subject === subject)
  }, [subject])

  const currentKey = current
    ? getQuestionKey(current.examId, current.number)
    : null
  const currentProgress = currentKey
    ? (progressMap[currentKey] ?? createEmptyProgress())
    : createEmptyProgress()

  const exportText = useMemo(() => exportProgress(progressMap), [progressMap])

  useEffect(() => {
    const next = pickRandomQuestion(filteredQuestions)
    setCurrent(next)
    setSelected(null)
    setRevealed(false)
  }, [filteredQuestions])

  useEffect(() => {
    saveProgress(progressMap)
  }, [progressMap])

  useEffect(() => {
    saveUiToggleState({ titleOpen, sidebarOpen })
  }, [titleOpen, sidebarOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || selected === null || revealed) {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement
      ) {
        return
      }

      event.preventDefault()
      submitAnswer()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, revealed, current])

  const nextQuestion = () => {
    const previousId = current
      ? `${current.examId}-${current.number}`
      : undefined
    const next = pickRandomQuestion(filteredQuestions, previousId)
    setCurrent(next)
    setSelected(null)
    setRevealed(false)
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
      setImportStatus('기록을 불러왔습니다.')
      setImportText('')
    } catch {
      setImportStatus('가져오기 데이터 형식이 올바르지 않습니다.')
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(255,255,255,0.58)_32%,_rgba(239,246,255,0.96)_70%),linear-gradient(135deg,_#dbeafe,_#fef3c7_42%,_#dcfce7)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {titleOpen && (
          <section className="rounded-[2rem] border border-white/70 bg-white/72 p-4 shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur transition-all duration-300 ease-out md:p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
                  네트워크관리사 2급
                  <br />
                  랜덤 한 문제 훈련장
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  회차 구분 없이 섞어 한 문제씩 풉니다. 정답 확인은 즉시
                  가능하고, 과목별로 필터링할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="총 회차" value={`${totalExamCount}`} />
                <StatCard label="총 문항 수" value={`${totalQuestionCount}`} />
                <StatCard label="현재 필터" value={subject} wide />
              </div>

              <button
                type="button"
                aria-expanded={titleOpen}
                onClick={() => setTitleOpen((previous) => !previous)}
                className="self-start rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
              >
                <ChevronIcon open={titleOpen} />
              </button>
            </div>
          </section>
        )}

        {!titleOpen && (
          <button
            type="button"
            aria-expanded={titleOpen}
            onClick={() => setTitleOpen((previous) => !previous)}
            className="flex w-full justify-between rounded-[2rem] border border-white/70 bg-white/72 p-4 text-left text-lg font-bold shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur transition hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 md:p-6 md:text-xl"
          >
            <div>네트워크관리사 2급</div>
            <ChevronIcon open={titleOpen} />
          </button>
        )}

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
                <FiChevronsLeft />
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
                  <FiAlignJustify />
                  <span>과목 필터 열기</span>
                </button>
              </div>
            ) : null}
            {!current ? (
              <EmptyState />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                      {formatExamLabel(current)}
                    </p>
                    <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950 md:text-3xl">
                      {current.number}번 문제
                    </h2>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={nextQuestion}
                      className="cursor-pointer rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      다른 문제
                    </button>

                    <button
                      type="button"
                      onClick={submitAnswer}
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
                  <StatCard
                    label="맞은 횟수"
                    value={`${currentProgress.correctCount}`}
                  />
                  <StatCard
                    label="틀린 횟수"
                    value={`${currentProgress.wrongCount}`}
                  />
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <div className="rounded-[1.5rem] bg-slate-950 px-5 py-6 text-slate-50 md:px-7">
                  <p className="text-lg leading-8 md:text-xl">
                    {current.question}
                  </p>
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
                        <button
                          type="button"
                          onClick={() => setSelected(choiceNumber)}
                          className="w-full rounded-xl text-left outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="block text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                              Choice {choiceNumber}
                            </span>
                            <button
                              type="button"
                              aria-expanded={notesOpen}
                              onClick={() => toggleChoiceNotes(choiceNumber)}
                              className="cursor-pointer rounded-md p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                            >
                              {notesOpen ? '❗' : '❔'}
                            </button>
                          </div>
                          <span className="mt-2 block text-base leading-7">
                            {choice}
                          </span>
                        </button>
                        {notesOpen ? (
                          <textarea
                            value={note}
                            onChange={(event) =>
                              handleChoiceNoteChange(
                                choiceNumber,
                                event.target.value,
                              )
                            }
                            placeholder="이 선택지에 대한 해설, 함정 포인트, 외울 내용을 저장하세요."
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
                      정답은 {current.answer}번, {current.answerText}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-600">
                    선택지를 고른 뒤 정답 확인 버튼을 클릭하거나 엔터 키를
                    누르면 채점 결과가 표시됩니다.
                  </div>
                )}
              </div>
            )}
          </section>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:p-7">
          <button
            type="button"
            onClick={() => setDataToolsOpen((previous) => !previous)}
            className="flex w-full items-center justify-between rounded-[1.3rem] border border-slate-200 bg-white/70 px-5 py-4 text-left transition hover:border-slate-300 hover:bg-white"
          >
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                기록 도구
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                풀이 기록을 내보내거나 가져올 수 있습니다.
              </p>
            </div>
            <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
              <span>{dataToolsOpen ? '기록 도구 접기' : '기록 도구 열기'}</span>
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
                      아래 JSON을 복사해 다른 브라우저에서 가져오기로 붙여넣으면
                      됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyExport}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                  >
                    <CopyIcon />
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
                  다른 PC에서 내보낸 JSON 문자열을 붙여넣으면 기존 기록과
                  병합합니다.
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
                    붙여넣은 기록 반영
                  </button>
                  {importStatus ? (
                    <p className="text-sm text-slate-600">{importStatus}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function formatLastResult(progress: ReturnType<typeof createEmptyProgress>) {
  if (
    !progress.attempts ||
    progress.lastSelectedChoice === null ||
    progress.lastWasCorrect === null
  ) {
    return TEXT_NOT_SOLVED
  }
  const outcome = progress.lastWasCorrect ? TEXT_CORRECT : TEXT_WRONG
  return `${progress.lastSelectedChoice}번 / ${outcome}`
}

function StatCard({
  label,
  value,
  wide = false,
}: {
  label: string
  value: string
  wide?: boolean
}) {
  return (
    <div
      className={`rounded-[1.4rem] border border-white/70 bg-slate-950 px-4 py-4 text-white shadow-[0_20px_50px_-30px_rgba(15,23,42,0.6)] ${
        wide ? 'col-span-2 sm:col-span-1' : ''
      }`}
    >
      <p className="text-[9px] font-semibold tracking-[0.26em] text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-2 text-lg font-black tracking-[-0.04em]">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[480px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="max-w-md">
        <p className="text-lg font-semibold text-slate-900">
          문제를 찾지 못했습니다.
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          현재 필터에 해당하는 문제가 없습니다. 다른 과목을 선택해 주세요.
        </p>
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

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="7" y="5" width="9" height="11" rx="2" />
      <path
        d="M5 12H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1"
        strokeLinecap="round"
      />
    </svg>
  )
}
