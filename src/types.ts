export type ExamQuestion = {
  number: number
  subject: string
  question: string
  choices: string[]
  answer: number
  answerText: string
  answerExplanation?: string
  choiceExplanations?: string[]
}

export type Exam = {
  examId: string
  title: string
  examDate: string | null
  round: number | null
  sourceFile: string
  questionCount: number
  questions: ExamQuestion[]
}

export type QuestionCard = ExamQuestion & {
  examId: string
  examDate: string | null
  round: number | null
}

export type ChoiceNumber = 1 | 2 | 3 | 4

export type ChoiceNotes = Partial<Record<ChoiceNumber, string>>

export type QuestionProgress = {
  attempts: number
  correctCount: number
  wrongCount: number
  lastSolvedAt: string | null
  lastSelectedChoice: ChoiceNumber | null
  lastWasCorrect: boolean | null
  choiceNotes: ChoiceNotes
}

export type ProgressMap = Record<string, QuestionProgress>

export type UserDataExport = {
  version: 1
  exportedAt: string
  progress: ProgressMap
}
