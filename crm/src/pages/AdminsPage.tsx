import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAdmins, createAdmin, deleteAdmin, updateMyCredentials, authMe, type AdminItem } from '../api'
import { clearToken } from '../auth'
import './AdminsPage.css'

export default function AdminsPage() {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState<AdminItem[]>([])
  const [currentLogin, setCurrentLogin] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const [editCurrentPassword, setEditCurrentPassword] = useState('')
  const [editNewLogin, setEditNewLogin] = useState('')
  const [editNewPassword, setEditNewPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  const createDialogRef = useRef<HTMLDialogElement>(null)
  const editDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    Promise.all([fetchAdmins(), authMe()])
      .then(([adminsList, me]) => {
        setAdmins(adminsList)
        setCurrentLogin(me.login)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newLogin.trim() || !newPassword) return
    setCreating(true)
    setError(null)
    try {
      const admin = await createAdmin(newLogin.trim(), newPassword)
      setAdmins((prev) => [...prev, admin])
      createDialogRef.current?.close()
      setNewLogin('')
      setNewPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить администратора?')) return
    try {
      await deleteAdmin(id)
      setAdmins((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  const openEdit = () => {
    setEditNewLogin(currentLogin ?? '')
    setEditNewPassword('')
    setEditCurrentPassword('')
    editDialogRef.current?.showModal()
  }

  const handleEdit = async () => {
    if (!editCurrentPassword) return
    const hasNewLogin = editNewLogin.trim() && editNewLogin.trim() !== currentLogin
    const hasNewPassword = editNewPassword.length >= 6
    if (!hasNewLogin && !hasNewPassword) return
    setUpdating(true)
    setError(null)
    try {
      const res = await updateMyCredentials({
        currentPassword: editCurrentPassword,
        newLogin: hasNewLogin ? editNewLogin.trim() : undefined,
        newPassword: hasNewPassword ? editNewPassword : undefined
      })
      editDialogRef.current?.close()
      setAdmins((prev) => prev.map((a) => (a.login === currentLogin ? { ...a, login: res.login } : a)))
      setCurrentLogin(res.login)
      if (hasNewLogin && res.login !== currentLogin) {
        clearToken()
        navigate('/login')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка обновления')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="admins-page admins-page--loading">
        <div className="spinner" />
        <p className="admins-page__loading-text">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="admins-page">
      <div className="admins-page__header">
        <h1>Администраторы</h1>
        <button className="btn btn--primary" onClick={() => createDialogRef.current?.showModal()}>
          <svg viewBox="0 0 16 16" fill="none" className="btn__icon">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Добавить
        </button>
      </div>

      {error && <div className="error-bar">{error}</div>}

      <div className="admins-page__list">
        {admins.length === 0 ? (
          <p className="admins-page__empty">Нет администраторов</p>
        ) : (
          admins.map((a) => (
            <div key={a.id} className="admin-card">
              <div className="admin-card__info">
                <div className="admin-card__avatar">
                  {a.login.charAt(0).toUpperCase()}
                </div>
                <div className="admin-card__details">
                  <span className="admin-card__login">{a.login}</span>
                  <span className="admin-card__date">
                    Создан {new Date(a.createdAt).toLocaleDateString('ru')}
                  </span>
                </div>
              </div>
              <div className="admin-card__actions">
                {a.login === currentLogin && (
                  <button
                    className="btn btn--ghost"
                    aria-label="Изменить учётные данные"
                    onClick={openEdit}
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="btn__icon">
                      <path d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
                {a.login !== currentLogin && (
                  <button
                    className="btn btn--ghost btn--danger"
                    aria-label="Удалить"
                    onClick={() => handleDelete(a.id)}
                  >
                    <svg viewBox="0 0 16 16" fill="none" className="btn__icon">
                      <path d="M4 5h8l-.7 8.5a1 1 0 01-1 .5H5.7a1 1 0 01-1-.5L4 5zM3 5h10M6 5V3a1 1 0 011-1h2a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <dialog
        ref={createDialogRef}
        className="modal"
        onClick={(e) => { if (e.target === createDialogRef.current) createDialogRef.current.close() }}
      >
        <div className="modal__content">
          <div className="modal__header">
            <h2 className="modal__title">Новый администратор</h2>
            <button className="modal__close" onClick={() => createDialogRef.current?.close()}>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="modal__body">
            <div className="field">
              <label htmlFor="new-admin-login">Логин</label>
              <input
                id="new-admin-login"
                type="text"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
                placeholder="Логин"
              />
            </div>
            <div className="field">
              <label htmlFor="new-admin-password">Пароль</label>
              <input
                id="new-admin-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Пароль (мин. 6 символов)"
              />
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn--secondary" onClick={() => createDialogRef.current?.close()}>Отмена</button>
            <button
              className="btn btn--primary"
              onClick={handleCreate}
              disabled={creating || !newLogin.trim() || newPassword.length < 6}
            >
              {creating ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={editDialogRef}
        className="modal"
        onClick={(e) => { if (e.target === editDialogRef.current) editDialogRef.current.close() }}
      >
        <div className="modal__content">
          <div className="modal__header">
            <h2 className="modal__title">Изменить учётные данные</h2>
            <button className="modal__close" onClick={() => editDialogRef.current?.close()}>
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {currentLogin && (
            <p className="modal__subtitle">Вход: {currentLogin}</p>
          )}
          <div className="modal__body">
            <div className="modal__section">
              <p className="modal__section-title">Подтверждение</p>
              <div className="field">
                <label htmlFor="edit-current-password">Текущий пароль</label>
                <input
                  id="edit-current-password"
                  type="password"
                  value={editCurrentPassword}
                  onChange={(e) => setEditCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <span className="field__hint">Введите текущий пароль для подтверждения</span>
              </div>
            </div>
            <hr className="modal__divider" />
            <div className="modal__section">
              <p className="modal__section-title">Новые данные</p>
              <p className="modal__section-hint">Укажите новые значения. Пустые поля не изменятся.</p>
              <div className="field">
                <label htmlFor="edit-new-login">Новый логин</label>
                <input
                  id="edit-new-login"
                  type="text"
                  value={editNewLogin}
                  onChange={(e) => setEditNewLogin(e.target.value)}
                  placeholder={currentLogin ?? 'Логин'}
                  autoComplete="username"
                />
                <span className="field__hint">Оставьте пустым или без изменений, чтобы не менять</span>
              </div>
              <div className="field">
                <label htmlFor="edit-new-password">Новый пароль</label>
                <input
                  id="edit-new-password"
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <span className="field__hint">Минимум 6 символов. Оставьте пустым, чтобы не менять</span>
              </div>
            </div>
          </div>
          <div className="modal__footer">
            <button className="btn btn--secondary" onClick={() => editDialogRef.current?.close()}>Отмена</button>
            <button
              className="btn btn--primary"
              onClick={handleEdit}
              disabled={
                updating ||
                !editCurrentPassword ||
                ((!editNewLogin.trim() || editNewLogin.trim() === currentLogin) && editNewPassword.length < 6)
              }
            >
              {updating ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
