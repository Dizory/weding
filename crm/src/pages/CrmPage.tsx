import { useState, useEffect } from 'react'
import {
  Tree,
  TreeItem,
  TreeItemLayout,
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
  Dropdown,
  Option,
  Textarea
} from '@fluentui/react-components'
import { Dismiss24Regular, Add24Regular, PersonAdd24Regular, Edit24Regular, Link24Regular } from '@fluentui/react-icons'
import { fetchInvitations, deleteInvitation, createInvitation, updateInvitation, addGuestToInvitation, fetchGuests } from '../api'
import { formatPhoneInput } from '../utils'
import { getInvitationLink } from '../utils'
import type { Invitation, InvitationGuest, GuestListItem } from '../types'
import './CrmPage.css'

const DEFAULT_BODY = '{greeting} {guests}!'

/** Слово обращения: 1 гость М→Дорогой, Ж→Дорогая; несколько→Дорогие */
function buildGreetingWord(guests: InvitationGuest[]): string {
  if (guests.length === 0) return 'Дорогие'
  if (guests.length === 1) return guests[0].gender === 'male' ? 'Дорогой' : 'Дорогая'
  return 'Дорогие'
}

/** Имена гостей: 0→гости, 1→имя, 2→А и Б, 3+→А, Б и В. Сначала М, затем Ж. */
function buildGuestNames(guests: InvitationGuest[]): string {
  if (guests.length === 0) return 'гости'
  const names = [...guests].sort((a, b) => (a.gender === 'male' ? 0 : 1) - (b.gender === 'male' ? 0 : 1)).map((g) => g.name)
  if (names.length === 1) return names[0]
  return names.length === 2 ? `${names[0]} и ${names[1]}` : names.slice(0, -1).join(', ') + ' и ' + names[names.length - 1]
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

  if (loading) {
    return (
      <div className="crm-page">
        <div className="crm-loading">
          <Spinner size="large" label="Загрузка..." />
        </div>
      </div>
    )
  }

  return (
    <div className="crm-page">
      <header className="crm-header">
        <h1>Приглашения</h1>
        <Button icon={<Add24Regular />} appearance="primary" onClick={() => setCreateOpen(true)}>
          Создать приглашение
        </Button>
      </header>

      <Dialog open={createOpen} onOpenChange={(_, data) => setCreateOpen(data.open)}>
        <DialogSurface>
            <DialogBody>
              <DialogTitle>Новое приглашение</DialogTitle>
              <DialogContent>
                <Label htmlFor="title">Заголовок</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(_, d) => setNewTitle(d.value)}
                  placeholder="Свадебное приглашение"
                />
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" icon={<Dismiss24Regular />} onClick={() => setCreateOpen(false)}>
                  Отмена
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || creating}
                >
                  {creating ? 'Создание...' : 'Создать'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
      </Dialog>

      <Dialog open={editInvOpen !== null} onOpenChange={(_, data) => !data.open && setEditInvOpen(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Редактировать приглашение</DialogTitle>
            <DialogContent className="crm-edit-inv-form">
              <Label htmlFor="editTitle">Заголовок</Label>
              <Input id="editTitle" value={editTitle} onChange={(_, d) => setEditTitle(d.value)} />
              <Label htmlFor="editGreetingWord">Слово обращения</Label>
              <Input
                id="editGreetingWord"
                value={editGreetingWord}
                onChange={(_, d) => setEditGreetingWord(d.value)}
                placeholder="Дорогой / Дорогая / Дорогие (пусто — авто)"
              />
              {!editGreetingWord.trim() && editInvOpen && editInvOpen.guests.length > 0 && (
                <span className="crm-greeting-preview">Авто: {buildGreetingWord(editInvOpen.guests)}</span>
              )}
              <Label htmlFor="editGuestNames">Имена гостей</Label>
              <Input
                id="editGuestNames"
                value={editGuestNames}
                onChange={(_, d) => setEditGuestNames(d.value)}
                placeholder="Иван и Мария (пусто — авто из списка)"
              />
              {!editGuestNames.trim() && editInvOpen && editInvOpen.guests.length > 0 && (
                <span className="crm-greeting-preview">Авто: {buildGuestNames(editInvOpen.guests)}</span>
              )}
              <Label htmlFor="editBodyTemplate">Текст приглашения</Label>
              <Textarea
                id="editBodyTemplate"
                value={editBodyTemplate}
                onChange={(_, d) => setEditBodyTemplate(d.value)}
                rows={6}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" icon={<Dismiss24Regular />} onClick={() => setEditInvOpen(null)}>Отмена</Button>
              <Button appearance="primary" onClick={handleEditInvitation} disabled={!editTitle.trim() || updatingInv}>
                {updatingInv ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={addGuestOpen !== null} onOpenChange={(_, data) => !data.open && setAddGuestOpen(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Добавить гостя</DialogTitle>
            <DialogContent className="crm-add-guest-form">
              <Label>Откуда добавить?</Label>
              <RadioGroup value={addGuestMode} onChange={(_, d) => setAddGuestMode(d.value as 'existing' | 'new')} layout="horizontal">
                <Radio value="existing" label="Выбрать из списка гостей" />
                <Radio value="new" label="Создать нового гостя" />
              </RadioGroup>
              {addGuestMode === 'existing' ? (
                <>
                  <Label htmlFor="guestSelect">Гость</Label>
                  <Dropdown
                    id="guestSelect"
                    placeholder="Выберите гостя"
                    value={allGuests.find((g) => String(g.id) === selectedGuestId)?.fullName ?? ''}
                    selectedOptions={selectedGuestId ? [selectedGuestId] : []}
                    onOptionSelect={(_, data) => setSelectedGuestId(data.optionValue ?? '')}
                  >
                    {allGuests.map((g) => (
                      <Option key={g.id} value={String(g.id)} text={g.phone ? `${g.fullName} · ${g.phone}` : g.fullName}>
                        {g.fullName}
                        {g.phone && ` · ${g.phone}`}
                      </Option>
                    ))}
                  </Dropdown>
                </>
              ) : (
                <>
                  <Label htmlFor="fullName">ФИО</Label>
                  <Input id="fullName" value={newGuestFullName} onChange={(_, d) => setNewGuestFullName(d.value)} placeholder="Иванов Иван Иванович" />
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" value={newGuestPhone} onChange={(_, d) => setNewGuestPhone(formatPhoneInput(d.value))} placeholder="+7 900 123-45-67" />
                  <Label>Пол</Label>
                  <RadioGroup value={newGuestGender} onChange={(_, d) => setNewGuestGender(d.value)} layout="horizontal">
                    <Radio value="male" label="М" />
                    <Radio value="female" label="Ж" />
                  </RadioGroup>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" icon={<Dismiss24Regular />} onClick={() => setAddGuestOpen(null)}>Отмена</Button>
              <Button
                appearance="primary"
                onClick={handleAddGuest}
                disabled={
                  addingGuest ||
                  (addGuestMode === 'existing' ? !selectedGuestId : !newGuestFullName.trim())
                }
              >
                {addingGuest ? 'Добавление...' : 'Добавить'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {successMessage && (
        <MessageBar intent="success" className="crm-message">
          <MessageBarBody>{successMessage}</MessageBarBody>
        </MessageBar>
      )}
      {error && (
        <MessageBar intent="error" className="crm-message">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className="crm-tree-container">
          {invitations.length === 0 ? (
            <p className="crm-empty">Нет приглашений.</p>
          ) : (
            <Tree aria-label="Список приглашений" appearance="subtle" size="medium">
              {invitations.map((inv) => (
                <TreeItem
                  key={inv.id}
                  itemType={inv.guests.length > 0 ? 'branch' : 'leaf'}
                  value={`inv-${inv.id}`}
                  className={inv.confirmedAt ? 'crm-inv--confirmed' : 'crm-inv--unconfirmed'}
                >
                  <TreeItemLayout
                    className={inv.confirmedAt ? 'crm-inv--confirmed' : 'crm-inv--unconfirmed'}
                    aside={
                      <span className="crm-inv-actions">
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<Link24Regular />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCopyLink(inv)
                          }}
                          aria-label="Копировать ссылку"
                          title={getInvitationLink(inv.slug)}
                        >
                          Ссылка
                        </Button>
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<Edit24Regular />}
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditInvOpen(inv)
                          }}
                          aria-label="Редактировать"
                        >
                          Изменить
                        </Button>
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={<PersonAdd24Regular />}
                          onClick={(e) => {
                            e.stopPropagation()
                            setAddGuestOpen(inv.id)
                          }}
                          aria-label="Добавить гостя"
                        >
                          Гость
                        </Button>
                        <Button
                          appearance="subtle"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(inv.id, inv.title)
                          }}
                          aria-label={`Удалить ${inv.title}`}
                        >
                          Удалить
                        </Button>
                      </span>
                    }
                  >
                    <div className="crm-inv-title-row">
                      <span>{inv.title}</span>
                      {inv.guests.length > 0 && (
                        <span className="crm-guest-count"> ({inv.guests.length})</span>
                      )}
                    </div>
                    <div className="crm-inv-link-row">
                      <span className="crm-inv-link" title="Нажмите, чтобы скопировать" onClick={(e) => { e.stopPropagation(); handleCopyLink(inv) }}>
                        {getInvitationLink(inv.slug)}
                      </span>
                    </div>
                  </TreeItemLayout>
                  {inv.guests.length > 0 && (
                    <Tree>
                      {inv.guests
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((g) => (
                          <TreeItem key={g.id} itemType="leaf" value={`guest-${g.id}`} className={inv.confirmedAt ? 'crm-guest--confirmed' : 'crm-guest--unconfirmed'}>
                            <TreeItemLayout className={inv.confirmedAt ? 'crm-guest--confirmed' : 'crm-guest--unconfirmed'}>
                              {g.name}
                              {g.phone && <span className="crm-guest-phone"> · {g.phone}</span>}
                            </TreeItemLayout>
                          </TreeItem>
                        ))}
                    </Tree>
                  )}
                  {(inv.surveyResponses?.length ?? 0) > 0 && (
                    <Tree>
                      <TreeItem itemType="branch" value={`inv-${inv.id}-responses`}>
                        <TreeItemLayout>Ответы на опросы</TreeItemLayout>
                        <Tree>
                          {(inv.surveyResponses ?? []).map((sr) => (
                            <TreeItem key={`${inv.id}-${sr.surveyId}-${sr.createdAt}`} itemType="leaf" value={`resp-${sr.surveyId}`}>
                              <TreeItemLayout>
                                <div className="crm-survey-responses">
                                  <div className="crm-survey-response-title">{sr.surveyTitle}</div>
                                  {sr.items.map((item, idx) => (
                                    <div key={idx} className="crm-survey-response-item">
                                      <span className="crm-survey-question">{item.questionText}:</span>{' '}
                                      <span className="crm-survey-answer">{item.selectedOptions.join(', ')}</span>
                                    </div>
                                  ))}
                                </div>
                              </TreeItemLayout>
                            </TreeItem>
                          ))}
                        </Tree>
                      </TreeItem>
                    </Tree>
                  )}
                </TreeItem>
              ))}
            </Tree>
          )}
      </div>
    </div>
  )
}
