import { useState, useEffect, useMemo } from 'react'
import { fetchGuests, createGuest, updateGuest, deleteGuest, fetchInvitations } from '../api'
import type { GuestListItem } from '../types'
import { formatPhoneInput, downloadCsv } from '../utils'
import './GuestsPage.css'

function SvgIcon({ name, size }: { name: string; size?: number }) {
  const s = size ?? 16
  switch (name) {
    case 'add':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    case 'close':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    case 'edit':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg>
    case 'trash':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M5 4v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" /></svg>
    case 'download':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2v9M4 7l4 4 4-4M3 13h10" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'search':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3" fill="none" /><path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" /></svg>
    case 'user':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none" /><path d="M3 14c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg>
    case 'check':
      return <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
    default:
      return null
  }
}

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
  const [searchQuery, setSearchQuery] = useState('')

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

  const filteredGuests = useMemo(() => {
    if (!searchQuery.trim()) return guests
    const q = searchQuery.toLowerCase().trim()
    return guests.filter(
      (g) =>
        g.fullName.toLowerCase().includes(q) ||
        (g.phone && g.phone.toLowerCase().includes(q))
    )
  }, [guests, searchQuery])

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

  const handleDeleteGuest = async (guest: GuestListItem) => {
    if (!confirm(`Удалить гостя «${guest.fullName}»? Гость также будет удалён из всех приглашений.`)) return
    try {
      await deleteGuest(guest.id)
      setGuests((prev) => prev.filter((g) => g.id !== guest.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  if (loading) {
    return (
      <div className="guests-page">
        <div className="guests-loading">
          <div className="guests-spinner" />
          <span className="guests-loading-text">Загрузка...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="guests-page">
      <header className="guests-header">
        <h1 className="guests-header__title">Гости</h1>
        <div className="guests-header__actions">
          <button
            className="guests-btn guests-btn--subtle"
            onClick={async () => {
              try {
                await downloadCsv('/api/export/guests', 'guests.csv')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Ошибка экспорта')
              }
            }}
          >
            <SvgIcon name="download" />
            Экспорт
          </button>
          <button className="guests-btn guests-btn--primary" onClick={() => setCreateOpen(true)}>
            <SvgIcon name="add" />
            Добавить гостя
          </button>
        </div>
      </header>

      <div className="guests-toolbar">
        <div className="guests-search">
          <SvgIcon name="search" size={14} />
          <input
            className="guests-search__input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или телефону..."
          />
          {searchQuery && (
            <button className="guests-search__clear" onClick={() => setSearchQuery('')}>
              <SvgIcon name="close" size={13} />
            </button>
          )}
        </div>
        <span className="guests-count">
          {filteredGuests.length} / {guests.length}
        </span>
      </div>

      {createOpen && (
        <div className="guests-overlay" onClick={() => setCreateOpen(false)}>
          <div className="guests-modal" onClick={(e) => e.stopPropagation()}>
            <div className="guests-modal__header">
              <h2 className="guests-modal__title">Новый гость</h2>
              <button className="guests-icon-btn" onClick={() => setCreateOpen(false)}><SvgIcon name="close" /></button>
            </div>
            <div className="guests-modal__body">
              <label className="guests-label" htmlFor="fullName">ФИО</label>
              <input
                className="guests-input"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван Иванович"
                required
              />
              <label className="guests-label" htmlFor="phone">Телефон</label>
              <input
                className="guests-input"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                placeholder="+7 900 123-45-67"
              />
              <label className="guests-label">Пол</label>
              <div className="guests-radio-group guests-radio-group--row">
                <label className="guests-radio">
                  <input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} />
                  <span className="guests-radio__dot" />
                  <span>М</span>
                </label>
                <label className="guests-radio">
                  <input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} />
                  <span className="guests-radio__dot" />
                  <span>Ж</span>
                </label>
              </div>
            </div>
            <div className="guests-modal__footer">
              <button className="guests-btn guests-btn--secondary" onClick={() => setCreateOpen(false)}>Отмена</button>
              <button className="guests-btn guests-btn--primary" onClick={handleCreate} disabled={!fullName.trim() || creating}>
                {creating ? 'Создание...' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editGuestOpen !== null && (
        <div className="guests-overlay" onClick={() => setEditGuestOpen(null)}>
          <div className="guests-modal" onClick={(e) => e.stopPropagation()}>
            <div className="guests-modal__header">
              <h2 className="guests-modal__title">Редактировать гостя</h2>
              <button className="guests-icon-btn" onClick={() => setEditGuestOpen(null)}><SvgIcon name="close" /></button>
            </div>
            <div className="guests-modal__body">
              <label className="guests-label" htmlFor="editFullName">ФИО</label>
              <input className="guests-input" id="editFullName" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
              <label className="guests-label" htmlFor="editPhone">Телефон</label>
              <input className="guests-input" id="editPhone" value={editPhone} onChange={(e) => setEditPhone(formatPhoneInput(e.target.value))} placeholder="+7 900 123-45-67" />
              <label className="guests-label">Пол</label>
              <div className="guests-radio-group guests-radio-group--row">
                <label className="guests-radio">
                  <input type="radio" name="editGender" value="male" checked={editGender === 'male'} onChange={() => setEditGender('male')} />
                  <span className="guests-radio__dot" />
                  <span>М</span>
                </label>
                <label className="guests-radio">
                  <input type="radio" name="editGender" value="female" checked={editGender === 'female'} onChange={() => setEditGender('female')} />
                  <span className="guests-radio__dot" />
                  <span>Ж</span>
                </label>
              </div>
            </div>
            <div className="guests-modal__footer">
              <button className="guests-btn guests-btn--secondary" onClick={() => setEditGuestOpen(null)}>Отмена</button>
              <button className="guests-btn guests-btn--primary" onClick={handleEditGuest} disabled={!editFullName.trim() || updating}>
                {updating ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="guests-alert guests-alert--error">
          <SvgIcon name="close" size={14} />
          <span>{error}</span>
          <button className="guests-icon-btn guests-alert__dismiss" onClick={() => setError(null)}>
            <SvgIcon name="close" size={12} />
          </button>
        </div>
      )}

      <div className="guests-table-wrap">
        {filteredGuests.length === 0 ? (
          <div className="guests-empty">
            <SvgIcon name="user" size={32} />
            {searchQuery ? (
              <p>Ничего не найдено по запросу «{searchQuery}».</p>
            ) : (
              <p>Нет гостей. Добавьте гостей в этом разделе, затем назначайте их приглашениям.</p>
            )}
          </div>
        ) : (
          <table className="guests-table">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Телефон</th>
                <th>Пол</th>
                <th className="guests-table__actions-col"></th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests
                .sort((a, b) => a.fullName.localeCompare(b.fullName))
                .map((g) => (
                  <tr
                    key={g.id}
                    className={guestConfirmedById.has(g.id) ? 'guests-row--confirmed' : 'guests-row--unconfirmed'}
                  >
                    <td className="guests-table__name">{g.fullName}</td>
                    <td className="guests-table__phone">{g.phone ?? '—'}</td>
                    <td>{g.gender === 'male' ? 'М' : 'Ж'}</td>
                    <td className="guests-table__actions">
                      <button className="guests-icon-btn guests-icon-btn--sm" onClick={() => setEditGuestOpen(g)} title="Редактировать">
                        <SvgIcon name="edit" size={14} />
                      </button>
                      <button className="guests-icon-btn guests-icon-btn--sm guests-icon-btn--danger" onClick={() => handleDeleteGuest(g)} title="Удалить">
                        <SvgIcon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
