import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  FiAlignJustify,
  FiBookOpen,
  FiChevronsLeft,
  FiClipboard,
  FiExternalLink,
  FiFileText,
  FiGithub,
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
  const [prioritizeUnsolved, setPrioritizeUnsolved] = useState(
    initialUiState.prioritizeUnsolved,
  )
  const [progressOpen, setProgressOpen] = useState(initialUiState.progressOpen)
  const [nextConfirmOpen, setNextConfirmOpen] = useState(false)
  const deferredNoteQuery = useDeferredValue(noteQuery)
  const filterLockByUnsolved = prioritizeUnsolved

  const subjectQuestions = useMemo(() => {
    return subject === LABEL_ALL
      ? allQuestions
      : allQuestions.filter((question) => question.subject === subject)
  }, [subject])

  const eligibleQuestions = useMemo(() => {
    if (quizFilter === 'all') {
      return subjectQuestions
    }

    return subjectQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      const progress = progressMap[key]

      if (quizFilter === 'wrong') {
        return (progress?.wrongCount ?? 0) > 0
      }

      return Object.keys(progress?.choiceNotes ?? {}).length > 0
    })
  }, [progressMap, quizFilter, subjectQuestions])

  const questionCounts = useMemo(() => {
    const wrong = subjectQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return (progressMap[key]?.wrongCount ?? 0) > 0
    }).length

    const noted = subjectQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return Object.keys(progressMap[key]?.choiceNotes ?? {}).length > 0
    }).length

    return {
      all: subjectQuestions.length,
      wrong,
      noted,
    }
  }, [progressMap, subjectQuestions])

  const solvedQuestionCount = useMemo(() => {
    return subjectQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return (progressMap[key]?.attempts ?? 0) > 0
    }).length
  }, [progressMap, subjectQuestions])

  const unsolvedEligibleQuestions = useMemo(() => {
    return eligibleQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return (progressMap[key]?.attempts ?? 0) === 0
    })
  }, [eligibleQuestions, progressMap])

  const progressPercent = useMemo(() => {
    if (subjectQuestions.length === 0) {
      return 0
    }

    return Math.round((solvedQuestionCount / subjectQuestions.length) * 100)
  }, [solvedQuestionCount, subjectQuestions.length])

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

  const selectNextQuestion = (previousId?: string) => {
    const pool =
      prioritizeUnsolved && unsolvedEligibleQuestions.length > 0
        ? unsolvedEligibleQuestions
        : eligibleQuestions

    return pickRandomQuestion(pool, previousId)
  }

  useEffect(() => {
    if (prioritizeUnsolved && quizFilter !== 'all') {
      setQuizFilter('all')
    }
  }, [prioritizeUnsolved, quizFilter])

  useEffect(() => {
    const currentStillEligible =
      current &&
      eligibleQuestions.some(
        (question) => getQuestionId(question) === getQuestionId(current),
      )

    if (currentStillEligible) {
      return
    }

    const next = selectNextQuestion()
    setCurrent(next)
    setSelected(null)
    setRevealed(false)
  }, [current, eligibleQuestions, prioritizeUnsolved, unsolvedEligibleQuestions])

  useEffect(() => {
    saveProgress(progressMap)
  }, [progressMap])

  useEffect(() => {
    saveUiState({
      titleOpen,
      sidebarOpen,
      view,
      quizFilter,
      prioritizeUnsolved,
      progressOpen,
    })
  }, [
    titleOpen,
    sidebarOpen,
    view,
    quizFilter,
    prioritizeUnsolved,
    progressOpen,
  ])

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
    const next = selectNextQuestion(previousId)
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
                <>
                  <div className="mt-6 grid gap-4">
                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                          학습 옵션
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          다음 문제 선택 방식과 진행률 표시 여부를 조정할 수 있습니다.
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={prioritizeUnsolved}
                          onClick={() => {
                            setPrioritizeUnsolved((previous) => {
                              const next = !previous
                              if (next) {
                                setQuizFilter('all')
                              }
                              return next
                            })
                          }}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              미풀이 우선
                            </p>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                              아직 풀지 않은 문제가 있으면 먼저 보여줍니다.
                            </p>
                          </div>
                          <span
                            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                              prioritizeUnsolved ? 'bg-sky-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                prioritizeUnsolved ? 'left-6' : 'left-1'
                              }`}
                            />
                          </span>
                        </button>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={progressOpen}
                          onClick={() => setProgressOpen((previous) => !previous)}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">
                              진행률 보기
                            </p>
                            <p className="mt-1 text-xs leading-6 text-slate-500">
                              현재 과목 기준 풀이 진행률 바를 표시합니다.
                            </p>
                          </div>
                          <span
                            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                              progressOpen ? 'bg-sky-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                progressOpen ? 'left-6' : 'left-1'
                              }`}
                            />
                          </span>
                        </button>
                      </div>
                    </div>

                    {progressOpen ? (
                      <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                              진행률
                            </p>
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              현재 선택한 과목 기준으로 한 번 이상 풀어본 문제의 비율입니다.
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
                            풀이한 문제 {solvedQuestionCount} / {subjectQuestions.length}
                          </p>
                          <p>남은 미풀이 {questionCounts.all - solvedQuestionCount}</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                          문제 범위
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          전체 문제, 틀린 문제, 메모 있는 문제만 따로 골라서 다시 풀 수 있습니다.
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
                          disabled={filterLockByUnsolved}
                          label="틀린 문제만"
                          onClick={() => setQuizFilter('wrong')}
                          tone="rose"
                        />
                        <QuizFilterButton
                          active={quizFilter === 'noted'}
                          count={questionCounts.noted}
                          disabled={filterLockByUnsolved}
                          label="메모 있는 문제만"
                          onClick={() => setQuizFilter('noted')}
                          tone="amber"
                        />
                      </div>
                      {filterLockByUnsolved ? (
                        <p className="mt-3 text-xs leading-6 text-slate-500">
                          미풀이 우선 모드에서는 전체 문제 필터만 사용할 수
                          있습니다.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {false ? (
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
                  ) : null}
                </>
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

        <footer className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 px-6 py-5 text-slate-900 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:px-7">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
                프로젝트 정보
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                Network Master
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                네트워크관리사 2급 학습용 문제 풀이와 오답 노트 정리를 위해 만든
                개인 프로젝트입니다.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <p>제작: 하병노</p>
                <p>Version 0.1.0</p>
                <p>Email: hahbr88@gmail.com</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
                링크
              </p>
              <div className="mt-3 grid gap-3 text-sm text-slate-600">
              <a
                href="https://github.com/hahbr88/network_master?tab=readme-ov-file#network_master"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-slate-900 transition hover:text-sky-700"
              >
                <FiGithub className="h-4 w-4" />
                <span>GitHub README</span>
                <FiExternalLink className="h-4 w-4" />
              </a>
                <p>Progress data is stored in your browser local storage.</p>
                <p>Built with React 19, Vite, Tailwind CSS 4.</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
                면책
              </p>
              <div className="mt-3 grid gap-3 text-sm text-slate-600">
                <p>개인 학습용 프로젝트이며, 비상업적 용도로 운영합니다.</p>
                <p className="leading-7">
                네트워크관리사 자격은{' '}
                <a
                  href="https://www.icqa.or.kr/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-sky-700"
                >
                  한국정보통신자격협회(icqa.or.kr)
                </a>
                에서 시행하는 국가공인자격이며, 자격검정 기출문제 저작권은
                한국정보통신자격협회에 있습니다.
                </p>
              </div>
            </div>
          </div>
        </footer>

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
