import { useState, useEffect } from 'react'
import { fetchStats, type Stats } from '../api'
import { downloadCsv } from '../utils'
import './StatsPage.css'

const ICONS = {
  people: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  pie: 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  document: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
} as const

const SvgIcon = ({ d, size = 20, className }: { d: string; size?: number; className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

function getMaxCount(options: { count: number }[]): number {
  return Math.max(...options.map((o) => o.count), 1)
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="stats-page">
        <div className="stats-loading">
          <div className="stats-spinner" />
          <span>Загрузка…</span>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="stats-page">
        <div className="stats-message">{error ?? 'Нет данных'}</div>
      </div>
    )
  }

  const confirmedPercent = stats.totalGuestSlots > 0
    ? Math.round((stats.confirmedGuests / stats.totalGuestSlots) * 100)
    : 0

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1 className="stats-title">Статистика</h1>
        <div className="stats-export-actions">
          <button
            className="stats-btn"
            onClick={async () => {
              try { await downloadCsv('/api/export/guests', 'guests.csv') } catch { /* игнорируем */ }
            }}
          >
            <SvgIcon d={ICONS.download} size={14} />
            Гости CSV
          </button>
          <button
            className="stats-btn"
            onClick={async () => {
              try { await downloadCsv('/api/export/responses', 'responses.csv') } catch { /* игнорируем */ }
            }}
          >
            <SvgIcon d={ICONS.download} size={14} />
            Ответы CSV
          </button>
        </div>
      </div>

      <div className="stats-cards">
        <div className="stats-card">
          <div className="stats-card-header">
            <SvgIcon d={ICONS.people} size={14} className="stats-card-icon" />
            <span>Всего гостей</span>
          </div>
          <div className="stats-card-value">{stats.totalGuests}</div>
          <div className="stats-card-sub">уникальных в справочнике</div>
        </div>

        <div className="stats-card">
          <div className="stats-card-header">
            <SvgIcon d={ICONS.mail} size={14} className="stats-card-icon" />
            <span>Приглашения</span>
          </div>
          <div className="stats-card-value">{stats.totalInvitations}</div>
          <div className="stats-card-sub">создано</div>
        </div>

        <div className="stats-card">
          <div className="stats-card-header">
            <SvgIcon d={ICONS.pie} size={14} className="stats-card-icon" />
            <span>Подтверждения</span>
          </div>
          <div className="stats-card-value">
            {stats.confirmedGuests}<span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)' }}> / {stats.totalGuestSlots}</span>
          </div>
          <div className="stats-confirmed-ratio">
            <div className="stats-confirmed-bar">
              <div
                className="stats-confirmed-fill"
                style={{ width: `${confirmedPercent}%` }}
              />
            </div>
            <div className="stats-confirmed-labels">
              <span>Подтвердили: {stats.confirmedGuests}</span>
              <span>{confirmedPercent}%</span>
            </div>
          </div>
          <div className="stats-card-sub">
            {stats.declinedCount > 0 && (
              <span className="stats-card-sub--danger">Отказались: {stats.declinedCount}</span>
            )}
          </div>
        </div>
      </div>

      {stats.surveyAnswers.length > 0 && (
        <section className="stats-section">
          <h2 className="stats-section-title">
            <SvgIcon d={ICONS.document} size={18} />
            Ответы на опросы
          </h2>
          {stats.surveyAnswers.map((survey) => (
            <div key={survey.surveyTitle} className="stats-survey-card">
              <h3 className="stats-survey-title">{survey.surveyTitle}</h3>
              <div className="stats-survey-questions">
                {survey.questions.map((q) => {
                  const maxCount = getMaxCount(q.options)
                  return (
                    <div key={q.questionText} className="stats-question">
                      <div className="stats-question-text">{q.questionText}</div>
                      <ul className="stats-options-list">
                        {q.options.map((opt) => {
                          const barWidth = maxCount > 0 ? Math.round((opt.count / maxCount) * 100) : 0
                          return (
                            <li key={opt.optionText} className="stats-option">
                              <span className="stats-option-text">{opt.optionText}</span>
                              <div className="stats-option-bar-wrap">
                                <div className="stats-option-bar">
                                  <div
                                    className="stats-option-bar-fill"
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </div>
                              <span className="stats-option-count">{opt.count}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
