import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { FiBarChart2, FiBookOpen, FiClock, FiFileText } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import {
  AppNotification,
  ConfirmModal,
  DataToolsPanel,
  FooterSection,
  HeaderSection,
  ViewToggleButton,
} from '../app/components'
import { useProgressData } from '../app/hooks/useProgressData'
import { loadUiState, saveUiState } from '../app/utils'
import { allQuestions, examSummaries } from '../data'
import { loadActiveExamSession, loadExamHistory } from '../storage'
import { ExamHistoryCarousel } from './components/ExamHistoryCarousel'

export function StudyLogPage() {
  const navigate = useNavigate()
  const {
    copied,
    dataRevision,
    exportText,
    handleCopyExport,
    handleDownloadExport,
    handleImport,
    handleReset,
    importStatus,
    importText,
    progressMap,
    setImportStatus,
    setImportText,
  } = useProgressData()
  const [dataToolsOpen, setDataToolsOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'import' | 'reset' | null>(
    null,
  )

  const activeExamSession = useMemo(
    () => loadActiveExamSession(),
    [dataRevision],
  )
  const examHistory = useMemo(() => loadExamHistory(), [dataRevision])

  const examTitleMap = useMemo(
    () =>
      new Map(examSummaries.map((exam) => [exam.examId, exam.title] as const)),
    [],
  )

  const totalSolvedQuestions = useMemo(() => {
    return Object.values(progressMap).filter(
      (progress) => progress.attempts > 0,
    ).length
  }, [progressMap])

  const totalAttempts = useMemo(() => {
    return Object.values(progressMap).reduce(
      (sum, progress) => sum + progress.attempts,
      0,
    )
  }, [progressMap])

  const totalCorrect = useMemo(() => {
    return Object.values(progressMap).reduce(
      (sum, progress) => sum + progress.correctCount,
      0,
    )
  }, [progressMap])

  const totalWrong = useMemo(() => {
    return Object.values(progressMap).reduce(
      (sum, progress) => sum + progress.wrongCount,
      0,
    )
  }, [progressMap])

  const totalNotes = useMemo(() => {
    return Object.values(progressMap).reduce(
      (sum, progress) => sum + Object.keys(progress.choiceNotes).length,
      0,
    )
  }, [progressMap])

  const accuracy = useMemo(() => {
    const totalAnswered = totalCorrect + totalWrong
    return totalAnswered === 0
      ? 0
      : Math.round((totalCorrect / totalAnswered) * 100)
  }, [totalCorrect, totalWrong])

  const latestSolvedAt = useMemo(() => {
    return Object.values(progressMap).reduce<string | null>(
      (latest, progress) => {
        if (!progress.lastSolvedAt) {
          return latest
        }

        if (!latest) {
          return progress.lastSolvedAt
        }

        return new Date(progress.lastSolvedAt).getTime() >
          new Date(latest).getTime()
          ? progress.lastSolvedAt
          : latest
      },
      null,
    )
  }, [progressMap])

  const subjectStats = useMemo(() => {
    return Array.from(
      allQuestions
        .reduce(
          (map, question) => {
            const key = `${question.examId}-${question.number}`
            const progress = progressMap[key]
            const current = map.get(question.subject) ?? {
              subject: question.subject,
              solved: 0,
              attempts: 0,
              correct: 0,
            }

            if ((progress?.attempts ?? 0) > 0) {
              current.solved += 1
            }

            current.attempts += progress?.attempts ?? 0
            current.correct += progress?.correctCount ?? 0
            map.set(question.subject, current)
            return map
          },
          new Map<
            string,
            {
              subject: string
              solved: number
              attempts: number
              correct: number
            }
          >(),
        )
        .values(),
    ).sort(
      (left, right) =>
        right.solved - left.solved || right.attempts - left.attempts,
    )
  }, [progressMap])

  const activeExamSummary = activeExamSession
    ? (examSummaries.find((exam) => exam.examId === activeExamSession.examId) ??
      null)
    : null

  const activeQuestionCount = activeExamSummary?.questionCount ?? 0
  const activeSolvedCount = activeExamSession
    ? activeExamSession.currentIndex + 1
    : 0
  const activeProgressPercent =
    activeQuestionCount > 0
      ? Math.min(
          100,
          Math.round((activeSolvedCount / activeQuestionCount) * 100),
        )
      : 0
  const activeExamRoundLabel = activeExamSummary?.round
    ? `${activeExamSummary.examDate} ${activeExamSummary.round}회차`
    : activeExamSession?.examId

  const handleResumeExam = () => {
    if (!activeExamSession) {
      return
    }

    const currentUiState = loadUiState()
    saveUiState({
      ...currentUiState,
      view: 'quiz',
      quizMode: 'exam',
      selectedExamId: activeExamSession.examId,
      reviewQuestionKeys: null,
    })
    navigate('/')
  }

  const navigateToHomeView = (view: 'quiz' | 'notes') => {
    const currentUiState = loadUiState()
    saveUiState({
      ...currentUiState,
      view,
      reviewQuestionKeys: null,
    })
    navigate('/')
  }

  const navigateToWrongQuestionReview = (wrongQuestionKeys: string[]) => {
    const currentUiState = loadUiState()
    saveUiState({
      ...currentUiState,
      view: 'quiz',
      quizMode: 'random',
      quizFilter: 'all',
      prioritizeUnsolved: false,
      reviewQuestionKeys: wrongQuestionKeys,
    })
    navigate('/')
  }

  const confirmImport = () => {
    setActiveModal(null)
    handleImport()
  }

  const confirmReset = () => {
    setActiveModal(null)
    handleReset()
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),rgba(255,255,255,0.62)_32%,rgba(239,246,255,0.96)_70%),linear-gradient(135deg,#dbeafe,#fef3c7_42%,#dcfce7)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <HeaderSection />

        <section className="rounded-[1.75rem] border border-white/70 bg-white/72 p-3 shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="grid gap-2 md:grid-cols-3">
            <ViewToggleButton
              active={false}
              description="랜덤 문제와 회차별 모의고사로 문제를 풀 수 있습니다."
              icon={<FiFileText />}
              onClick={() => navigateToHomeView('quiz')}
              title="문제 풀이"
            />
            <ViewToggleButton
              active={false}
              description="선택지 메모를 모아서 읽고 다시 학습할 수 있습니다."
              icon={<FiBookOpen />}
              onClick={() => navigateToHomeView('notes')}
              title="해설 노트"
            />
            <ViewToggleButton
              active
              description="학습 통계, 이어풀기 상태, 모의고사 이력을 확인합니다."
              icon={<FiBarChart2 />}
              onClick={() => navigate('/studylog')}
              title="학습 기록"
            />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/72 p-6 shadow-[0_20px_80px_-28px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
                Study Log
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">
                누적 학습 기록
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                풀이 기록, 이어풀기 상태, 모의고사 이력, 과목별 학습 흐름을 한
                곳에서 확인할 수 있습니다.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600">
              최근 학습{' '}
              {latestSolvedAt
                ? formatDateTime(latestSolvedAt)
                : '아직 풀이 기록이 없습니다.'}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            description="전체 문제 중 한 번 이상 풀이한 문항 수입니다."
            icon={<FiBarChart2 className="h-5 w-5" />}
            label="푼 문제"
            value={`${totalSolvedQuestions} / ${allQuestions.length}`}
          />
          <SummaryCard
            description="정답과 오답을 합친 전체 시도 횟수입니다."
            icon={<FiClock className="h-5 w-5" />}
            label="총 시도 수"
            value={`${totalAttempts}`}
          />
          <SummaryCard
            description={`정답 ${totalCorrect}회 / 오답 ${totalWrong}회`}
            icon={<FiFileText className="h-5 w-5" />}
            label="정답률"
            value={`${accuracy}%`}
          />
          <SummaryCard
            description={`모의고사 이력 ${examHistory.length}건`}
            icon={<FiBookOpen className="h-5 w-5" />}
            label="메모 수"
            value={`${totalNotes}`}
          />
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-6 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                Active Session
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                진행 중인 모의고사
              </h3>
            </div>
            {activeExamSession ? (
              <button
                type="button"
                onClick={handleResumeExam}
                className="shrink-0 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                이어서 풀기
              </button>
            ) : null}
          </div>

          {activeExamSession ? (
            <div className="mt-4 rounded-[1.35rem] border border-sky-200 bg-sky-50 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950 md:text-lg">
                    {activeExamRoundLabel}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {activeExamSummary?.title ??
                      activeExamSummary?.examId ??
                      activeExamSession.examId}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-sky-700">
                  {activeProgressPercent}%
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-sky-100">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#38bdf8)] transition-[width] duration-500"
                  style={{ width: `${activeProgressPercent}%` }}
                />
              </div>

              <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600 md:flex-row md:flex-wrap md:items-center md:gap-2">
                <span>
                  {activeSolvedCount} / {activeQuestionCount}문항 진행
                </span>
                <span className="hidden text-slate-300 md:inline">/</span>
                <span>최근 저장 {formatDateTime(activeExamSession.updatedAt)}</span>
              </div>
            </div>
          ) : (
            <EmptySection
              description="문제 풀이 화면에서 모의고사를 시작하면 이어풀기 상태가 여기에 표시됩니다."
              title="진행 중인 모의고사가 없습니다."
            />
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-6 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Exam History
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
              모의고사 기록
            </h3>

            <ExamHistoryCarousel
              examHistory={examHistory}
              examTitleMap={examTitleMap}
              onReviewWrongQuestions={navigateToWrongQuestionReview}
            />
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-6 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Subject Summary
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">
              과목별 학습 현황
            </h3>

            {subjectStats.length === 0 || totalAttempts === 0 ? (
              <EmptySection
                compact
                description="문제를 풀기 시작하면 과목별 통계가 여기에 쌓입니다."
                title="아직 표시할 과목 통계가 없습니다."
              />
            ) : (
              <div className="mt-5 grid gap-4">
                {subjectStats.map((subject) => {
                  const accuracyValue =
                    subject.attempts === 0
                      ? 0
                      : Math.round((subject.correct / subject.attempts) * 100)

                  return (
                    <article
                      key={subject.subject}
                      className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {subject.subject}
                        </p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {subject.solved}문항 풀이
                        </span>
                      </div>

                      <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                            Accuracy
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {accuracyValue}%
                          </p>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,#0ea5e9,#22c55e)] transition-[width] duration-500"
                            style={{ width: `${accuracyValue}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MiniStat label="총 시도" value={`${subject.attempts}`} />
                        <MiniStat label="정답 수" value={`${subject.correct}`} />
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <DataToolsPanel
          copied={copied}
          dataToolsOpen={dataToolsOpen}
          exportText={exportText}
          importText={importText}
          onCopyExport={handleCopyExport}
          onDownloadExport={handleDownloadExport}
          onImport={() => setActiveModal('import')}
          onImportTextChange={setImportText}
          onResetRequest={() => setActiveModal('reset')}
          onToggle={() => setDataToolsOpen((previous) => !previous)}
        />

        <FooterSection />

        <ConfirmModal
          isOpen={activeModal === 'import'}
          eyebrow="Import Progress"
          title="가져온 기록을 현재 데이터에 합칠까요?"
          description="풀이 기록과 모의고사 정보가 현재 브라우저 데이터와 병합됩니다."
          confirmLabel="가져오기"
          cancelLabel="취소"
          onConfirm={confirmImport}
          onCancel={() => setActiveModal(null)}
        />

        <ConfirmModal
          isOpen={activeModal === 'reset'}
          eyebrow="Reset Progress"
          title="저장된 학습 기록을 모두 초기화할까요?"
          description="문항 기록, 메모, 진행 중인 모의고사, 모의고사 이력이 함께 삭제됩니다."
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

function SummaryCard({
  description,
  icon,
  label,
  value,
}: {
  description: string
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200/70 bg-white/82 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur">
      <div className="flex items-center gap-3 text-sky-700">
        <div className="rounded-2xl bg-sky-50 p-3">{icon}</div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-[-0.03em] text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </article>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  )
}

function EmptySection({
  compact = false,
  description,
  title,
}: {
  compact?: boolean
  description: string
  title: string
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center ${
        compact ? 'mt-5 min-h-[180px]' : 'mt-5 min-h-[220px]'
      }`}
    >
      <div className="max-w-md">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
