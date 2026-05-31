import { useState, useEffect, useRef } from 'react'
import {
  fetchSurveys,
  fetchSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  createOption,
  updateOption,
  deleteOption
} from '../api'
import type { Survey, SurveyQuestion, SurveyQuestionOption } from '../types'
import './SurveysPage.css'

const SvgIcon = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  add: 'M12 5v14M5 12h14',
  close: 'M18 6L6 18M6 6l12 12',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  delete: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  chevronDown: 'M6 9l6 6 6-6',
  drag: 'M8 6h1M15 6h1M8 12h1M15 12h1M8 18h1M15 18h1',
  spinner: '',
} as const

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newShowTitle, setNewShowTitle] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editSurveyOpen, setEditSurveyOpen] = useState<Survey | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editShowTitle, setEditShowTitle] = useState(false)
  const [updatingSurvey, setUpdatingSurvey] = useState(false)
  const [addQuestionOpen, setAddQuestionOpen] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<'single' | 'multiple'>('single')
  const [creatingQuestion, setCreatingQuestion] = useState(false)
  const [editQuestionOpen, setEditQuestionOpen] = useState<SurveyQuestion | null>(null)
  const [editQuestionText, setEditQuestionText] = useState('')
  const [editQuestionType, setEditQuestionType] = useState<'single' | 'multiple'>('single')
  const [updatingQuestion, setUpdatingQuestion] = useState(false)
  const [addOptionOpen, setAddOptionOpen] = useState<SurveyQuestion | null>(null)
  const [newOptionText, setNewOptionText] = useState('')
  const [creatingOption, setCreatingOption] = useState(false)
  const [editOptionOpen, setEditOptionOpen] = useState<{ q: SurveyQuestion; o: SurveyQuestionOption } | null>(null)
  const [editOptionText, setEditOptionText] = useState('')
  const [updatingOption, setUpdatingOption] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())
  const [dragQuestionId, setDragQuestionId] = useState<number | null>(null)

  const createDialogRef = useRef<HTMLDialogElement>(null)
  const editSurveyDialogRef = useRef<HTMLDialogElement>(null)
  const addQuestionDialogRef = useRef<HTMLDialogElement>(null)
  const editQuestionDialogRef = useRef<HTMLDialogElement>(null)
  const addOptionDialogRef = useRef<HTMLDialogElement>(null)
  const editOptionDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    fetchSurveys()
      .then(setSurveys)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedSurvey) {
      fetchSurvey(selectedSurvey.id)
        .then(setSelectedSurvey)
        .catch((e) => setError(e.message))
    }
  }, [selectedSurvey?.id])

  useEffect(() => {
    if (editSurveyOpen) {
      setEditTitle(editSurveyOpen.title)
      setEditShowTitle(editSurveyOpen.showTitle ?? false)
    }
  }, [editSurveyOpen])

  useEffect(() => {
    if (editQuestionOpen) {
      setEditQuestionText(editQuestionOpen.text)
      setEditQuestionType(editQuestionOpen.choiceType)
    }
  }, [editQuestionOpen])

  useEffect(() => {
    if (editOptionOpen) setEditOptionText(editOptionOpen.o.text)
  }, [editOptionOpen])

  useEffect(() => {
    if (createOpen) createDialogRef.current?.showModal()
    else createDialogRef.current?.close()
  }, [createOpen])

  useEffect(() => {
    if (editSurveyOpen) editSurveyDialogRef.current?.showModal()
    else editSurveyDialogRef.current?.close()
  }, [editSurveyOpen])

  useEffect(() => {
    if (addQuestionOpen) addQuestionDialogRef.current?.showModal()
    else addQuestionDialogRef.current?.close()
  }, [addQuestionOpen])

  useEffect(() => {
    if (editQuestionOpen) editQuestionDialogRef.current?.showModal()
    else editQuestionDialogRef.current?.close()
  }, [editQuestionOpen])

  useEffect(() => {
    if (addOptionOpen) addOptionDialogRef.current?.showModal()
    else addOptionDialogRef.current?.close()
  }, [addOptionOpen])

  useEffect(() => {
    if (editOptionOpen) editOptionDialogRef.current?.showModal()
    else editOptionDialogRef.current?.close()
  }, [editOptionOpen])

  const handleCreateSurvey = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setError(null)
    try {
      const s = await createSurvey({ title: newTitle.trim(), showTitle: newShowTitle })
      setSurveys((prev) => [s, ...prev])
      setSelectedSurvey(s)
      setCreateOpen(false)
      setNewTitle('')
      setNewShowTitle(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateSurvey = async () => {
    if (!editSurveyOpen || !editTitle.trim()) return
    setUpdatingSurvey(true)
    setError(null)
    try {
      await updateSurvey(editSurveyOpen.id, { title: editTitle.trim(), showTitle: editShowTitle })
      setSurveys((prev) => prev.map((s) => (s.id === editSurveyOpen.id ? { ...s, title: editTitle.trim(), showTitle: editShowTitle } : s)))
      if (selectedSurvey?.id === editSurveyOpen.id) setSelectedSurvey((s) => (s ? { ...s, title: editTitle.trim(), showTitle: editShowTitle } : null))
      setEditSurveyOpen(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setUpdatingSurvey(false)
    }
  }

  const handleDeleteSurvey = async (s: Survey) => {
    if (!confirm('Удалить опрос «' + s.title + '»?')) return
    setError(null)
    try {
      await deleteSurvey(s.id)
      setSurveys((prev) => prev.filter((x) => x.id !== s.id))
      if (selectedSurvey?.id === s.id) setSelectedSurvey(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const handleCreateQuestion = async () => {
    if (!selectedSurvey || !newQuestionText.trim()) return
    setCreatingQuestion(true)
    setError(null)
    try {
      const q = await createQuestion(selectedSurvey.id, newQuestionText.trim(), newQuestionType)
      setSelectedSurvey((s) =>
        s
          ? {
            ...s,
            questions: [...s.questions, q].sort((a, b) => a.sortOrder - b.sortOrder)
          }
          : null
      )
      setAddQuestionOpen(false)
      setNewQuestionText('')
      setNewQuestionType('single')
      setExpandedQuestions((prev) => new Set([...prev, q.id]))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setCreatingQuestion(false)
    }
  }

  const handleUpdateQuestion = async () => {
    if (!selectedSurvey || !editQuestionOpen || !editQuestionText.trim()) return
    setUpdatingQuestion(true)
    setError(null)
    try {
      await updateQuestion(selectedSurvey.id, editQuestionOpen.id, { text: editQuestionText.trim(), choiceType: editQuestionType })
      setSelectedSurvey((s) =>
        s
          ? {
            ...s,
            questions: s.questions.map((q) =>
              q.id === editQuestionOpen.id ? { ...q, text: editQuestionText.trim(), choiceType: editQuestionType } : q
            )
          }
          : null
      )
      setEditQuestionOpen(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setUpdatingQuestion(false)
    }
  }

  const handleDeleteQuestion = async (q: SurveyQuestion) => {
    if (!selectedSurvey || !confirm('Удалить вопрос?')) return
    setError(null)
    try {
      await deleteQuestion(selectedSurvey.id, q.id)
      setSelectedSurvey((s) => (s ? { ...s, questions: s.questions.filter((x) => x.id !== q.id) } : null))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const handleCreateOption = async () => {
    if (!selectedSurvey || !addOptionOpen || !newOptionText.trim()) return
    setCreatingOption(true)
    setError(null)
    try {
      const o = await createOption(selectedSurvey.id, addOptionOpen.id, newOptionText.trim())
      setSelectedSurvey((s) =>
        s
          ? {
            ...s,
            questions: s.questions.map((q) =>
              q.id === addOptionOpen.id ? { ...q, options: [...q.options, o].sort((a, b) => a.sortOrder - b.sortOrder) } : q
            )
          }
          : null
      )
      setAddOptionOpen(null)
      setNewOptionText('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setCreatingOption(false)
    }
  }

  const handleUpdateOption = async () => {
    if (!selectedSurvey || !editOptionOpen || !editOptionText.trim()) return
    setUpdatingOption(true)
    setError(null)
    try {
      await updateOption(selectedSurvey.id, editOptionOpen.q.id, editOptionOpen.o.id, editOptionText.trim())
      setSelectedSurvey((s) =>
        s
          ? {
            ...s,
            questions: s.questions.map((q) =>
              q.id === editOptionOpen.q.id
                ? { ...q, options: q.options.map((o) => (o.id === editOptionOpen.o.id ? { ...o, text: editOptionText.trim() } : o)) }
                : q
            )
          }
          : null
      )
      setEditOptionOpen(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setUpdatingOption(false)
    }
  }

  const handleDeleteOption = async (q: SurveyQuestion, o: SurveyQuestionOption) => {
    if (!selectedSurvey || !confirm('Удалить вариант ответа?')) return
    setError(null)
    try {
      await deleteOption(selectedSurvey.id, q.id, o.id)
      setSelectedSurvey((s) =>
        s ? { ...s, questions: s.questions.map((x) => (x.id === q.id ? { ...x, options: x.options.filter((opt) => opt.id !== o.id) } : x)) } : null
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const toggleQuestion = (id: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleQuestionDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleQuestionDrop = async (targetId: number) => {
    if (!selectedSurvey || !dragQuestionId || dragQuestionId === targetId) {
      setDragQuestionId(null)
      return
    }
    const sorted = [...selectedSurvey.questions].sort((a, b) => a.sortOrder - b.sortOrder)
    const fromIdx = sorted.findIndex((q) => q.id === dragQuestionId)
    const toIdx = sorted.findIndex((q) => q.id === targetId)
    if (fromIdx === -1 || toIdx === -1) { setDragQuestionId(null); return }
    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const orders = reordered.map((q, idx) => ({ questionId: q.id, sortOrder: idx }))
    try {
      await reorderQuestions(selectedSurvey.id, orders)
      setSelectedSurvey((s) => s ? { ...s, questions: reordered } : null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сортировки')
    }
    setDragQuestionId(null)
  }

  const sortedQuestions = selectedSurvey
    ? [...selectedSurvey.questions].sort((a, b) => a.sortOrder - b.sortOrder)
    : []

  if (loading) {
    return (
      <div className="surveys-page">
        <div className="surveys-loading">
          <div className="surveys-spinner" />
          <span>Загрузка…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="surveys-page">
      {error && (
        <div className="surveys-message surveys-message--error">
          <span className="surveys-message-text">{error}</span>
          <button className="surveys-message-close" onClick={() => setError(null)} aria-label="Закрыть">
            <SvgIcon d={ICONS.close} size={16} />
          </button>
        </div>
      )}

      <div className="surveys-layout">
        <aside className="surveys-sidebar">
          <div className="surveys-sidebar-header">
            <h2 className="surveys-sidebar-title">Опросы</h2>
            <button
              className="surveys-btn surveys-btn--primary"
              onClick={() => {
                setCreateOpen(true)
                setNewTitle('')
                setNewShowTitle(false)
              }}
            >
              <SvgIcon d={ICONS.add} size={16} />
              Создать
            </button>
          </div>
          <ul className="surveys-list">
            {surveys.map((s) => (
              <li
                key={s.id}
                className={`surveys-list-item${selectedSurvey?.id === s.id ? ' surveys-list-item--selected' : ''}`}
                onClick={() => setSelectedSurvey(s)}
              >
                <span className="surveys-list-title">{s.title}</span>
                <div className="surveys-list-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="surveys-icon-btn"
                    onClick={() => setEditSurveyOpen(s)}
                    aria-label="Редактировать"
                  >
                    <SvgIcon d={ICONS.edit} size={14} />
                  </button>
                  <button
                    className="surveys-icon-btn surveys-icon-btn--danger"
                    onClick={() => handleDeleteSurvey(s)}
                    aria-label="Удалить"
                  >
                    <SvgIcon d={ICONS.delete} size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="surveys-main">
          {selectedSurvey ? (
            <>
              <div className="surveys-main-header">
                <h3 className="surveys-main-title">{selectedSurvey.title}</h3>
                <span className="surveys-main-badge">{sortedQuestions.length} вопросов</span>
              </div>
              <p className="surveys-main-hint">Перетаскивайте вопросы для сортировки. Нажмите на стрелку, чтобы развернуть варианты ответов.</p>

              <div className="surveys-questions">
                {sortedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`surveys-question-block${dragQuestionId === q.id ? ' surveys-question-block--dragging' : ''}`}
                    draggable
                    onDragStart={() => setDragQuestionId(q.id)}
                    onDragOver={handleQuestionDragOver}
                    onDrop={() => handleQuestionDrop(q.id)}
                  >
                    <div className="surveys-question-header">
                      <button
                        className="surveys-question-drag-handle"
                        aria-label="Перетащить"
                      >
                        <SvgIcon d={ICONS.drag} size={16} />
                      </button>
                      <button
                        className={`surveys-question-toggle${expandedQuestions.has(q.id) ? ' surveys-question-toggle--expanded' : ''}`}
                        onClick={() => toggleQuestion(q.id)}
                      >
                        <SvgIcon d={ICONS.chevronDown} size={14} />
                      </button>
                      <span className="surveys-question-text">{q.text}</span>
                      <span className="surveys-question-type">{q.choiceType === 'single' ? 'Один вариант' : 'Несколько'}</span>
                      <div className="surveys-question-actions">
                        <button
                          className="surveys-icon-btn"
                          onClick={() => setEditQuestionOpen(q)}
                          aria-label="Редактировать"
                        >
                          <SvgIcon d={ICONS.edit} size={14} />
                        </button>
                        <button
                          className="surveys-icon-btn surveys-icon-btn--danger"
                          onClick={() => handleDeleteQuestion(q)}
                          aria-label="Удалить"
                        >
                          <SvgIcon d={ICONS.delete} size={14} />
                        </button>
                      </div>
                    </div>
                    {expandedQuestions.has(q.id) && (
                      <div className="surveys-options">
                        {q.options.map((o) => (
                          <div key={o.id} className="surveys-option-row">
                            <span className="surveys-option-text">{o.text}</span>
                            <button
                              className="surveys-icon-btn"
                              onClick={() => setEditOptionOpen({ q, o })}
                              aria-label="Редактировать"
                            >
                              <SvgIcon d={ICONS.edit} size={14} />
                            </button>
                            <button
                              className="surveys-icon-btn surveys-icon-btn--danger"
                              onClick={() => handleDeleteOption(q, o)}
                              aria-label="Удалить"
                            >
                              <SvgIcon d={ICONS.delete} size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="surveys-btn surveys-btn--ghost"
                          onClick={() => {
                            setAddOptionOpen(q)
                            setNewOptionText('')
                          }}
                        >
                          <SvgIcon d={ICONS.add} size={14} />
                          Добавить вариант
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="surveys-btn surveys-btn--primary"
                onClick={() => {
                  setAddQuestionOpen(true)
                  setNewQuestionText('')
                  setNewQuestionType('single')
                }}
              >
                <SvgIcon d={ICONS.add} size={16} />
                Добавить вопрос
              </button>
            </>
          ) : (
            <div className="surveys-empty">
              <div className="surveys-empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                  <path d="M9 12h6M12 9v6M9 5H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-4" />
                  <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p>Выберите опрос слева или создайте новый.</p>
            </div>
          )}
        </main>
      </div>

      <dialog ref={createDialogRef} className="surveys-dialog" onClick={(e) => {
        if (e.target === createDialogRef.current) setCreateOpen(false)
      }}>
        <div className="surveys-dialog-content">
          <div className="surveys-dialog-header">
            <h2 className="surveys-dialog-title">Новый опрос</h2>
            <button className="surveys-icon-btn" onClick={() => setCreateOpen(false)} aria-label="Закрыть">
              <SvgIcon d={ICONS.close} size={18} />
            </button>
          </div>
          <div className="surveys-dialog-body">
            <label className="surveys-label" htmlFor="new-survey-title">Название</label>
            <input
              id="new-survey-title"
              className="surveys-input"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Название опроса"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSurvey()}
            />
            <label className="surveys-checkbox">
              <input
                type="checkbox"
                checked={newShowTitle}
                onChange={(e) => setNewShowTitle(e.target.checked)}
              />
              <span>Отображать заголовок опроса</span>
            </label>
          </div>
          <div className="surveys-dialog-footer">
            <button className="surveys-btn" onClick={() => setCreateOpen(false)}>Отмена</button>
            <button
              className="surveys-btn surveys-btn--primary"
              onClick={handleCreateSurvey}
              disabled={creating || !newTitle.trim()}
            >
              {creating ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={editSurveyDialogRef} className="surveys-dialog" onClick={(e) => {
        if (e.target === editSurveyDialogRef.current) setEditSurveyOpen(null)
      }}>
        <div className="surveys-dialog-content">
          <div className="surveys-dialog-header">
            <h2 className="surveys-dialog-title">Редактировать опрос</h2>
            <button className="surveys-icon-btn" onClick={() => setEditSurveyOpen(null)} aria-label="Закрыть">
              <SvgIcon d={ICONS.close} size={18} />
            </button>
          </div>
          <div className="surveys-dialog-body">
            <label className="surveys-label" htmlFor="edit-survey-title">Название</label>
            <input
              id="edit-survey-title"
              className="surveys-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Название опроса"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateSurvey()}
            />
            <label className="surveys-checkbox">
              <input
                type="checkbox"
                checked={editShowTitle}
                onChange={(e) => setEditShowTitle(e.target.checked)}
              />
              <span>Отображать заголовок опроса</span>
            </label>
          </div>
          <div className="surveys-dialog-footer">
            <button className="surveys-btn" onClick={() => setEditSurveyOpen(null)}>Отмена</button>
            <button
              className="surveys-btn surveys-btn--primary"
              onClick={handleUpdateSurvey}
              disabled={updatingSurvey || !editTitle.trim()}
            >
              {updatingSurvey ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={addQuestionDialogRef} className="surveys-dialog" onClick={(e) => {
        if (e.target === addQuestionDialogRef.current) setAddQuestionOpen(false)
      }}>
        <div className="surveys-dialog-content">
          <div className="surveys-dialog-header">
            <h2 className="surveys-dialog-title">Новый вопрос</h2>
            <button className="surveys-icon-btn" onClick={() => setAddQuestionOpen(false)} aria-label="Закрыть">
              <SvgIcon d={ICONS.close} size={18} />
            </button>
          </div>
          <div className="surveys-dialog-body">
            <label className="surveys-label" htmlFor="new-question-text">Текст вопроса</label>
            <input
              id="new-question-text"
              className="surveys-input"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              placeholder="Вопрос"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateQuestion()}
            />
            <label className="surveys-label">Тип ответа</label>
            <div className="surveys-radio-group">
              <label className="surveys-radio">
                <input
                  type="radio"
                  name="newQuestionType"
                  value="single"
                  checked={newQuestionType === 'single'}
                  onChange={() => setNewQuestionType('single')}
                />
                <span>Выбрать один вариант</span>
              </label>
              <label className="surveys-radio">
                <input
                  type="radio"
                  name="newQuestionType"
                  value="multiple"
                  checked={newQuestionType === 'multiple'}
                  onChange={() => setNewQuestionType('multiple')}
                />
                <span>Отметить несколько вариантов</span>
              </label>
            </div>
          </div>
          <div className="surveys-dialog-footer">
            <button className="surveys-btn" onClick={() => setAddQuestionOpen(false)}>Отмена</button>
            <button
              className="surveys-btn surveys-btn--primary"
              onClick={handleCreateQuestion}
              disabled={creatingQuestion || !newQuestionText.trim()}
            >
              {creatingQuestion ? 'Создание…' : 'Добавить'}
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={editQuestionDialogRef} className="surveys-dialog" onClick={(e) => {
        if (e.target === editQuestionDialogRef.current) setEditQuestionOpen(null)
      }}>
        <div className="surveys-dialog-content">
          <div className="surveys-dialog-header">
            <h2 className="surveys-dialog-title">Редактировать вопрос</h2>
            <button className="surveys-icon-btn" onClick={() => setEditQuestionOpen(null)} aria-label="Закрыть">
              <SvgIcon d={ICONS.close} size={18} />
            </button>
          </div>
          <div className="surveys-dialog-body">
            <label className="surveys-label" htmlFor="edit-question-text">Текст вопроса</label>
            <input
              id="edit-question-text"
              className="surveys-input"
              value={editQuestionText}
              onChange={(e) => setEditQuestionText(e.target.value)}
              placeholder="Вопрос"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateQuestion()}
            />
            <label className="surveys-label">Тип ответа</label>
            <div className="surveys-radio-group">
              <label className="surveys-radio">
                <input
                  type="radio"
                  name="editQuestionType"
                  value="single"
                  checked={editQuestionType === 'single'}
                  onChange={() => setEditQuestionType('single')}
                />
                <span>Выбрать один вариант</span>
              </label>
              <label className="surveys-radio">
                <input
                  type="radio"
                  name="editQuestionType"
                  value="multiple"
                  checked={editQuestionType === 'multiple'}
                  onChange={() => setEditQuestionType('multiple')}
                />
                <span>Отметить несколько вариантов</span>
              </label>
            </div>
          </div>
          <div className="surveys-dialog-footer">
            <button className="surveys-btn" onClick={() => setEditQuestionOpen(null)}>Отмена</button>
            <button
              className="surveys-btn surveys-btn--primary"
              onClick={handleUpdateQuestion}
              disabled={updatingQuestion || !editQuestionText.trim()}
            >
              {updatingQuestion ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={addOptionDialogRef} className="surveys-dialog" onClick={(e) => {
        if (e.target === addOptionDialogRef.current) setAddOptionOpen(null)
      }}>
        <div className="surveys-dialog-content">
          <div className="surveys-dialog-header">
            <h2 className="surveys-dialog-title">Новый вариант ответа</h2>
            <button className="surveys-icon-btn" onClick={() => setAddOptionOpen(null)} aria-label="Закрыть">
              <SvgIcon d={ICONS.close} size={18} />
            </button>
          </div>
          <div className="surveys-dialog-body">
            <label className="surveys-label" htmlFor="new-option-text">Текст варианта</label>
            <input
              id="new-option-text"
              className="surveys-input"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="Вариант ответа"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateOption()}
            />
          </div>
          <div className="surveys-dialog-footer">
            <button className="surveys-btn" onClick={() => setAddOptionOpen(null)}>Отмена</button>
            <button
              className="surveys-btn surveys-btn--primary"
              onClick={handleCreateOption}
              disabled={creatingOption || !newOptionText.trim()}
            >
              {creatingOption ? 'Создание…' : 'Добавить'}
            </button>
          </div>
        </div>
      </dialog>

      <dialog ref={editOptionDialogRef} className="surveys-dialog" onClick={(e) => {
        if (e.target === editOptionDialogRef.current) setEditOptionOpen(null)
      }}>
        <div className="surveys-dialog-content">
          <div className="surveys-dialog-header">
            <h2 className="surveys-dialog-title">Редактировать вариант ответа</h2>
            <button className="surveys-icon-btn" onClick={() => setEditOptionOpen(null)} aria-label="Закрыть">
              <SvgIcon d={ICONS.close} size={18} />
            </button>
          </div>
          <div className="surveys-dialog-body">
            <label className="surveys-label" htmlFor="edit-option-text">Текст варианта</label>
            <input
              id="edit-option-text"
              className="surveys-input"
              value={editOptionText}
              onChange={(e) => setEditOptionText(e.target.value)}
              placeholder="Вариант ответа"
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateOption()}
            />
          </div>
          <div className="surveys-dialog-footer">
            <button className="surveys-btn" onClick={() => setEditOptionOpen(null)}>Отмена</button>
            <button
              className="surveys-btn surveys-btn--primary"
              onClick={handleUpdateOption}
              disabled={updatingOption || !editOptionText.trim()}
            >
              {updatingOption ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
