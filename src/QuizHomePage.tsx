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
  AppNotification,
  ConfirmModal,
  DataToolsPanel,
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
import { LABEL_ALL } from './app/utils'

const defaultExamId = examSummaries[0]?.examId ?? null

export default function App() {
  const navigate = useNavigate()
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
  const [pendingExamId, setPendingExamId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<
    'change-exam' | 'next' | 'import' | 'reset' | null
  >(null)

  const {
    prioritizeUnsolved,
    progressOpen,
    quizFilter,
    quizMode,
    selectedExamId,
    setPrioritizeUnsolved,
    setProgressOpen,
    setQuizFilter,
    setQuizMode,
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

  useEffect(() => {
    if (prioritizeUnsolved && quizFilter !== 'all') {
      setQuizFilter('all')
    }
  }, [prioritizeUnsolved, quizFilter, setQuizFilter])

  useEffect(() => {
    if (quizMode === 'exam') {
      setQuizFilter('all')
      setPrioritizeUnsolved(false)
    }
  }, [quizMode, setPrioritizeUnsolved, setQuizFilter])

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

  const confirmReset = () => {
    setActiveModal(null)
    handleReset()
  }

  const confirmImport = () => {
    setActiveModal(null)
    handleImport()
  }

  const handleQuizModeChange = (mode: QuizMode) => {
    setQuizMode(mode)
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

    setSelectedExamId(examId)
  }

  const handlePrioritizeUnsolvedToggle = () => {
    setPrioritizeUnsolved((previous) => {
      const next = !previous

      if (next) {
        setQuizFilter('all')
      }

      return next
    })
  }

  const confirmExamChange = () => {
    if (pendingExamId) {
      setSelectedExamId(pendingExamId)
    }
    setPendingExamId(null)
    setActiveModal(null)
  }

  const cancelExamChange = () => {
    setPendingExamId(null)
    setActiveModal(null)
  }

  useKeyboardShortcuts({
    examReadyForResult,
    nextConfirmOpen: activeModal === 'next',
    resetConfirmOpen: activeModal === 'reset',
    revealed,
    selected,
    onConfirmNextQuestion: confirmNextQuestion,
    onCloseNextConfirm: () => setActiveModal(null),
    onOpenExamResult: openExamResult,
    onOpenNextConfirm: () => setActiveModal('next'),
    onConfirmReset: confirmReset,
    onCloseResetConfirm: () => setActiveModal(null),
    onSubmitAnswer: submitAnswer,
  })

  const switchToRandomMode = () => {
    setQuizMode('random')
    setQuizFilter('all')
  }

  const studyNotedQuestions = () => {
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
            <ViewToggleButton
              active={false}
              description="지금까지 푼 모의고사와 전체 학습 결과를 확인합니다."
              icon={<FiBarChart2 />}
              onClick={() => navigate('/studylog')}
              title="학습 로그"
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

        <DataToolsPanel
          copied={copied}
          dataToolsOpen={dataToolsOpen}
          exportText={exportText}
          importText={importText}
          onCopyExport={handleCopyExport}
          onImport={() => setActiveModal('import')}
          onImportTextChange={setImportText}
          onResetRequest={() => setActiveModal('reset')}
          onToggle={() => setDataToolsOpen((previous) => !previous)}
        />

        <FooterSection />

        <ConfirmModal
          isOpen={activeModal === 'change-exam'}
          eyebrow="Change Exam"
          title="진행 중인 시험을 다른 회차로 바꾸시겠습니까?"
          description="변경 버튼 클릭시 새로 선택한 회차로 이동하며 기존 진행 상황은 삭제됩니다."
          confirmLabel="변경"
          cancelLabel="취소"
          onConfirm={confirmExamChange}
          onCancel={cancelExamChange}
        />

        <ConfirmModal
          isOpen={activeModal === 'next'}
          eyebrow="Next Question"
          title="다음 문제로 이동할까요?"
          description="현재 문항을 확인한 뒤 다음 문제로 넘어갑니다."
          confirmLabel="이동"
          cancelLabel="취소"
          onConfirm={confirmNextQuestion}
          onCancel={() => setActiveModal(null)}
        />

        <ConfirmModal
          isOpen={activeModal === 'import'}
          eyebrow="Import Progress"
          title="불러온 풀이 기록을 현재 데이터에 합칠까요?"
          description="가져온 풀이 기록은 현재 기록과 병합됩니다."
          confirmLabel="가져오기"
          cancelLabel="취소"
          onConfirm={confirmImport}
          onCancel={() => setActiveModal(null)}
        />

        <ConfirmModal
          isOpen={activeModal === 'reset'}
          eyebrow="Reset Progress"
          title="풀이 기록을 모두 초기화할까요?"
          description="이 작업은 브라우저에 저장된 현재 학습 기록을 지웁니다."
          confirmLabel="초기화"
          cancelLabel="취소"
          confirmTone="red"
          onConfirm={confirmReset}
          onCancel={() => setActiveModal(null)}
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
