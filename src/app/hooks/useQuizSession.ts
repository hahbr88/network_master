import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { getQuestionId, LABEL_ALL, pickRandomQuestion } from '../utils'
import {
  createEmptyProgress,
  getQuestionKey,
  updateChoiceNote,
  updateQuestionAttempt,
} from '../../storage'
import type { QuizFilter } from '../types'
import type {
  ChoiceNumber,
  ProgressMap,
  QuestionCard,
  QuestionProgress,
} from '../../types'

type UseQuizSessionParams = {
  allQuestions: QuestionCard[]
  prioritizeUnsolved: boolean
  progressMap: ProgressMap
  quizFilter: QuizFilter
  setProgressMap: Dispatch<SetStateAction<ProgressMap>>
  subject: string
}

export function useQuizSession({
  allQuestions,
  prioritizeUnsolved,
  progressMap,
  quizFilter,
  setProgressMap,
  subject,
}: UseQuizSessionParams) {
  const [current, setCurrent] = useState<QuestionCard | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({})

  const subjectQuestions = useMemo(() => {
    return subject === LABEL_ALL
      ? allQuestions
      : allQuestions.filter((question) => question.subject === subject)
  }, [allQuestions, subject])

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
  const currentProgress: QuestionProgress = currentKey
    ? (progressMap[currentKey] ?? createEmptyProgress())
    : createEmptyProgress()

  const selectNextQuestion = (previousId?: string) => {
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
  }, [current, eligibleQuestions, prioritizeUnsolved, unsolvedEligibleQuestions])

  const nextQuestion = () => {
    const previousId = current ? getQuestionId(current) : undefined
    const next = selectNextQuestion(previousId)
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
    handleChoiceNoteChange,
    nextQuestion,
    openNotes,
    progressPercent,
    questionCounts,
    revealed,
    selected,
    setSelected,
    setRevealed,
    solvedQuestionCount,
    subjectQuestions,
    submitAnswer,
    toggleChoiceNotes,
  }
}
