import { useState, useEffect } from 'react'
import { fetchInvitations, deleteInvitation, createInvitation, updateInvitation, addGuestToInvitation, removeGuestFromInvitation, reorderGuests, fetchGuests } from '../api'
import { formatPhoneInput } from '../utils'
import { getInvitationLink, downloadCsv } from '../utils'
import type { Invitation, InvitationGuest, GuestListItem } from '../types'
import './CrmPage.css'

const DEFAULT_BODY = '{greeting} {guests}!'

function buildGreetingWord(guests: InvitationGuest[]): string {
  if (guests.length === 0) return 'Дорогие'
  if (guests.length === 1) return guests[0].gender === 'male' ? 'Дорогой' : 'Дорогая'
  return 'Дорогие'
}

function buildGuestNames(guests: InvitationGuest[]): string {
  if (guests.length === 0) return 'гости'
  const names = [...guests].sort((a, b) => (a.gender === 'male' ? 0 : 1) - (b.gender === 'male' ? 0 : 1)).map((g) => g.name)
  if (names.length === 1) return names[0]
  return names.length === 2 ? `${names[0]} и ${names[1]}` : names.slice(0, -1).join(', ') + ' и ' + names[names.length - 1]
}

function SvgIcon({ name, size }: { name: string; size?: number }) {
  const s = size ?? 16
  switch (name) {
    case 'add':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'close':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    case 'edit':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
    case 'link':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M6 10a3 3 0 0 0 4 0l3-3a3 3 0 0 0-4-4L8 4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/><path d="M10 6a3 3 0 0 0-4 0l-3 3a3 3 0 0 0 4 4l1-1" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
    case 'person':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><path d="M3 14c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
    case 'trash':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M5 4v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg>
    case 'download':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2v9M4 7l4 4 4-4M3 13h10" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'chevron':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'check':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'mail':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M1.5 4l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
    default:
      return null
  }
}

export default function CrmPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [addGuestOpen, setAddGuestOpen] = useState<number | null>(null)
  const [addGuestMode, setAddGuestMode] = useState<'existing' | 'new'>('existing')
  const [allGuests, setAllGuests] = useState<GuestListItem[]>([])
  const [selectedGuestId, setSelectedGuestId] = useState<string>('')
  const [newGuestFullName, setNewGuestFullName] = useState('')
  const [newGuestPhone, setNewGuestPhone] = useState('')
  const [newGuestGender, setNewGuestGender] = useState('male')
  const [addingGuest, setAddingGuest] = useState(false)
  const [editInvOpen, setEditInvOpen] = useState<Invitation | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBodyTemplate, setEditBodyTemplate] = useState('')
  const [editGreetingWord, setEditGreetingWord] = useState('')
  const [editGuestNames, setEditGuestNames] = useState('')
  const [updatingInv, setUpdatingInv] = useState(false)
  const [dragGuest, setDragGuest] = useState<{ invId: number; guestId: number } | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchInvitations()
      .then(setInvitations)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (addGuestOpen !== null) {
      fetchGuests()
        .then(setAllGuests)
        .catch(() => setAllGuests([]))
      setAddGuestMode('existing')
      setSelectedGuestId('')
      setNewGuestFullName('')
      setNewGuestPhone('')
      setNewGuestGender('male')
    }
  }, [addGuestOpen])

  useEffect(() => {
    if (editInvOpen) {
      setEditTitle(editInvOpen.title)
      setEditBodyTemplate(editInvOpen.bodyTemplate)
      setEditGreetingWord(editInvOpen.greetingWord ?? '')
      setEditGuestNames(editInvOpen.guestNames ?? '')
    }
  }, [editInvOpen])

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    setError(null)
    try {
      const inv = await createInvitation({
        title: newTitle.trim(),
        bodyTemplate: DEFAULT_BODY
      })
      setInvitations((prev) => [inv, ...prev])
      setCreateOpen(false)
      setNewTitle('')
      const link = getInvitationLink(inv.slug)
      setError(null)
      navigator.clipboard?.writeText(link)
      setSuccessMessage(`Создано. Ссылка скопирована: ${link}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (e) {
      setSuccessMessage(null)
      setError(e instanceof Error ? e.message : 'Ошибка создания')
    } finally {
      setCreating(false)
    }
  }

  const handleAddGuest = async () => {
    const invId = addGuestOpen
    if (!invId) return
    const isNew = addGuestMode === 'new'
    if (isNew && !newGuestFullName.trim()) return
    if (!isNew && !selectedGuestId) return
    setAddingGuest(true)
    setError(null)
    try {
      const guest = await addGuestToInvitation(
        invId,
        isNew
          ? { fullName: newGuestFullName.trim(), phone: newGuestPhone.trim() || null, gender: newGuestGender }
          : { guestId: Number(selectedGuestId), gender: allGuests.find((g) => String(g.id) === selectedGuestId)?.gender ?? 'male' }
      )
      setInvitations((prev) =>
        prev.map((i) =>
          i.id === invId ? { ...i, guests: [...i.guests, guest].sort((a, b) => a.sortOrder - b.sortOrder) } : i
        )
      )
      setAddGuestOpen(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка добавления гостя')
    } finally {
      setAddingGuest(false)
    }
  }

  const handleEditInvitation = async () => {
    const inv = editInvOpen
    if (!inv) return
    setUpdatingInv(true)
    setError(null)
    try {
      await updateInvitation(inv.id, {
        title: editTitle.trim(),
        bodyTemplate: editBodyTemplate,
        greetingWord: editGreetingWord.trim() || null,
        guestNames: editGuestNames.trim() || null
      })
      setInvitations((prev) =>
        prev.map((i) =>
          i.id === inv.id
            ? { ...i, title: editTitle.trim(), bodyTemplate: editBodyTemplate, greetingWord: editGreetingWord.trim() || null, guestNames: editGuestNames.trim() || null }
            : i
        )
      )
      setEditInvOpen(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setUpdatingInv(false)
    }
  }

  const handleCopyLink = (inv: Invitation) => {
    const link = getInvitationLink(inv.slug)
    navigator.clipboard?.writeText(link)
    setError(null)
    setSuccessMessage(`Ссылка скопирована: ${link}`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Удалить приглашение «${title}»?`)) return
    try {
      await deleteInvitation(id)
      setInvitations((prev) => prev.filter((i) => i.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const handleRemoveGuest = async (invId: number, guestId: number, guestName: string) => {
    if (!confirm(`Удалить гостя «${guestName}» из приглашения?`)) return
    try {
      await removeGuestFromInvitation(invId, guestId)
      setInvitations((prev) =>
        prev.map((i) =>
          i.id === invId
            ? { ...i, guests: i.guests.filter((g) => g.id !== guestId) }
            : i
        )
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления гостя')
    }
  }

  const handleGuestDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleGuestDrop = async (invId: number, targetGuestId: number) => {
    if (!dragGuest || dragGuest.invId !== invId || dragGuest.guestId === targetGuestId) {
      setDragGuest(null)
      return
    }
    const inv = invitations.find((i) => i.id === invId)
    if (!inv) { setDragGuest(null); return }
    const sorted = [...inv.guests].sort((a, b) => a.sortOrder - b.sortOrder)
    const fromIdx = sorted.findIndex((g) => g.id === dragGuest.guestId)
    const toIdx = sorted.findIndex((g) => g.id === targetGuestId)
    if (fromIdx === -1 || toIdx === -1) { setDragGuest(null); return }
    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const orders = reordered.map((g, idx) => ({ guestId: g.id, sortOrder: idx }))
    try {
      await reorderGuests(invId, orders)
      setInvitations((prev) =>
        prev.map((i) =>
          i.id === invId ? { ...i, guests: reordered } : i
        )
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сортировки')
    }
    setDragGuest(null)
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="crm-page">
        <div className="crm-loading">
          <div className="crm-spinner" />
          <span className="crm-loading-text">Загрузка...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="crm-page">
      <header className="crm-header">
        <h1 className="crm-header__title">Приглашения</h1>
        <div className="crm-header__actions">
          <button
            className="crm-btn crm-btn--subtle"
            onClick={async () => {
              try {
                await downloadCsv('/api/export/responses', 'responses.csv')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Ошибка экспорта')
              }
            }}
          >
            <SvgIcon name="download" />
            Экспорт ответов
          </button>
          <button className="crm-btn crm-btn--primary" onClick={() => setCreateOpen(true)}>
            <SvgIcon name="add" />
            Создать приглашение
          </button>
        </div>
      </header>

      {createOpen && (
        <div className="crm-overlay" onClick={() => setCreateOpen(false)}>
          <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal__header">
              <h2 className="crm-modal__title">Новое приглашение</h2>
              <button className="crm-icon-btn" onClick={() => setCreateOpen(false)}><SvgIcon name="close" /></button>
            </div>
            <div className="crm-modal__body">
              <label className="crm-label" htmlFor="title">Заголовок</label>
              <input
                className="crm-input"
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Свадебное приглашение"
              />
            </div>
            <div className="crm-modal__footer">
              <button className="crm-btn crm-btn--secondary" onClick={() => setCreateOpen(false)}>Отмена</button>
              <button className="crm-btn crm-btn--primary" onClick={handleCreate} disabled={!newTitle.trim() || creating}>
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editInvOpen !== null && (
        <div className="crm-overlay" onClick={() => setEditInvOpen(null)}>
          <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal__header">
              <h2 className="crm-modal__title">Редактировать приглашение</h2>
              <button className="crm-icon-btn" onClick={() => setEditInvOpen(null)}><SvgIcon name="close" /></button>
            </div>
            <div className="crm-modal__body crm-edit-form">
              <label className="crm-label" htmlFor="editTitle">Заголовок</label>
              <input className="crm-input" id="editTitle" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <label className="crm-label" htmlFor="editGreetingWord">Слово обращения</label>
              <input
                className="crm-input"
                id="editGreetingWord"
                value={editGreetingWord}
                onChange={(e) => setEditGreetingWord(e.target.value)}
                placeholder="Дорогой / Дорогая / Дорогие (пусто — авто)"
              />
              {!editGreetingWord.trim() && editInvOpen && editInvOpen.guests.length > 0 && (
                <span className="crm-preview">Авто: {buildGreetingWord(editInvOpen.guests)}</span>
              )}
              <label className="crm-label" htmlFor="editGuestNames">Имена гостей</label>
              <input
                className="crm-input"
                id="editGuestNames"
                value={editGuestNames}
                onChange={(e) => setEditGuestNames(e.target.value)}
                placeholder="Иван и Мария (пусто — авто из списка)"
              />
              {!editGuestNames.trim() && editInvOpen && editInvOpen.guests.length > 0 && (
                <span className="crm-preview">Авто: {buildGuestNames(editInvOpen.guests)}</span>
              )}
              <label className="crm-label" htmlFor="editBodyTemplate">Текст приглашения</label>
              <textarea
                className="crm-textarea"
                id="editBodyTemplate"
                value={editBodyTemplate}
                onChange={(e) => setEditBodyTemplate(e.target.value)}
                rows={6}
              />
            </div>
            <div className="crm-modal__footer">
              <button className="crm-btn crm-btn--secondary" onClick={() => setEditInvOpen(null)}>Отмена</button>
              <button className="crm-btn crm-btn--primary" onClick={handleEditInvitation} disabled={!editTitle.trim() || updatingInv}>
                {updatingInv ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {addGuestOpen !== null && (
        <div className="crm-overlay" onClick={() => setAddGuestOpen(null)}>
          <div className="crm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal__header">
              <h2 className="crm-modal__title">Добавить гостя</h2>
              <button className="crm-icon-btn" onClick={() => setAddGuestOpen(null)}><SvgIcon name="close" /></button>
            </div>
            <div className="crm-modal__body crm-add-guest-form">
              <label className="crm-label">Откуда добавить?</label>
              <div className="crm-radio-group">
                <label className="crm-radio">
                  <input
                    type="radio"
                    name="addGuestMode"
                    value="existing"
                    checked={addGuestMode === 'existing'}
                    onChange={() => setAddGuestMode('existing')}
                  />
                  <span className="crm-radio__dot" />
                  <span>Выбрать из списка гостей</span>
                </label>
                <label className="crm-radio">
                  <input
                    type="radio"
                    name="addGuestMode"
                    value="new"
                    checked={addGuestMode === 'new'}
                    onChange={() => setAddGuestMode('new')}
                  />
                  <span className="crm-radio__dot" />
                  <span>Создать нового гостя</span>
                </label>
              </div>
              {addGuestMode === 'existing' ? (
                <>
                  <label className="crm-label" htmlFor="guestSelect">Гость</label>
                  <select
                    className="crm-select"
                    id="guestSelect"
                    value={selectedGuestId}
                    onChange={(e) => setSelectedGuestId(e.target.value)}
                  >
                    <option value="">Выберите гостя</option>
                    {allGuests.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.fullName}{g.phone ? ` · ${g.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="crm-label" htmlFor="fullName">ФИО</label>
                  <input className="crm-input" id="fullName" value={newGuestFullName} onChange={(e) => setNewGuestFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
                  <label className="crm-label" htmlFor="phone">Телефон</label>
                  <input className="crm-input" id="phone" value={newGuestPhone} onChange={(e) => setNewGuestPhone(formatPhoneInput(e.target.value))} placeholder="+7 900 123-45-67" />
                  <label className="crm-label">Пол</label>
                  <div className="crm-radio-group crm-radio-group--row">
                    <label className="crm-radio">
                      <input type="radio" name="newGuestGender" value="male" checked={newGuestGender === 'male'} onChange={() => setNewGuestGender('male')} />
                      <span className="crm-radio__dot" />
                      <span>М</span>
                    </label>
                    <label className="crm-radio">
                      <input type="radio" name="newGuestGender" value="female" checked={newGuestGender === 'female'} onChange={() => setNewGuestGender('female')} />
                      <span className="crm-radio__dot" />
                      <span>Ж</span>
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="crm-modal__footer">
              <button className="crm-btn crm-btn--secondary" onClick={() => setAddGuestOpen(null)}>Отмена</button>
              <button
                className="crm-btn crm-btn--primary"
                onClick={handleAddGuest}
                disabled={
                  addingGuest ||
                  (addGuestMode === 'existing' ? !selectedGuestId : !newGuestFullName.trim())
                }
              >
                {addingGuest ? 'Добавление...' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="crm-alert crm-alert--success">
          <SvgIcon name="check" size={14} />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="crm-alert crm-alert--error">
          <SvgIcon name="close" size={14} />
          <span>{error}</span>
          <button className="crm-icon-btn crm-alert__dismiss" onClick={() => setError(null)}>
            <SvgIcon name="close" size={12} />
          </button>
        </div>
      )}

      <div className="crm-list">
        {invitations.length === 0 ? (
          <div className="crm-empty">
            <SvgIcon name="mail" size={32} />
            <p>Нет приглашений. Создайте первое приглашение, чтобы начать.</p>
          </div>
        ) : (
          invitations.map((inv) => {
            const isExpanded = expandedIds.has(inv.id)
            return (
              <div
                key={inv.id}
                className={`crm-card ${inv.confirmedAt ? 'crm-card--confirmed' : 'crm-card--pending'}`}
              >
                <div className="crm-card__header" onClick={() => toggleExpand(inv.id)}>
                  <span className={`crm-chevron ${isExpanded ? 'crm-chevron--open' : ''}`}>
                    <SvgIcon name="chevron" size={14} />
                  </span>
                  <div className="crm-card__info">
                    <div className="crm-card__title">
                      <span>{inv.title}</span>
                      {inv.guests.length > 0 && (
                        <span className="crm-badge">{inv.guests.length}</span>
                      )}
                    </div>
                    <span
                      className="crm-card__link"
                      title="Нажмите, чтобы скопировать"
                      onClick={(e) => { e.stopPropagation(); handleCopyLink(inv) }}
                    >
                      {getInvitationLink(inv.slug)}
                    </span>
                  </div>
                  <div className="crm-card__actions" onClick={(e) => e.stopPropagation()}>
                    <button className="crm-icon-btn" title="Копировать ссылку" onClick={() => handleCopyLink(inv)}>
                      <SvgIcon name="link" />
                    </button>
                    <button className="crm-icon-btn" title="Редактировать" onClick={() => setEditInvOpen(inv)}>
                      <SvgIcon name="edit" />
                    </button>
                    <button className="crm-icon-btn" title="Добавить гостя" onClick={() => setAddGuestOpen(inv.id)}>
                      <SvgIcon name="person" />
                    </button>
                    <button className="crm-icon-btn crm-icon-btn--danger" title="Удалить" onClick={() => handleDelete(inv.id, inv.title)}>
                      <SvgIcon name="trash" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="crm-card__body">
                    {inv.guests.length > 0 && (
                      <div className="crm-guests">
                        {inv.guests
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((g) => (
                            <div
                              key={g.id}
                              className={`crm-guest ${dragGuest?.guestId === g.id ? 'crm-guest--dragging' : ''}`}
                              draggable
                              onDragStart={() => setDragGuest({ invId: inv.id, guestId: g.id })}
                              onDragOver={handleGuestDragOver}
                              onDrop={() => handleGuestDrop(inv.id, g.id)}
                            >
                              <span className="crm-guest__grip">⠿</span>
                              <span className="crm-guest__name">{g.name}</span>
                              {g.phone && <span className="crm-guest__phone">{g.phone}</span>}
                              <button
                                className="crm-icon-btn crm-icon-btn--sm crm-icon-btn--danger"
                                onClick={() => handleRemoveGuest(inv.id, g.id, g.name)}
                                title="Удалить гостя"
                              >
                                <SvgIcon name="trash" size={13} />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                    {(inv.surveyResponses?.length ?? 0) > 0 && (
                      <div className="crm-surveys">
                        <div className="crm-surveys__title">Ответы на опросы</div>
                        {(inv.surveyResponses ?? []).map((sr) => (
                          <div key={`${inv.id}-${sr.surveyId}-${sr.createdAt}`} className="crm-survey">
                            <div className="crm-survey__title">{sr.surveyTitle}</div>
                            {sr.items.map((item, idx) => (
                              <div key={idx} className="crm-survey__item">
                                <span className="crm-survey__question">{item.questionText}:</span>
                                <span className="crm-survey__answer">{item.selectedOptions.join(', ')}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}

                    {inv.guests.length === 0 && (inv.surveyResponses?.length ?? 0) === 0 && (
                      <p className="crm-card__empty">Нет гостей. Нажмите «Добавить гостя».</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
