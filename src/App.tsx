import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  FiBookOpen,
  FiExternalLink,
  FiFileText,
  FiGithub,
} from 'react-icons/fi'
import { allQuestions, examSummaries, questionsByExamId, subjects } from './data'
import {
  AppNotification,
  ConfirmModal,
  DataToolsPanel,
  HeaderSection,
  NotesStudyPanel,
  QuizFilterButton,
  QuizPanel,
  SidebarPanel,
  ViewToggleButton,
} from './app/components'
import { useKeyboardShortcuts } from './app/hooks/useKeyboardShortcuts'
import { useProgressData } from './app/hooks/useProgressData'
import { useQuizSession } from './app/hooks/useQuizSession'
import type { AppView, NoteStudyItem, QuizFilter, QuizMode } from './app/types'
import {
  formatExamOnlyLabel,
  LABEL_ALL,
  loadUiState,
  saveUiState,
} from './app/utils'
import { getQuestionKey } from './storage'
import type { ChoiceNumber } from './types'

const defaultExamId = examSummaries[0]?.examId ?? null

export default function App() {
  const initialUiState = loadUiState()
  const {
    copied,
    exportText,
    handleCopyExport,
    handleImport,
    handleReset,
    importStatus,
    importText,
    progressMap,
    setImportStatus,
    setImportText,
    setProgressMap,
  } = useProgressData()
  const [subject, setSubject] = useState(LABEL_ALL)
  const [dataToolsOpen, setDataToolsOpen] = useState(false)
  const [noteQuery, setNoteQuery] = useState('')
  const [noteSearchOpen, setNoteSearchOpen] = useState(false)
  const [titleOpen] = useState(initialUiState.titleOpen)
  const [sidebarOpen, setSidebarOpen] = useState(initialUiState.sidebarOpen)
  const [view, setView] = useState<AppView>(initialUiState.view)
  const [quizFilter, setQuizFilter] = useState<QuizFilter>(
    initialUiState.quizFilter,
  )
  const [quizMode, setQuizMode] = useState<QuizMode>(initialUiState.quizMode)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(
    initialUiState.selectedExamId ?? defaultExamId,
  )
  const [prioritizeUnsolved, setPrioritizeUnsolved] = useState(
    initialUiState.prioritizeUnsolved,
  )
  const [progressOpen, setProgressOpen] = useState(initialUiState.progressOpen)
  const [nextConfirmOpen, setNextConfirmOpen] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const deferredNoteQuery = useDeferredValue(noteQuery)
  const filterLockByUnsolved = prioritizeUnsolved
  const selectedExamSummary =
    examSummaries.find((exam) => exam.examId === selectedExamId) ?? null
  const selectedExamQuestions = selectedExamId
    ? questionsByExamId[selectedExamId] ?? []
    : []

  const {
    current,
    currentProgress,
    examReadyForResult,
    examResultOpen,
    examResultSummary,
    eligibleQuestions,
    examSession,
    handleChoiceNoteChange,
    nextQuestion,
    openExamResult,
    openNotes,
    progressPercent,
    questionCounts,
    revealed,
    restartExam,
    selected,
    setSelected,
    solvedQuestionCount,
    subjectQuestions,
    submitAnswer,
    toggleChoiceNotes,
  } = useQuizSession({
    allQuestions,
    examQuestions: selectedExamQuestions,
    prioritizeUnsolved,
    progressMap,
    quizFilter,
    quizMode,
    setProgressMap,
    subject,
  })

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
      const examRoundLabel = item.question.round
        ? `${item.question.round}회`
        : '회차 미상'
      const matchedQuestion =
        item.question.question.toLowerCase().includes(query) ||
        item.question.subject.toLowerCase().includes(query) ||
        `${item.question.examDate ?? item.question.examId} / ${examRoundLabel} / ${
          item.question.subject
        }`
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

  useEffect(() => {
    if (prioritizeUnsolved && quizFilter !== 'all') {
      setQuizFilter('all')
    }
  }, [prioritizeUnsolved, quizFilter])

  useEffect(() => {
    if (quizMode === 'exam') {
      setQuizFilter('all')
      setPrioritizeUnsolved(false)
    }
  }, [quizMode])

  useEffect(() => {
    const examExists = selectedExamId
      ? examSummaries.some((exam) => exam.examId === selectedExamId)
      : false

    if ((!selectedExamId || !examExists) && defaultExamId) {
      setSelectedExamId(defaultExamId)
    }
  }, [selectedExamId])

  useEffect(() => {
    saveUiState({
      titleOpen,
      sidebarOpen,
      view,
      quizFilter,
      quizMode,
      selectedExamId,
      prioritizeUnsolved,
      progressOpen,
    })
  }, [
    titleOpen,
    sidebarOpen,
    view,
    quizFilter,
    quizMode,
    selectedExamId,
    prioritizeUnsolved,
    progressOpen,
  ])

  const confirmNextQuestion = () => {
    setNextConfirmOpen(false)
    nextQuestion()
  }

  const confirmReset = () => {
    setResetConfirmOpen(false)
    handleReset()
  }

  const confirmImport = () => {
    setImportConfirmOpen(false)
    handleImport()
  }

  useKeyboardShortcuts({
    examReadyForResult,
    nextConfirmOpen,
    resetConfirmOpen,
    revealed,
    selected,
    onConfirmNextQuestion: confirmNextQuestion,
    onCloseNextConfirm: () => setNextConfirmOpen(false),
    onOpenExamResult: openExamResult,
    onOpenNextConfirm: () => setNextConfirmOpen(true),
    onConfirmReset: confirmReset,
    onCloseResetConfirm: () => setResetConfirmOpen(false),
    onSubmitAnswer: submitAnswer,
  })

  const renderQuizSidebar = () => {
    if (quizMode === 'exam') {
      return (
        <div className="mt-6 grid gap-4">
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Quiz Mode
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => setQuizMode('random')}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
              >
                랜덤 문제
              </button>
              <button
                type="button"
                onClick={() => setQuizMode('exam')}
                className="rounded-2xl border border-sky-500 bg-sky-600 px-4 py-3 text-left text-sm font-medium text-white shadow-lg shadow-sky-300/40"
              >
                회차 모의고사
              </button>
            </div>
          </div>

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
                onChange={(event) => setSelectedExamId(event.target.value)}
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
        <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Quiz Mode
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => setQuizMode('random')}
              className="rounded-2xl border border-sky-500 bg-sky-600 px-4 py-3 text-left text-sm font-medium text-white shadow-lg shadow-sky-300/40"
            >
              랜덤 문제
            </button>
            <button
              type="button"
              onClick={() => setQuizMode('exam')}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
            >
              회차 모의고사
            </button>
          </div>
        </div>

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
                  미풀이 우선 출제
                </p>
                <p className="mt-1 text-xs leading-6 text-slate-500">
                  아직 한 번도 풀지 않은 문제가 있으면 먼저 보여줍니다.
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
                  현재 과목 기준으로 얼마나 풀었는지 확인합니다.
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
                풀이한 문제 {solvedQuestionCount} / {subjectQuestions.length}
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
              onClick={() => setQuizFilter('all')}
              tone="slate"
            />
            <QuizFilterButton
              active={quizFilter === 'wrong'}
              count={questionCounts.wrong}
              disabled={filterLockByUnsolved}
              label="오답 문제"
              onClick={() => setQuizFilter('wrong')}
              tone="rose"
            />
            <QuizFilterButton
              active={quizFilter === 'noted'}
              count={questionCounts.noted}
              disabled={filterLockByUnsolved}
              label="메모 문제"
              onClick={() => setQuizFilter('noted')}
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),rgba(255,255,255,0.62)_32%,rgba(239,246,255,0.96)_70%),linear-gradient(135deg,#dbeafe,#fef3c7_42%,#dcfce7)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeaderSection />
        <section className="rounded-[1.75rem] border border-white/70 bg-white/72 p-3 shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="grid gap-2 md:grid-cols-2">
            <ViewToggleButton
              active={view === 'quiz'}
              description="랜덤 문제 풀이와 회차별 50문항 모의고사를 모두 지원합니다."
              icon={<FiFileText />}
              onClick={() => setView('quiz')}
              title="문제 풀이"
            />
            <ViewToggleButton
              active={view === 'notes'}
              description="선택지 메모를 모아서 다시 보고, 메모가 있는 문제만 학습할 수 있습니다."
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
          <SidebarPanel
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpen={() => setSidebarOpen(true)}
            onSelectSubject={setSubject}
            selectedSubject={subject}
            subjects={subjects}
            subjectsDisabled={view === 'quiz' && quizMode === 'exam'}
          >
            {view === 'quiz' ? (
              renderQuizSidebar()
            ) : (
              <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                  Notes
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  메모를 남긴 선택지를 다시 모아 보고, 필요한 문제만 빠르게 복습할
                  수 있습니다.
                </p>
                <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  메모가 있는 문제 {subjectFilteredNotes.length}개
                </div>
              </div>
            )}
          </SidebarPanel>

          <section className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:p-7">
            {view === 'quiz' ? (
              <QuizPanel
                current={current}
                currentProgress={currentProgress}
                examReadyForResult={examReadyForResult}
                examResultOpen={examResultOpen}
                examResultSummary={examResultSummary}
                eligibleCount={eligibleQuestions.length}
                examSession={examSession}
                onChoiceNoteChange={handleChoiceNoteChange}
                onNextQuestion={nextQuestion}
                onOpenExamResult={openExamResult}
                onRestartExam={restartExam}
                onSelect={setSelected}
                onSubmit={submitAnswer}
                onSwitchToRandomMode={() => {
                  setQuizMode('random')
                  setQuizFilter('all')
                }}
                onToggleChoiceNotes={toggleChoiceNotes}
                openNotes={openNotes}
                quizFilter={quizFilter}
                quizMode={quizMode}
                revealed={revealed}
                selected={selected}
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
                  setQuizMode('random')
                  setQuizFilter('noted')
                }}
              />
            )}
          </section>
        </section>

        <DataToolsPanel
          copied={copied}
          dataToolsOpen={dataToolsOpen}
          exportText={exportText}
          importText={importText}
          onCopyExport={handleCopyExport}
          onImport={() => setImportConfirmOpen(true)}
          onImportTextChange={setImportText}
          onResetRequest={() => setResetConfirmOpen(true)}
          onToggle={() => setDataToolsOpen((previous) => !previous)}
        />

        <footer className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 px-6 py-5 text-slate-900 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:px-7">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
                Project
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                Network Master
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                네트워크관리사 2급 기출문제를 랜덤 학습과 회차별 모의고사 방식으로
                풀어볼 수 있는 학습 앱입니다.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <p>Author: hahbr88</p>
                <p>Version 0.1.0</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
                Source
              </p>
              <div className="mt-3 grid gap-3 text-sm text-slate-600">
                <p>문제 원문은 공식 시험 자료를 기반으로 정리되어 있습니다.</p>
                <p className="leading-7">
                  시험 관련 정보는{' '}
                  <a
                    href="https://www.icqa.or.kr/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-sky-700"
                  >
                    한국정보통신자격협회(icqa.or.kr)
                  </a>
                  에서 확인할 수 있습니다.
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
                Links
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
                <p>React 19, Vite, Tailwind CSS 4 기반으로 구성되어 있습니다.</p>
                <p>문의: hahbr88@gmail.com</p>
              </div>
            </div>
          </div>
        </footer>

        <ConfirmModal
          isOpen={nextConfirmOpen}
          eyebrow="Next Question"
          title="다음 문제로 이동할까요?"
          description="현재 문항을 확인한 뒤 다음 문제로 넘어갑니다."
          confirmLabel="이동"
          cancelLabel="취소"
          onConfirm={confirmNextQuestion}
          onCancel={() => setNextConfirmOpen(false)}
        />

        <ConfirmModal
          isOpen={importConfirmOpen}
          eyebrow="Import Progress"
          title="불러온 풀이 기록을 현재 데이터에 합칠까요?"
          description="가져온 풀이 기록은 현재 기록과 병합됩니다."
          confirmLabel="가져오기"
          cancelLabel="취소"
          onConfirm={confirmImport}
          onCancel={() => setImportConfirmOpen(false)}
        />

        <ConfirmModal
          isOpen={resetConfirmOpen}
          eyebrow="Reset Progress"
          title="풀이 기록을 모두 초기화할까요?"
          description="이 작업은 브라우저에 저장된 현재 학습 기록을 지웁니다."
          confirmLabel="초기화"
          cancelLabel="취소"
          confirmTone="red"
          onConfirm={confirmReset}
          onCancel={() => setResetConfirmOpen(false)}
        />

        <AppNotification
          isOpen={!!importStatus}
          message={importStatus ?? ''}
          tone={importStatus?.includes('JSON') ? 'error' : 'success'}
          onClose={() => setImportStatus(null)}
        />
      </div>
    </main>
  )
}
