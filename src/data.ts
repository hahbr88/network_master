import examsData from '../generated/exams.json'
import type { Exam, QuestionCard } from './types'

const LABEL_ALL = '\uC804\uCCB4'
const exams = examsData as Exam[]

export const allQuestions: QuestionCard[] = exams.flatMap((exam) =>
  exam.questions.map((question) => ({
    ...question,
    examId: exam.examId,
    examDate: exam.examDate,
    round: exam.round,
  })),
)

export const subjects = [LABEL_ALL, ...new Set(allQuestions.map((question) => question.subject))]

export const totalExamCount = exams.length
export const totalQuestionCount = allQuestions.length
