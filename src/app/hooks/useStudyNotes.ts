import { useDeferredValue, useMemo } from 'react'
import type { NoteStudyItem } from '../types'
import { LABEL_ALL } from '../utils'
import { getQuestionKey } from '../../storage'
import type { ChoiceNumber, ProgressMap, QuestionCard } from '../../types'

type UseStudyNotesParams = {
  allQuestions: QuestionCard[]
  noteQuery: string
  progressMap: ProgressMap
  subject: string
}

export function useStudyNotes({
  allQuestions,
  noteQuery,
  progressMap,
  subject,
}: UseStudyNotesParams) {
  const deferredNoteQuery = useDeferredValue(noteQuery)

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
              notes,
              progress,
              question,
            },
          ]
        : []
    })
  }, [allQuestions, progressMap])

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

  return {
    searchedNotes,
    subjectFilteredNotes,
  }
}
