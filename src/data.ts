import examsData from '../generated/exams.json'
import type { Exam, QuestionCard } from './types'

const LABEL_ALL = '전체'
const exams = examsData as Exam[]

function withComputedRounds(items: Exam[]) {
  const examIdsByComputedRound = new Map<string, number>()
  const examsByYear = new Map<string, Exam[]>()

  items.forEach((exam) => {
    const year = exam.examDate?.slice(0, 4) ?? exam.examId.slice(0, 4)
    const bucket = examsByYear.get(year) ?? []
    bucket.push(exam)
    examsByYear.set(year, bucket)
  })

  examsByYear.forEach((yearExams) => {
    yearExams
      .slice()
      .sort((left, right) => {
        const leftDate = left.examDate ?? left.examId
        const rightDate = right.examDate ?? right.examId
        return leftDate.localeCompare(rightDate)
      })
      .forEach((exam, index) => {
        examIdsByComputedRound.set(exam.examId, index + 1)
      })
  })

  return items.map((exam) => ({
    ...exam,
    round: exam.round ?? examIdsByComputedRound.get(exam.examId) ?? null,
  }))
}

const examsWithRounds = withComputedRounds(exams)

export const allQuestions: QuestionCard[] = examsWithRounds.flatMap((exam) =>
  exam.questions.map((question) => ({
    ...question,
    examId: exam.examId,
    examDate: exam.examDate,
    round: exam.round,
  })),
)

export const examSummaries = examsWithRounds.map((exam) => ({
  examId: exam.examId,
  examDate: exam.examDate,
  questionCount: exam.questionCount,
  round: exam.round,
  title: exam.title,
}))

export const questionsByExamId = Object.fromEntries(
  examsWithRounds.map((exam) => [
    exam.examId,
    exam.questions.map((question) => ({
      ...question,
      examId: exam.examId,
      examDate: exam.examDate,
      round: exam.round,
    })),
  ]),
) as Record<string, QuestionCard[]>

export const subjects = [
  LABEL_ALL,
  ...new Set(allQuestions.map((question) => question.subject)),
]

export const totalExamCount = examsWithRounds.length
export const totalQuestionCount = allQuestions.length
