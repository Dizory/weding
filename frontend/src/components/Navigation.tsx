import { useState } from 'react'
import './Navigation.css'

const SECTIONS = [
  { id: 'glavnaya', label: 'Главная' },
  { id: 'palitra', label: 'Палитра' },
  { id: 'podtverzhdenie', label: 'Подтверждение' },
  { id: 'opros', label: 'Опрос' },
  { id: 'raspisanie', label: 'Место встречи' },
] as const

export function Navigation() {
  const [open, setOpen] = useState(false)

  const handleLinkClick = () => setOpen(false)

  return (
    <nav className="nav">
      <div className="nav__inner">
        <button
          type="button"
          className="nav__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
        >
          <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`} aria-hidden />
        </button>
        <div className={`nav__menu ${open ? 'nav__menu--open' : ''}`}>
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="nav__link"
              onClick={handleLinkClick}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
