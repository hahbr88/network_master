import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  FiAlignJustify,
  FiBookOpen,
  FiChevronsLeft,
  FiClipboard,
  FiFileText,
} from 'react-icons/fi'
import { allQuestions, subjects } from './data'
import {
  HeaderSection,
  NotesStudyPanel,
  QuizFilterButton,
  QuizPanel,
  ViewToggleButton,
} from './app/components'
import type { AppView, NoteStudyItem, QuizFilter } from './app/types'
import {
  getQuestionId,
  LABEL_ALL,
  loadUiState,
  pickRandomQuestion,
  saveUiState,
} from './app/utils'
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
  const [noteQuery, setNoteQuery] = useState('')
  const [noteSearchOpen, setNoteSearchOpen] = useState(false)
  const [titleOpen, setTitleOpen] = useState(initialUiState.titleOpen)
  const [sidebarOpen, setSidebarOpen] = useState(initialUiState.sidebarOpen)
  const [view, setView] = useState<AppView>(initialUiState.view)
  const [quizFilter, setQuizFilter] = useState<QuizFilter>(
    initialUiState.quizFilter,
  )
  const [nextConfirmOpen, setNextConfirmOpen] = useState(false)
  const deferredNoteQuery = useDeferredValue(noteQuery)

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

  const searchedNotes = useMemo(() => {
    const query = deferredNoteQuery.trim().toLowerCase()

    if (!query) {
      return subjectFilteredNotes
    }

    return subjectFilteredNotes.filter((item) => {
      const matchedQuestion =
        item.question.question.toLowerCase().includes(query) ||
        item.question.subject.toLowerCase().includes(query) ||
        `${item.question.examDate ?? item.question.examId} / ${
          item.question.round ? `${item.question.round}회` : '회차 미상'
        } / ${item.question.subject}`
          .toLowerCase()
          .includes(query)

      if (matchedQuestion) {
        return true
      }

      return item.notes.some((noteItem) => {
        return (
          noteItem.choiceText.toLowerCase().includes(query) ||
          noteItem.note.toLowerCase().includes(query)
        )
      })
    })
  }, [deferredNoteQuery, subjectFilteredNotes])

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
                noteSearchOpen={noteSearchOpen}
                noteQuery={noteQuery}
                notes={searchedNotes}
                onNoteSearchToggle={() =>
                  setNoteSearchOpen((previous) => !previous)
                }
                onNoteQueryChange={setNoteQuery}
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
              <span
                className={`h-4 w-4 transition ${
                  dataToolsOpen ? 'rotate-180' : ''
                }`}
              >
                <svg
                  viewBox="0 0 20 20"
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
              </span>
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
