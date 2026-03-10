import { useState, useEffect } from 'react'
import {
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Input,
  Label,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHeaderCell
} from '@fluentui/react-components'
import { Add24Regular, Dismiss24Regular, Edit24Regular } from '@fluentui/react-icons'
import { fetchGuests, createGuest, updateGuest, fetchInvitations } from '../api'
import type { GuestListItem } from '../types'
import { formatPhoneInput } from '../utils'
import './GuestsPage.css'

export default function GuestsPage() {
  const [guests, setGuests] = useState<GuestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('male')
  const [creating, setCreating] = useState(false)
  const [editGuestOpen, setEditGuestOpen] = useState<GuestListItem | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editGender, setEditGender] = useState('male')
  const [updating, setUpdating] = useState(false)
  const [guestConfirmedById, setGuestConfirmedById] = useState<Set<number>>(new Set())

  useEffect(() => {
    Promise.all([fetchGuests(), fetchInvitations()])
      .then(([gList, invList]) => {
        setGuests(gList)
        const confirmed = new Set<number>()
        for (const inv of invList) {
          if (inv.confirmedAt) {
            for (const guest of inv.guests) confirmed.add(guest.id)
          }
        }
        setGuestConfirmedById(confirmed)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (editGuestOpen) {
      setEditFullName(editGuestOpen.fullName)
      setEditPhone(formatPhoneInput(editGuestOpen.phone ?? '') || (editGuestOpen.phone ?? ''))
      setEditGender(editGuestOpen.gender)
    }
  }, [editGuestOpen])

  const handleCreate = async () => {
    if (!fullName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const g = await createGuest({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        gender
      })
      setGuests((prev) => [...prev, g].sort((a, b) => a.fullName.localeCompare(b.fullName)))
      setCreateOpen(false)
      setFullName('')
      setPhone('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания')
    } finally {
      setCreating(false)
    }
  }

  const handleEditGuest = async () => {
    const g = editGuestOpen
    if (!g || !editFullName.trim()) return
    setUpdating(true)
    setError(null)
    try {
      const updated = await updateGuest(g.id, {
        fullName: editFullName.trim(),
        phone: editPhone.trim() || null,
        gender: editGender
      })
      setGuests((prev) =>
        prev.map((x) => (x.id === g.id ? updated : x)).sort((a, b) => a.fullName.localeCompare(b.fullName))
      )
      setEditGuestOpen(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="guests-page">
        <div className="guests-loading">
          <Spinner size="large" label="Загрузка..." />
        </div>
      </div>
    )
  }

  return (
    <div className="guests-page">
      <header className="guests-header">
        <h1>Гости</h1>
        <Dialog open={createOpen} onOpenChange={(_, data) => setCreateOpen(data.open)}>
          <DialogTrigger disableButtonEnhancement>
            <Button icon={<Add24Regular />} appearance="primary">
              Добавить гостя
            </Button>
          </DialogTrigger>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Новый гость</DialogTitle>
              <DialogContent className="guests-form">
                <Label htmlFor="fullName">ФИО</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(_, d) => setFullName(d.value)}
                  placeholder="Иванов Иван Иванович"
                  required
                />
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(_, d) => setPhone(formatPhoneInput(d.value))}
                  placeholder="+7 900 123-45-67"
                />
                <Label>Пол</Label>
                <RadioGroup value={gender} onChange={(_, d) => setGender(d.value)} layout="horizontal">
                  <Radio value="male" label="М" />
                  <Radio value="female" label="Ж" />
                </RadioGroup>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary" icon={<Dismiss24Regular />}>
                    Отмена
                  </Button>
                </DialogTrigger>
                <Button
                  appearance="primary"
                  onClick={handleCreate}
                  disabled={!fullName.trim() || creating}
                >
                  {creating ? 'Создание...' : 'Добавить'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        <Dialog open={editGuestOpen !== null} onOpenChange={(_, data) => !data.open && setEditGuestOpen(null)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Редактировать гостя</DialogTitle>
              <DialogContent className="guests-form">
                <Label htmlFor="editFullName">ФИО</Label>
                <Input id="editFullName" value={editFullName} onChange={(_, d) => setEditFullName(d.value)} placeholder="Иванов Иван Иванович" />
                <Label htmlFor="editPhone">Телефон</Label>
                <Input id="editPhone" value={editPhone} onChange={(_, d) => setEditPhone(formatPhoneInput(d.value))} placeholder="+7 900 123-45-67" />
                <Label>Пол</Label>
                <RadioGroup value={editGender} onChange={(_, d) => setEditGender(d.value)} layout="horizontal">
                  <Radio value="male" label="М" />
                  <Radio value="female" label="Ж" />
                </RadioGroup>
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" icon={<Dismiss24Regular />} onClick={() => setEditGuestOpen(null)}>Отмена</Button>
                <Button appearance="primary" onClick={handleEditGuest} disabled={!editFullName.trim() || updating}>
                  {updating ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </header>

      {error && (
        <MessageBar intent="error" className="guests-message">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <div className="guests-list">
        {guests.length === 0 ? (
          <p className="guests-empty">Нет гостей. Добавьте гостей в этом разделе, затем назначайте их приглашениям.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>ФИО</TableHeaderCell>
                <TableHeaderCell>Телефон</TableHeaderCell>
                <TableHeaderCell>Пол</TableHeaderCell>
                <TableHeaderCell></TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...guests]
                .sort((a, b) => a.fullName.localeCompare(b.fullName))
                .map((g) => (
                  <TableRow
                    key={g.id}
                    className={guestConfirmedById.has(g.id) ? 'guests-row--confirmed' : 'guests-row--unconfirmed'}
                  >
                    <TableCell>{g.fullName}</TableCell>
                    <TableCell>{g.phone ?? '—'}</TableCell>
                    <TableCell>{g.gender === 'male' ? 'М' : 'Ж'}</TableCell>
                    <TableCell>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Edit24Regular />}
                        onClick={() => setEditGuestOpen(g)}
                        aria-label="Редактировать"
                      />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
