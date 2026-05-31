import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '../api'
import { setToken } from '../auth'
import './LoginPage.css'

const DEFAULT_LOGIN = import.meta.env.VITE_DEFAULT_ADMIN_LOGIN ?? ''

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState(DEFAULT_LOGIN)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/invitations'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await login(loginValue, password)
      setToken(token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-form__icon">
          <svg viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="var(--accent)" />
            <path d="M10 25V11l9 7-9 7zM19 25V11l9 7-9 7z" fill="#fff" opacity="0.92" />
          </svg>
        </div>
        <h1 className="login-form__title">Wedding CRM</h1>
        <p className="login-form__subtitle">Войдите в панель управления</p>
        {error && (
          <div className="login-form__error">{error}</div>
        )}
        <div className="field">
          <label htmlFor="login">Логин</label>
          <input
            id="login"
            type="text"
            value={loginValue}
            onChange={(e) => setLoginValue(e.target.value)}
            placeholder="Введите логин"
            autoComplete="username"
            disabled={loading}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль"
            autoComplete="current-password"
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn--primary login-form__submit">
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
