import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  Input,
  Label,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Field,
  Divider
} from '@fluentui/react-components'
import { PersonDelete24Regular, PersonEdit24Regular } from '@fluentui/react-icons'
import { fetchAdmins, createAdmin, deleteAdmin, updateMyCredentials, authMe, type AdminItem } from '../api'
import { clearToken } from '../auth'
import './AdminsPage.css'

export default function AdminsPage() {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState<AdminItem[]>([])
  const [currentLogin, setCurrentLogin] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editCurrentPassword, setEditCurrentPassword] = useState('')
  const [editNewLogin, setEditNewLogin] = useState('')
  const [editNewPassword, setEditNewPassword] = useState('')
  const [updating, setUpdating] = useState(false)

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
      setCreateOpen(false)
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
    setEditOpen(true)
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
      setEditOpen(false)
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
      <div className="admins-page">
        <Spinner label="Загрузка…" />
      </div>
    )
  }

  return (
    <div className="admins-page">
      <div className="admins-page__header">
        <h1>Администраторы</h1>
        <Button appearance="primary" onClick={() => setCreateOpen(true)}>
          Добавить
        </Button>
      </div>
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      <div className="admins-page__list">
        {admins.length === 0 ? (
          <p className="admins-page__empty">Нет администраторов</p>
        ) : (
          admins.map((a) => (
            <div key={a.id} className="admins-page__item">
              <span className="admins-page__login">{a.login}</span>
              <span className="admins-page__date">
                {new Date(a.createdAt).toLocaleDateString('ru')}
              </span>
              <div className="admins-page__actions">
                {a.login === currentLogin && (
                  <Button
                    appearance="subtle"
                    icon={<PersonEdit24Regular />}
                    aria-label="Изменить учётные данные"
                    onClick={openEdit}
                  />
                )}
                {a.login !== currentLogin && (
                  <Button
                    appearance="subtle"
                    icon={<PersonDelete24Regular />}
                    aria-label="Удалить"
                    onClick={() => handleDelete(a.id)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={(_, d) => setEditOpen(d.open)}>
        <DialogSurface className="admins-edit-dialog">
          <DialogBody>
            <DialogTitle>
              Изменить учётные данные
              {currentLogin && (
                <span className="admins-edit-dialog__subtitle">Вход: {currentLogin}</span>
              )}
            </DialogTitle>
            <DialogContent className="admins-edit-dialog__content">
              <div className="admins-edit-dialog__section">
                <p className="admins-edit-dialog__section-title">Подтверждение</p>
                <Field
                  label="Текущий пароль"
                  hint="Введите текущий пароль для подтверждения"
                  required
                >
                  <Input
                    id="edit-current-password"
                    type="password"
                    value={editCurrentPassword}
                    onChange={(_, d) => setEditCurrentPassword(d.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </Field>
              </div>
              <Divider className="admins-edit-dialog__divider" />
              <div className="admins-edit-dialog__section">
                <p className="admins-edit-dialog__section-title">Новые данные</p>
                <p className="admins-edit-dialog__section-hint">Укажите новые значения. Пустые поля не изменятся.</p>
                <Field label="Новый логин" hint="Оставьте пустым или без изменений, чтобы не менять">
                  <Input
                    id="edit-new-login"
                    value={editNewLogin}
                    onChange={(_, d) => setEditNewLogin(d.value)}
                    placeholder={currentLogin ?? 'Логин'}
                    autoComplete="username"
                  />
                </Field>
                <Field label="Новый пароль" hint="Минимум 6 символов. Оставьте пустым, чтобы не менять">
                  <Input
                    id="edit-new-password"
                    type="password"
                    value={editNewPassword}
                    onChange={(_, d) => setEditNewPassword(d.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </DialogContent>
            <DialogActions className="admins-edit-dialog__actions">
              <Button appearance="secondary" onClick={() => setEditOpen(false)}>Отмена</Button>
              <Button
                appearance="primary"
                onClick={handleEdit}
                disabled={
                  updating ||
                  !editCurrentPassword ||
                  ((!editNewLogin.trim() || editNewLogin.trim() === currentLogin) && editNewPassword.length < 6)
                }
              >
                {updating ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(_, d) => setCreateOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Новый администратор</DialogTitle>
            <DialogContent>
              <Label htmlFor="new-admin-login">Логин</Label>
              <Input
                id="new-admin-login"
                value={newLogin}
                onChange={(_, d) => setNewLogin(d.value)}
                placeholder="Логин"
              />
              <Label htmlFor="new-admin-password">Пароль</Label>
              <Input
                id="new-admin-password"
                type="password"
                value={newPassword}
                onChange={(_, d) => setNewPassword(d.value)}
                placeholder="Пароль (мин. 6 символов)"
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button
                appearance="primary"
                onClick={handleCreate}
                disabled={creating || !newLogin.trim() || newPassword.length < 6}
              >
                {creating ? 'Создание…' : 'Создать'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  )
}
