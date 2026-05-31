import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import CrmPage from './pages/CrmPage'
import GuestsPage from './pages/GuestsPage'
import SurveysPage from './pages/SurveysPage'
import StatsPage from './pages/StatsPage'
import AdminsPage from './pages/AdminsPage'
import LoginPage from './pages/LoginPage'
import { getToken, clearToken } from './auth'
import './App.css'

const NAV_ITEMS = [
  { value: 'guests', label: 'Гости', icon: 'users' },
  { value: 'invitations', label: 'Приглашения', icon: 'mail' },
  { value: 'surveys', label: 'Опросы', icon: 'list' },
  { value: 'stats', label: 'Статистика', icon: 'chart' },
  { value: 'admins', label: 'Администраторы', icon: 'person' },
] as const

function SvgIcon({ name }: { name: string }) {
  switch (name) {
    case 'users':
      return <svg viewBox="0 0 16 16" fill="none"><path d="M5.5 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 10.5c0-1.5 2-2.5 5-2.5s5 1 5 2.5V12H3v-1.5z" fill="currentColor"/><path d="M10 3.5a2 2 0 1 1 0 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
    case 'mail':
      return <svg viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M1.5 4l6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
    case 'list':
      return <svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="3" rx="1" fill="currentColor" opacity=".8"/><rect x="2" y="6.5" width="12" height="3" rx="1" fill="currentColor" opacity=".8"/><rect x="2" y="11" width="12" height="3" rx="1" fill="currentColor" opacity=".8"/></svg>
    case 'chart':
      return <svg viewBox="0 0 16 16" fill="none"><rect x="2" y="7" width="3" height="6" rx=".5" fill="currentColor" opacity=".8"/><rect x="6.5" y="4" width="3" height="9" rx=".5" fill="currentColor" opacity=".8"/><rect x="11" y="2" width="3" height="11" rx=".5" fill="currentColor" opacity=".8"/></svg>
    case 'person':
      return <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><path d="M3 14c0-2.5 2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
    case 'logout':
      return <svg viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
    default:
      return null
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const current = NAV_ITEMS.find(i => location.pathname.startsWith(`/${i.value}`))?.value ?? 'invitations'

  return (
    <div className="app-layout">
      <nav className="app-sidebar">
        <div className="app-sidebar__logo">Wedding CRM</div>
        <div className="app-sidebar__nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.value}
              className={`app-sidebar__link ${current === item.value ? 'app-sidebar__link--active' : ''}`}
              onClick={() => navigate(`/${item.value}`)}
            >
              <SvgIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div className="app-sidebar__bottom">
          <button
            className="app-sidebar__link"
            onClick={() => { clearToken(); navigate('/login') }}
          >
            <SvgIcon name="logout" />
            <span>Выйти</span>
          </button>
        </div>
      </nav>
      <main className="app-main">
        <div className="app-main__content">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/invitations" replace />} />
        <Route path="/i/:slug" element={<Navigate to="/invitations" replace />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/guests" element={<GuestsPage />} />
                  <Route path="/invitations" element={<CrmPage />} />
                  <Route path="/surveys" element={<SurveysPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/admins" element={<AdminsPage />} />
                  <Route path="*" element={<Navigate to="/invitations" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
