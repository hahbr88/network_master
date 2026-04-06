import { useEffect, useState } from 'react'
import { FiBarChart2, FiBookOpen, FiFileText } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import {
  allQuestions,
  examSummaries,
  questionsByExamId,
  subjects,
} from './data'
import {
  ConfirmModal,
  FooterSection,
  HeaderSection,
  NotesSidebarSummary,
  NotesStudyPanel,
  QuizPanel,
  QuizSidebarContent,
  SidebarPanel,
  ViewToggleButton,
} from './app/components'
import { useAppUiState } from './app/hooks/useAppUiState'
import { useKeyboardShortcuts } from './app/hooks/useKeyboardShortcuts'
import { useProgressData } from './app/hooks/useProgressData'
import { useQuizSession } from './app/hooks/useQuizSession'
import { useStudyNotes } from './app/hooks/useStudyNotes'
import type { QuizMode } from './app/types'
import { formatExamOnlyLabel, LABEL_ALL } from './app/utils'
import { loadExamHistory } from './storage'

const defaultExamId = examSummaries[0]?.examId ?? null

export default function App() {
  const navigate = useNavigate()
  const { dataRevision, progressMap, setProgressMap } = useProgressData()

  const [subject, setSubject] = useState(LABEL_ALL)
  const [noteQuery, setNoteQuery] = useState('')
  const [noteSearchOpen, setNoteSearchOpen] = useState(false)
  const [pendingExamId, setPendingExamId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<
    'change-exam' | 'restart-exam' | 'next' | null
  >(null)

  const {
    prioritizeUnsolved,
    progressOpen,
    quizFilter,
    quizMode,
    reviewQuestionKeys,
    selectedExamId,
    setPrioritizeUnsolved,
    setProgressOpen,
    setQuizFilter,
    setQuizMode,
    setReviewQuestionKeys,
    setSelectedExamId,
    setSidebarOpen,
    setView,
    sidebarOpen,
    view,
  } = useAppUiState(defaultExamId)

  const selectedExamSummary =
    examSummaries.find((exam) => exam.examId === selectedExamId) ?? null
  const selectedExamQuestions = selectedExamId
    ? (questionsByExamId[selectedExamId] ?? [])
    : []

  const { searchedNotes, subjectFilteredNotes } = useStudyNotes({
    allQuestions,
    noteQuery,
    progressMap,
    subject,
  })

  const {
    activeExamId,
    current,
    currentProgress,
    examReadyForResult,
    examResultOpen,
    examResultSummary,
    eligibleQuestions,
    examSession,
    hasActiveExamSession,
    handleChoiceNoteChange,
    nextQuestion,
    openExamResult,
    openNotes,
    progressPercent,
    questionCounts,
    reviewModeActive,
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
    reviewQuestionKeys,
    sessionSyncKey: dataRevision,
    setProgressMap,
    subject,
  })

  useEffect(() => {
    if (prioritizeUnsolved && quizFilter !== 'all') {
      setQuizFilter('all')
    }
  }, [prioritizeUnsolved, quizFilter, setQuizFilter])

  useEffect(() => {
    if (quizMode === 'exam') {
      setQuizFilter('all')
      setPrioritizeUnsolved(false)
      setReviewQuestionKeys(null)
    }
  }, [quizMode, setPrioritizeUnsolved, setQuizFilter, setReviewQuestionKeys])

  useEffect(() => {
    const examExists = selectedExamId
      ? examSummaries.some((exam) => exam.examId === selectedExamId)
      : false

    if ((!selectedExamId || !examExists) && defaultExamId) {
      setSelectedExamId(defaultExamId)
    }
  }, [selectedExamId, setSelectedExamId])

  const confirmNextQuestion = () => {
    setActiveModal(null)
    nextQuestion()
  }

  const handleQuizModeChange = (mode: QuizMode) => {
    setQuizMode(mode)
  }

  const hasExamHistory = (examId: string) => {
    return loadExamHistory().some((entry) => entry.examId === examId)
  }

  const openRestartExamConfirm = (examId: string) => {
    setPendingExamId(examId)
    setActiveModal('restart-exam')
  }

  const applyExamSelection = (examId: string) => {
    if (examId !== selectedExamId && hasExamHistory(examId)) {
      openRestartExamConfirm(examId)
      return false
    }

    setSelectedExamId(examId)
    return true
  }

  const requestExamChange = (examId: string) => {
    if (
      quizMode === 'exam' &&
      hasActiveExamSession &&
      activeExamId &&
      examId !== activeExamId
    ) {
      setPendingExamId(examId)
      setActiveModal('change-exam')
      return
    }

    applyExamSelection(examId)
  }

  const handlePrioritizeUnsolvedToggle = () => {
    setPrioritizeUnsolved((previous) => {
      const next = !previous

      if (next) {
        setQuizFilter('all')
        setReviewQuestionKeys(null)
      }

      return next
    })
  }

  const clearReviewMode = () => {
    setReviewQuestionKeys(null)
  }

  const confirmExamChange = () => {
    if (!pendingExamId) {
      setActiveModal(null)
      return
    }

    const selected = applyExamSelection(pendingExamId)
    if (selected) {
      setPendingExamId(null)
      setActiveModal(null)
    }
  }

  const cancelExamChange = () => {
    setPendingExamId(null)
    setActiveModal(null)
  }

  const confirmExamRestart = () => {
    if (pendingExamId) {
      setSelectedExamId(pendingExamId)
    }

    setPendingExamId(null)
    setActiveModal(null)
  }

  const cancelExamRestart = () => {
    setPendingExamId(null)
    setActiveModal(null)
  }

  const pendingExamSummary =
    examSummaries.find((exam) => exam.examId === pendingExamId) ?? null

  useKeyboardShortcuts({
    examReadyForResult,
    nextConfirmOpen: activeModal === 'next',
    resetConfirmOpen: false,
    revealed,
    selected,
    onConfirmNextQuestion: confirmNextQuestion,
    onCloseNextConfirm: () => setActiveModal(null),
    onOpenExamResult: openExamResult,
    onOpenNextConfirm: () => setActiveModal('next'),
    onConfirmReset: () => undefined,
    onCloseResetConfirm: () => undefined,
    onSubmitAnswer: submitAnswer,
  })

  const switchToRandomMode = () => {
    setReviewQuestionKeys(null)
    setQuizMode('random')
    setQuizFilter('all')
  }

  const studyNotedQuestions = () => {
    setReviewQuestionKeys(null)
    setView('quiz')
    setQuizMode('random')
    setQuizFilter('noted')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),rgba(255,255,255,0.62)_32%,rgba(239,246,255,0.96)_70%),linear-gradient(135deg,#dbeafe,#fef3c7_42%,#dcfce7)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeaderSection />

        <section className="rounded-[1.75rem] border border-white/70 bg-white/72 p-3 shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="grid gap-2 md:grid-cols-3">
            <ViewToggleButton
              active={view === 'quiz'}
              description="랜덤 문제와 회차별 모의고사로 문제를 풀 수 있습니다."
              icon={<FiFileText />}
              onClick={() => setView('quiz')}
              title="문제 풀이"
            />
            <ViewToggleButton
              active={view === 'notes'}
              description="선택지 메모를 모아서 읽고 다시 학습할 수 있습니다."
              icon={<FiBookOpen />}
              onClick={() => setView('notes')}
              title="해설 노트"
            />
            <ViewToggleButton
              active={false}
              description="학습 통계, 이어풀기 상태, 모의고사 이력을 확인합니다."
              icon={<FiBarChart2 />}
              onClick={() => navigate('/studylog')}
              title="학습 기록"
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
              <QuizSidebarContent
                examSession={examSession}
                examSummaries={examSummaries}
                onClearReviewMode={clearReviewMode}
                onPrioritizeUnsolvedToggle={handlePrioritizeUnsolvedToggle}
                onProgressToggle={() =>
                  setProgressOpen((previous) => !previous)
                }
                onQuizFilterChange={setQuizFilter}
                onQuizModeChange={handleQuizModeChange}
                onSelectedExamChange={requestExamChange}
                prioritizeUnsolved={prioritizeUnsolved}
                progressOpen={progressOpen}
                progressPercent={progressPercent}
                questionCounts={questionCounts}
                quizFilter={quizFilter}
                quizMode={quizMode}
                reviewModeActive={reviewModeActive}
                reviewQuestionCount={reviewQuestionKeys?.length ?? 0}
                selectedExamId={selectedExamId}
                selectedExamSummary={selectedExamSummary}
                solvedQuestionCount={solvedQuestionCount}
                subjectQuestionCount={subjectQuestions.length}
              />
            ) : (
              <NotesSidebarSummary noteCount={subjectFilteredNotes.length} />
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
                onSwitchToRandomMode={switchToRandomMode}
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
                onStudyNotedQuestions={studyNotedQuestions}
              />
            )}
          </section>
        </section>

        <FooterSection />

        <ConfirmModal
          isOpen={activeModal === 'change-exam'}
          eyebrow="Change Exam"
          title="진행 중인 모의고사를 다른 회차로 바꿀까요?"
          description="회차를 바꾸면 현재 문제 화면이 새 회차 기준으로 전환됩니다."
          confirmLabel="변경"
          cancelLabel="취소"
          onConfirm={confirmExamChange}
          onCancel={cancelExamChange}
        />

        <ConfirmModal
          isOpen={activeModal === 'restart-exam'}
          eyebrow="Restart Exam"
          title="이전에 응시했던 회차입니다. 재응시 하시겠습니까?"
          description={
            pendingExamSummary
              ? `${formatExamOnlyLabel(pendingExamSummary)} 회차를 다시 시작합니다.`
              : '이전에 응시했던 회차를 다시 시작합니다.'
          }
          confirmLabel="재응시"
          cancelLabel="취소"
          onConfirm={confirmExamRestart}
          onCancel={cancelExamRestart}
        />

        <ConfirmModal
          isOpen={activeModal === 'next'}
          eyebrow="Next Question"
          title="다음 문제로 이동할까요?"
          description="현재 화면을 닫고 다음 문제로 넘어갑니다."
          confirmLabel="이동"
          cancelLabel="취소"
          onConfirm={confirmNextQuestion}
          onCancel={() => setActiveModal(null)}
        />
      </div>
    </main>
  )
}
