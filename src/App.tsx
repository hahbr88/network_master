import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  FiBookOpen,
  FiExternalLink,
  FiFileText,
  FiGithub,
} from 'react-icons/fi'
import { allQuestions, subjects } from './data'
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
import type { AppView, NoteStudyItem, QuizFilter } from './app/types'
import { LABEL_ALL, loadUiState, saveUiState } from './app/utils'
import { getQuestionKey } from './storage'
import type { ChoiceNumber } from './types'

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
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const deferredNoteQuery = useDeferredValue(noteQuery)
  const filterLockByUnsolved = prioritizeUnsolved

  const {
    current,
    currentProgress,
    eligibleQuestions,
    handleChoiceNoteChange,
    nextQuestion,
    openNotes,
    progressPercent,
    questionCounts,
    revealed,
    selected,
    setSelected,
    solvedQuestionCount,
    subjectQuestions,
    submitAnswer,
    toggleChoiceNotes,
  } = useQuizSession({
    allQuestions,
    prioritizeUnsolved,
    progressMap,
    quizFilter,
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
        ? `${item.question.round}\uD68C`
        : '\uD68C\uCC28 \uBBF8\uC0C1'
      const matchedQuestion =
        item.question.question.toLowerCase().includes(query) ||
        item.question.subject.toLowerCase().includes(query) ||
        `${item.question.examDate ?? item.question.examId} / ${examRoundLabel} / ${item.question.subject}`
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
    if (prioritizeUnsolved && quizFilter !== 'all') {
      setQuizFilter('all')
    }
  }, [prioritizeUnsolved, quizFilter])

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
    nextConfirmOpen,
    resetConfirmOpen,
    revealed,
    selected,
    onConfirmNextQuestion: confirmNextQuestion,
    onCloseNextConfirm: () => setNextConfirmOpen(false),
    onOpenNextConfirm: () => setNextConfirmOpen(true),
    onConfirmReset: confirmReset,
    onCloseResetConfirm: () => setResetConfirmOpen(false),
    onSubmitAnswer: submitAnswer,
  })

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
              description={'문제를 풀고 정답과 오답기록을 바로 확인합니다.'}
              icon={<FiFileText />}
              onClick={() => setView('quiz')}
              title={'문제 풀이'}
            />
            <ViewToggleButton
              active={view === 'notes'}
              description={
                '선택한 메모와 오답 노트를 모아서 확인할 수 있습니다.'
              }
              icon={<FiBookOpen />}
              onClick={() => setView('notes')}
              title={'메모 모아보기'}
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
          >
            {view === 'quiz' ? (
              <>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                        문제 옵션
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        문제를 고르는 방식과 진행률 표시 여부를 여기에서 조절할
                        수 있습니다.
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
                            미풀이 문제 우선
                          </p>
                          <p className="mt-1 text-xs leading-6 text-slate-500">
                            아직 풀지 않은 문제가 있으면 먼저 보여줍니다. 켜면
                            필터는 전체 문제로 고정됩니다.
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
                            진행률 표시
                          </p>
                          <p className="mt-1 text-xs leading-6 text-slate-500">
                            현재 과목 기준의 진행률 카드를 보이거나 숨깁니다.
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
                            현재 과목에서 얼마나 풀었는지 한눈에 확인할 수
                            있습니다.
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
                          푼 문제 {solvedQuestionCount} /{' '}
                          {subjectQuestions.length}
                        </p>
                        <p>
                          남은 문제 {questionCounts.all - solvedQuestionCount}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                        문제 필터
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        전체 문제, 오답 문제, 메모가 있는 문제만 골라서 볼 수
                        있습니다.
                      </p>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <QuizFilterButton
                        active={quizFilter === 'all'}
                        count={questionCounts.all}
                        label={'전체 문제'}
                        onClick={() => setQuizFilter('all')}
                        tone="slate"
                      />
                      <QuizFilterButton
                        active={quizFilter === 'wrong'}
                        count={questionCounts.wrong}
                        disabled={filterLockByUnsolved}
                        label={'오답 문제'}
                        onClick={() => setQuizFilter('wrong')}
                        tone="rose"
                      />
                      <QuizFilterButton
                        active={quizFilter === 'noted'}
                        count={questionCounts.noted}
                        disabled={filterLockByUnsolved}
                        label={'메모 작성한 문제'}
                        onClick={() => setQuizFilter('noted')}
                        tone="amber"
                      />
                    </div>
                    {filterLockByUnsolved ? (
                      <p className="mt-3 text-xs leading-6 text-slate-500">
                        미풀이 문제 우선이 켜져 있으면 필터는 전체 문제만 사용할
                        수 있습니다.
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                  노트 복습
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  현재 과목에서 저장한 메모 개수를 확인하고 메모 복습 화면으로
                  이동할 수 있습니다.
                </p>
                <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                  현재 과목 메모 {subjectFilteredNotes.length}개
                </div>
              </div>
            )}
          </SidebarPanel>

          <section className="rounded-[1.75rem] border border-slate-200/70 bg-white/82 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.4)] backdrop-blur md:p-7">
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
                프로젝트 소개
              </p>
              <p className="mt-3 text-lg font-semibold text-slate-950">
                Network Master
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                네트워크마스터 2급 기출문제와 복습기록을 한 곳에서 관리 할 수
                있도록 만든 학습도구입니다.
              </p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <p>{'제작: hahbr88(하병노)'}</p>
                <p>Version 0.1.0</p>
                <p>Email: hahbr88@gmail.com</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
                안내
              </p>
              <div className="mt-3 grid gap-3 text-sm text-slate-600">
                <p>개인 학습용으로 만든 비공식 문제 풀이 도구입니다.</p>
                <p className="leading-7">
                  문제 원문과 시험 관련 정보는{' '}
                  <a
                    href="https://www.icqa.or.kr/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-sky-700"
                  >
                    한국정보통신자격협회(icqa.or.kr)
                  </a>
                  에서 확인 할 수 있습니다. 네트워크관리사 2급 자격검정 기출문제
                  저작권은 한국정보통신자격협회에 있습니다
                </p>
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
          </div>
        </footer>

        <ConfirmModal
          isOpen={nextConfirmOpen}
          eyebrow="Next Question"
          title={'다음 문제로 이동하시겠습니까?'}
          description={
            '현재 문제의 정답과 오답 기록이 저장되고 다음 문제로 넘어갑니다. 현재 문제에서 메모한 내용이 있다면 메모 모아보기에서 확인할 수 있습니다.'
          }
          confirmLabel={'이동'}
          cancelLabel={'취소'}
          onConfirm={confirmNextQuestion}
          onCancel={() => setNextConfirmOpen(false)}
        />

        <ConfirmModal
          isOpen={importConfirmOpen}
          eyebrow="Import Progress"
          title={'진행 상황을 가져오시겠습니까?'}
          description={
            '가져온 진행 상황은 현재 진행 상황과 병합됩니다. 저장된 메모와 오답 노트는 가져온 데이터로 대체됩니다.'
          }
          confirmLabel={'가져오기'}
          cancelLabel={'취소'}
          onConfirm={confirmImport}
          onCancel={() => setImportConfirmOpen(false)}
        />

        <ConfirmModal
          isOpen={resetConfirmOpen}
          eyebrow="Reset Progress"
          title={'진행 상황을 초기화하시겠습니까?'}
          confirmLabel={'예'}
          cancelLabel={'취소'}
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
