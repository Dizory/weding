import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Input, Label, Button, MessageBar, MessageBarBody } from '@fluentui/react-components'
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
        <h1 className="login-form__title">Вход в CRM</h1>
        {error && (
          <MessageBar intent="error" className="login-form__error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        <Label htmlFor="login">Логин</Label>
        <Input
          id="login"
          value={loginValue}
          onChange={(_, d) => setLoginValue(d.value)}
          placeholder="Логин"
          autoComplete="username"
          disabled={loading}
        />
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(_, d) => setPassword(d.value)}
          placeholder="Пароль"
          autoComplete="current-password"
          disabled={loading}
        />
        <Button appearance="primary" type="submit" disabled={loading} className="login-form__submit">
          {loading ? 'Вход…' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}
