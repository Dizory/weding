import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FluentProvider, webLightTheme, Nav, NavItem, Button } from '@fluentui/react-components'
import { People24Regular, Mail24Regular, DocumentBulletList24Regular, DataPie24Regular, Person24Regular, SignOut24Regular } from '@fluentui/react-icons'
import CrmPage from './pages/CrmPage'
import GuestsPage from './pages/GuestsPage'
import SurveysPage from './pages/SurveysPage'
import StatsPage from './pages/StatsPage'
import AdminsPage from './pages/AdminsPage'
import LoginPage from './pages/LoginPage'
import { getToken, clearToken } from './auth'
import { getInvitationLink } from './utils'
import './App.css'

/** Защищённый маршрут — редирект на логин если нет токена */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

/** Страница /i/:slug в CRM — показываем, если зашли по ошибочной ссылке */
function RedirectToInvitation() {
  const { slug } = useParams<{ slug: string }>()
  const [targetUrl, setTargetUrl] = useState<string | null>(null)
  const [isSamePage, setIsSamePage] = useState(false)
  useEffect(() => {
    if (!slug) return
    const url = getInvitationLink(slug)
    setTargetUrl(url)
    try {
      const targetOrigin = new URL(url).origin
      if (targetOrigin === window.location.origin) {
        setIsSamePage(true)
      } else {
        window.location.replace(url)
      }
    } catch {
      setTargetUrl(url)
    }
  }, [slug])
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      {isSamePage ? (
        <>
          <p style={{ color: '#c00', marginBottom: '1rem' }}>
            Ошибка настройки: домен {window.location.hostname} показывает CRM вместо приглашений.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            В Coolify домен <strong>weding.zorin-server.ru</strong> должен быть привязан к контейнеру <strong>server</strong> (приглашения), а не к CRM.
          </p>
        </>
      ) : (
        <>
          <p>Перенаправление на приглашение…</p>
          {targetUrl && (
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#0078d4', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
              Перейти
            </a>
          )}
        </>
      )}
    </div>
  )
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const current =
    location.pathname === '/guests' ? 'guests' :
    location.pathname === '/surveys' ? 'surveys' :
    location.pathname === '/stats' ? 'stats' :
    location.pathname === '/admins' ? 'admins' : 'invitations'

  return (
    <div className="app-layout">
      <nav className="app-sidebar">
        <div className="app-sidebar__nav">
        <Nav
          selectedValue={current}
          onNavItemSelect={(_, data) => {
            const value = data.value as string
            if (value === 'guests') navigate('/guests')
            else if (value === 'surveys') navigate('/surveys')
            else if (value === 'stats') navigate('/stats')
            else if (value === 'admins') navigate('/admins')
            else navigate('/invitations')
          }}
        >
          <NavItem value="guests" icon={<People24Regular />}>
            Гости
          </NavItem>
          <NavItem value="invitations" icon={<Mail24Regular />}>
            Приглашения
          </NavItem>
          <NavItem value="surveys" icon={<DocumentBulletList24Regular />}>
            Опросы
          </NavItem>
          <NavItem value="stats" icon={<DataPie24Regular />}>
            Статистика
          </NavItem>
          <NavItem value="admins" icon={<Person24Regular />}>
            Администраторы
          </NavItem>
        </Nav>
        </div>
        <Button
          appearance="subtle"
          icon={<SignOut24Regular />}
          onClick={() => {
            clearToken()
            navigate('/login')
          }}
          style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
        >
          Выйти
        </Button>
      </nav>
      <main className="app-main">{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/invitations" replace />} />
          <Route path="/i/:slug" element={<RedirectToInvitation />} />
          <Route
            path="/guests"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <GuestsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invitations"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <CrmPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SurveysPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <StatsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admins"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </FluentProvider>
  )
}
