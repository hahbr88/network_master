import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { getQuestionId, LABEL_ALL, pickRandomQuestion } from '../utils'
import {
  createEmptyProgress,
  getQuestionKey,
  updateChoiceNote,
  updateQuestionAttempt,
} from '../../storage'
import type { QuizFilter, QuizMode } from '../types'
import type {
  ChoiceNumber,
  ProgressMap,
  QuestionCard,
  QuestionProgress,
} from '../../types'

type UseQuizSessionParams = {
  allQuestions: QuestionCard[]
  examQuestions: QuestionCard[]
  prioritizeUnsolved: boolean
  progressMap: ProgressMap
  quizFilter: QuizFilter
  quizMode: QuizMode
  setProgressMap: Dispatch<SetStateAction<ProgressMap>>
  subject: string
}

export function useQuizSession({
  allQuestions,
  examQuestions,
  prioritizeUnsolved,
  progressMap,
  quizFilter,
  quizMode,
  setProgressMap,
  subject,
}: UseQuizSessionParams) {
  const [current, setCurrent] = useState<QuestionCard | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({})
  const [examAnswerMap, setExamAnswerMap] = useState<
    Record<string, { correct: boolean; selectedChoice: ChoiceNumber }>
  >({})
  const [examResultOpen, setExamResultOpen] = useState(false)

  const subjectQuestions = useMemo(() => {
    if (quizMode === 'exam') {
      return examQuestions
    }

    return subject === LABEL_ALL
      ? allQuestions
      : allQuestions.filter((question) => question.subject === subject)
  }, [allQuestions, examQuestions, quizMode, subject])

  const eligibleQuestions = useMemo(() => {
    if (quizMode === 'exam') {
      return examQuestions
    }

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
  }, [examQuestions, progressMap, quizFilter, quizMode, subjectQuestions])

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
  const currentProgress: QuestionProgress = currentKey
    ? (progressMap[currentKey] ?? createEmptyProgress())
    : createEmptyProgress()

  const currentExamIndex = useMemo(() => {
    if (!current || quizMode !== 'exam') {
      return -1
    }

    return examQuestions.findIndex(
      (question) => getQuestionId(question) === getQuestionId(current),
    )
  }, [current, examQuestions, quizMode])

  const examSession = useMemo(() => {
    if (quizMode !== 'exam') {
      return null
    }

    const sessionAnsweredCount = examQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return !!examAnswerMap[key]
    }).length

    const sessionCorrectCount = examQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return examAnswerMap[key]?.correct === true
    }).length

    return {
      currentIndex: currentExamIndex,
      totalQuestions: examQuestions.length,
      answeredCount: sessionAnsweredCount,
      correctCount: sessionCorrectCount,
      hasNext:
        currentExamIndex >= 0 && currentExamIndex < examQuestions.length - 1,
    }
  }, [
    currentExamIndex,
    examAnswerMap,
    examQuestions.length,
    quizMode,
  ])

  const examResultSummary = useMemo(() => {
    if (quizMode !== 'exam') {
      return null
    }

    const totalQuestions = examQuestions.length
    const answeredCount = examQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return !!examAnswerMap[key]
    }).length
    const correctCount = examQuestions.filter((question) => {
      const key = getQuestionKey(question.examId, question.number)
      return examAnswerMap[key]?.correct === true
    }).length
    const wrongCount = answeredCount - correctCount
    const score =
      totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100)

    const subjectStats = Array.from(
      examQuestions.reduce(
        (map, question) => {
          const currentValue = map.get(question.subject) ?? {
            subject: question.subject,
            total: 0,
            correct: 0,
          }
          const key = getQuestionKey(question.examId, question.number)

          currentValue.total += 1
          if (examAnswerMap[key]?.correct) {
            currentValue.correct += 1
          }

          map.set(question.subject, currentValue)
          return map
        },
        new Map<string, { subject: string; total: number; correct: number }>(),
      ).values(),
    )

    return {
      totalQuestions,
      answeredCount,
      correctCount,
      wrongCount,
      score,
      subjectStats,
    }
  }, [examAnswerMap, examQuestions, quizMode])

  const examReadyForResult =
    quizMode === 'exam' &&
    revealed &&
    currentExamIndex === examQuestions.length - 1 &&
    examQuestions.length > 0

  const selectNextQuestion = (previousId?: string) => {
    if (quizMode === 'exam') {
      if (examQuestions.length === 0) {
        return null
      }

      if (!current) {
        return examQuestions[0]
      }

      const currentIndex = examQuestions.findIndex(
        (question) => getQuestionId(question) === getQuestionId(current),
      )

      if (currentIndex < 0) {
        return examQuestions[0]
      }

      return examQuestions[Math.min(currentIndex + 1, examQuestions.length - 1)]
    }

    const pool =
      prioritizeUnsolved && unsolvedEligibleQuestions.length > 0
        ? unsolvedEligibleQuestions
        : eligibleQuestions

    return pickRandomQuestion(pool, previousId)
  }

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
  }, [
    current,
    eligibleQuestions,
    examQuestions,
    prioritizeUnsolved,
    quizMode,
    unsolvedEligibleQuestions,
  ])

  useEffect(() => {
    setSelected(null)
    setRevealed(false)
    setExamResultOpen(false)
    setExamAnswerMap({})

    if (quizMode !== 'exam') {
      return
    }

    setCurrent(examQuestions[0] ?? null)
  }, [examQuestions, quizMode])

  const nextQuestion = () => {
    const previousId = current ? getQuestionId(current) : undefined
    const next = selectNextQuestion(previousId)

    if (
      quizMode === 'exam' &&
      current &&
      next &&
      getQuestionId(next) === getQuestionId(current)
    ) {
      return
    }

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
    if (quizMode === 'exam') {
      setExamAnswerMap((previous) => ({
        ...previous,
        [currentKey]: {
          correct: selected === current.answer,
          selectedChoice: selected as ChoiceNumber,
        },
      }))
    }
    setRevealed(true)
  }

  const openExamResult = () => {
    if (!examReadyForResult) {
      return
    }

    setExamResultOpen(true)
  }

  const restartExam = () => {
    setExamAnswerMap({})
    setExamResultOpen(false)
    setCurrent(examQuestions[0] ?? null)
    setSelected(null)
    setRevealed(false)
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

  return {
    current,
    currentProgress,
    eligibleQuestions,
    examReadyForResult,
    examResultOpen,
    examResultSummary,
    examSession,
    handleChoiceNoteChange,
    nextQuestion,
    openExamResult,
    openNotes,
    progressPercent,
    questionCounts,
    revealed,
    selected,
    setSelected,
    setRevealed,
    solvedQuestionCount,
    restartExam,
    subjectQuestions,
    submitAnswer,
    toggleChoiceNotes,
  }
}
