import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiChevronUp, FiEdit3, FiSearch, FiXCircle } from 'react-icons/fi'
import type { NoteStudyItem } from '../types'
import { formatAttemptText, formatExamLabel } from '../utils'

export function NotesStudyPanel({
  noteSearchOpen,
  noteQuery,
  notes,
  onNoteSearchToggle,
  onNoteQueryChange,
  onStudyNotedQuestions,
}: {
  noteSearchOpen: boolean
  noteQuery: string
  notes: NoteStudyItem[]
  onNoteSearchToggle: () => void
  onNoteQueryChange: (value: string) => void
  onStudyNotedQuestions: () => void
}) {
  const hasQuery = noteQuery.trim().length > 0
  const [pageSize, setPageSize] = useState<5 | 10 | 20>(5)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [noteQuery, notes.length, pageSize])

  const totalPages = Math.max(1, Math.ceil(notes.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedNotes = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return notes.slice(start, start + pageSize)
  }, [notes, pageSize, safePage])

  if (notes.length === 0 && !hasQuery) {
    return (
      <EmptyState
        title="아직 저장된 메모가 없습니다."
        description="선택지 메모를 남기면 이 화면에서 모아서 복습할 수 있습니다."
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
            Study Notes
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950 md:text-3xl">
            메모 복습
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            저장한 선택지 메모를 모아서 다시 읽고 정리할 수 있습니다.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
            총 {notes.length}개 메모
          </div>
          <button
            type="button"
            aria-expanded={noteSearchOpen}
            onClick={onNoteSearchToggle}
            className="rounded-full border border-slate-300 bg-white p-3 text-slate-700 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.4)] transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            {noteSearchOpen ? (
              <FiChevronUp className="h-4 w-4" />
            ) : (
              <FiSearch className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {noteSearchOpen ? (
        <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
              Search
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {hasQuery
                ? `검색 결과 ${notes.length}개`
                : `현재 표시 중인 메모 ${notes.length}개`}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={noteQuery}
                onChange={(event) => onNoteQueryChange(event.target.value)}
                placeholder="문제, 선택지, 메모 내용으로 검색"
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400"
              />
              {hasQuery ? (
                <button
                  type="button"
                  onClick={() => onNoteQueryChange('')}
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  초기화
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onStudyNotedQuestions}
          className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2"
        >
          메모 있는 문제만 풀기
        </button>
      </div>

      {notes.length > 0 ? (
        <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {([5, 10, 20] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPageSize(size)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    pageSize === size
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {size}개씩 보기
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safePage === 1}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                이전
              </button>
              <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {safePage} / {totalPages}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={safePage === totalPages}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <EmptyState
          title="검색 결과가 없습니다."
          description="검색어를 바꾸거나 필터를 해제해 보세요."
        />
      ) : null}

      {notes.length > 0 ? (
        <div className="grid gap-4">
          {paginatedNotes.map((item) => {
            return (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.24em] text-slate-500 uppercase">
                      {formatExamLabel(item.question)}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-slate-950">
                      {item.question.number}번 문제
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      메모 {item.notes.length}개
                    </span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {formatAttemptText(item.progress.attempts)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-500">문제</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {item.question.question}
                  </p>
                </div>

                <div className="mt-4 grid gap-4">
                  {item.notes.map((noteItem) => {
                    const isCorrectChoice =
                      item.question.answer === noteItem.choiceNumber

                    return (
                      <div
                        key={`${item.id}-${noteItem.choiceNumber}`}
                        className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Choice {noteItem.choiceNumber}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                              isCorrectChoice
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {isCorrectChoice ? (
                              <FiCheckCircle className="h-3.5 w-3.5" />
                            ) : (
                              <FiXCircle className="h-3.5 w-3.5" />
                            )}
                            {isCorrectChoice ? '정답 선택지' : '오답 선택지'}
                          </span>
                        </div>

                        <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-sm font-semibold text-slate-500">
                            선택지
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-700">
                            {noteItem.choiceNumber}. {noteItem.choiceText}
                          </p>
                        </div>

                        <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                            <FiEdit3 className="h-4 w-4" />
                            <span>내 메모</span>
                          </div>
                          <p className="mt-2 text-sm leading-7 whitespace-pre-wrap text-slate-700">
                            {noteItem.note}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function EmptyState({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="max-w-md">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      </div>
    </div>
  )
}
