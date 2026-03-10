import { useState, useEffect } from 'react'
import {
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Input,
  Label,
  Radio,
  RadioGroup,
  Checkbox
} from '@fluentui/react-components'
import {
  Add24Regular,
  Dismiss24Regular,
  Edit24Regular,
  Delete24Regular,
  ChevronDown24Regular,
  ChevronUp24Regular
} from '@fluentui/react-icons'
import {
  fetchSurveys,
  fetchSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createOption,
  updateOption,
  deleteOption
} from '../api'
import type { Survey, SurveyQuestion, SurveyQuestionOption } from '../types'
import './SurveysPage.css'

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

  if (loading) {
    return (
      <div className="surveys-page">
        <Spinner size="large" label="Загрузка…" />
      </div>
    )
  }

  return (
    <div className="surveys-page">
      {error && (
        <MessageBar intent="error" className="surveys-message">
          <MessageBarBody>{error}</MessageBarBody>
          <Button
            appearance="transparent"
            icon={<Dismiss24Regular />}
            onClick={() => setError(null)}
            aria-label="Закрыть"
          />
        </MessageBar>
      )}
      <div className="surveys-layout">
        <aside className="surveys-sidebar">
          <div className="surveys-sidebar-header">
            <h2>Опросы</h2>
            <Button
              appearance="primary"
              icon={<Add24Regular />}
              onClick={() => {
      setCreateOpen(true)
              setNewTitle('')
              setNewShowTitle(false)
              }}
            >
              Создать
            </Button>
          </div>
          <ul className="surveys-list">
            {surveys.map((s) => (
              <li
                key={s.id}
                className={`surveys-list-item ${selectedSurvey?.id === s.id ? 'selected' : ''}`}
                onClick={() => setSelectedSurvey(s)}
              >
                <span className="surveys-list-title">{s.title}</span>
                <div className="surveys-list-actions" onClick={(e) => e.stopPropagation()}>
                  <Button
                    appearance="subtle"
                    icon={<Edit24Regular />}
                    size="small"
                    onClick={() => setEditSurveyOpen(s)}
                    aria-label="Редактировать"
                  />
                  <Button
                    appearance="subtle"
                    icon={<Delete24Regular />}
                    size="small"
                    onClick={() => handleDeleteSurvey(s)}
                    aria-label="Удалить"
                  />
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <main className="surveys-main">
          {selectedSurvey ? (
            <>
              <h3 className="surveys-main-title">{selectedSurvey.title}</h3>
              <p className="surveys-main-hint">Вопросы и варианты ответов. Тип: один вариант (radio) или несколько (checkbox).</p>
              <div className="surveys-questions">
                {selectedSurvey.questions.map((q) => (
                  <div key={q.id} className="surveys-question-block">
                    <div className="surveys-question-header">
                      <Button
                        appearance="subtle"
                        icon={expandedQuestions.has(q.id) ? <ChevronUp24Regular /> : <ChevronDown24Regular />}
                        onClick={() => toggleQuestion(q.id)}
                        size="small"
                      />
                      <span className="surveys-question-text">{q.text}</span>
                      <span className="surveys-question-type">{q.choiceType === 'single' ? 'Один вариант' : 'Несколько вариантов'}</span>
                      <div className="surveys-question-actions">
                        <Button
                          appearance="subtle"
                          icon={<Edit24Regular />}
                          size="small"
                          onClick={() => setEditQuestionOpen(q)}
                          aria-label="Редактировать"
                        />
                        <Button
                          appearance="subtle"
                          icon={<Delete24Regular />}
                          size="small"
                          onClick={() => handleDeleteQuestion(q)}
                          aria-label="Удалить"
                        />
                      </div>
                    </div>
                    {expandedQuestions.has(q.id) && (
                      <div className="surveys-options">
                        {q.options.map((o) => (
                          <div key={o.id} className="surveys-option-row">
                            <span className="surveys-option-text">{o.text}</span>
                            <Button
                              appearance="subtle"
                              icon={<Edit24Regular />}
                              size="small"
                              onClick={() => setEditOptionOpen({ q, o })}
                              aria-label="Редактировать"
                            />
                            <Button
                              appearance="subtle"
                              icon={<Delete24Regular />}
                              size="small"
                              onClick={() => handleDeleteOption(q, o)}
                              aria-label="Удалить"
                            />
                          </div>
                        ))}
                        <Button
                          appearance="subtle"
                          icon={<Add24Regular />}
                          onClick={() => {
                            setAddOptionOpen(q)
                            setNewOptionText('')
                          }}
                        >
                          Добавить вариант
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={() => {
                  setAddQuestionOpen(true)
                  setNewQuestionText('')
                  setNewQuestionType('single')
                }}
              >
                Добавить вопрос
              </Button>
            </>
          ) : (
            <p className="surveys-empty">Выберите опрос слева или создайте новый.</p>
          )}
        </main>
      </div>

      {/* Create survey dialog */}
      <Dialog open={createOpen} onOpenChange={(_, d) => setCreateOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Новый опрос</DialogTitle>
            <DialogContent>
              <Label htmlFor="new-survey-title">Название</Label>
              <Input
                id="new-survey-title"
                value={newTitle}
                onChange={(_, d) => setNewTitle(d.value)}
                placeholder="Название опроса"
              />
              <Checkbox
                checked={newShowTitle}
                onChange={(_, d) => setNewShowTitle(d.checked === true)}
                label="Отображать заголовок опроса"
                style={{ marginTop: '0.75rem' }}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button appearance="primary" onClick={handleCreateSurvey} disabled={creating || !newTitle.trim()}>
                {creating ? 'Создание…' : 'Создать'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit survey dialog */}
      <Dialog open={!!editSurveyOpen} onOpenChange={(_, d) => !d.open && setEditSurveyOpen(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Редактировать опрос</DialogTitle>
            <DialogContent>
              <Label htmlFor="edit-survey-title">Название</Label>
              <Input
                id="edit-survey-title"
                value={editTitle}
                onChange={(_, d) => setEditTitle(d.value)}
                placeholder="Название опроса"
              />
              <Checkbox
                checked={editShowTitle}
                onChange={(_, d) => setEditShowTitle(d.checked === true)}
                label="Отображать заголовок опроса"
                style={{ marginTop: '0.75rem' }}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditSurveyOpen(null)}>Отмена</Button>
              <Button appearance="primary" onClick={handleUpdateSurvey} disabled={updatingSurvey || !editTitle.trim()}>
                {updatingSurvey ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Add question dialog */}
      <Dialog open={addQuestionOpen} onOpenChange={(_, d) => setAddQuestionOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Новый вопрос</DialogTitle>
            <DialogContent>
              <Label htmlFor="new-question-text">Текст вопроса</Label>
              <Input
                id="new-question-text"
                value={newQuestionText}
                onChange={(_, d) => setNewQuestionText(d.value)}
                placeholder="Вопрос"
              />
              <Label style={{ marginTop: '12px' }}>Тип ответа</Label>
              <RadioGroup
                value={newQuestionType}
                onChange={(_, d) => setNewQuestionType(d.value as 'single' | 'multiple')}
                layout="horizontal"
              >
                <Radio value="single" label="Выбрать один вариант" />
                <Radio value="multiple" label="Отметить несколько вариантов" />
              </RadioGroup>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setAddQuestionOpen(false)}>Отмена</Button>
              <Button appearance="primary" onClick={handleCreateQuestion} disabled={creatingQuestion || !newQuestionText.trim()}>
                {creatingQuestion ? 'Создание…' : 'Добавить'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit question dialog */}
      <Dialog open={!!editQuestionOpen} onOpenChange={(_, d) => !d.open && setEditQuestionOpen(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Редактировать вопрос</DialogTitle>
            <DialogContent>
              <Label htmlFor="edit-question-text">Текст вопроса</Label>
              <Input
                id="edit-question-text"
                value={editQuestionText}
                onChange={(_, d) => setEditQuestionText(d.value)}
                placeholder="Вопрос"
              />
              <Label style={{ marginTop: '12px' }}>Тип ответа</Label>
              <RadioGroup
                value={editQuestionType}
                onChange={(_, d) => setEditQuestionType(d.value as 'single' | 'multiple')}
                layout="horizontal"
              >
                <Radio value="single" label="Выбрать один вариант" />
                <Radio value="multiple" label="Отметить несколько вариантов" />
              </RadioGroup>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditQuestionOpen(null)}>Отмена</Button>
              <Button appearance="primary" onClick={handleUpdateQuestion} disabled={updatingQuestion || !editQuestionText.trim()}>
                {updatingQuestion ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Add option dialog */}
      <Dialog open={!!addOptionOpen} onOpenChange={(_, d) => !d.open && setAddOptionOpen(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Новый вариант ответа</DialogTitle>
            <DialogContent>
              <Label htmlFor="new-option-text">Текст варианта</Label>
              <Input
                id="new-option-text"
                value={newOptionText}
                onChange={(_, d) => setNewOptionText(d.value)}
                placeholder="Вариант ответа"
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setAddOptionOpen(null)}>Отмена</Button>
              <Button appearance="primary" onClick={handleCreateOption} disabled={creatingOption || !newOptionText.trim()}>
                {creatingOption ? 'Создание…' : 'Добавить'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit option dialog */}
      <Dialog open={!!editOptionOpen} onOpenChange={(_, d) => !d.open && setEditOptionOpen(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Редактировать вариант ответа</DialogTitle>
            <DialogContent>
              <Label htmlFor="edit-option-text">Текст варианта</Label>
              <Input
                id="edit-option-text"
                value={editOptionText}
                onChange={(_, d) => setEditOptionText(d.value)}
                placeholder="Вариант ответа"
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setEditOptionOpen(null)}>Отмена</Button>
              <Button appearance="primary" onClick={handleUpdateOption} disabled={updatingOption || !editOptionText.trim()}>
                {updatingOption ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
