import { useState, useEffect } from 'react'
import { Spinner, Card, CardHeader, CardPreview, MessageBar, MessageBarBody } from '@fluentui/react-components'
import { DataPie24Regular, People24Regular, Mail24Regular, DocumentBulletList24Regular } from '@fluentui/react-icons'
import { fetchStats, type Stats } from '../api'
import './StatsPage.css'

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
        <Spinner size="large" label="Загрузка…" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="stats-page">
        <MessageBar intent="error">
          <MessageBarBody>{error ?? 'Нет данных'}</MessageBarBody>
        </MessageBar>
      </div>
    )
  }

  return (
    <div className="stats-page">
      <h1 className="stats-title">Статистика</h1>
      <div className="stats-cards">
        <Card className="stats-card">
          <CardHeader
            header={
              <div className="stats-card-header">
                <People24Regular className="stats-card-icon" />
                <span>Всего гостей</span>
              </div>
            }
          />
          <CardPreview>
            <div className="stats-card-value">{stats.totalGuests}</div>
            <div className="stats-card-hint">уникальных в справочнике</div>
          </CardPreview>
        </Card>
        <Card className="stats-card">
          <CardHeader
            header={
              <div className="stats-card-header">
                <Mail24Regular className="stats-card-icon" />
                <span>Приглашения</span>
              </div>
            }
          />
          <CardPreview>
            <div className="stats-card-value">{stats.totalInvitations}</div>
            <div className="stats-card-hint">создано</div>
          </CardPreview>
        </Card>
        <Card className="stats-card">
          <CardHeader
            header={
              <div className="stats-card-header">
                <DataPie24Regular className="stats-card-icon" />
                <span>Подтверждения</span>
              </div>
            }
          />
          <CardPreview>
            <div className="stats-card-value">
              {stats.confirmedGuests} / {stats.totalGuestSlots}
            </div>
            <div className="stats-card-hint">
              подтвердили / всего мест
              {stats.declinedCount > 0 && (
                <span className="stats-declined"> · отказались: {stats.declinedCount}</span>
              )}
            </div>
          </CardPreview>
        </Card>
      </div>
      {stats.surveyAnswers.length > 0 && (
        <section className="stats-surveys">
          <h2 className="stats-section-title">
            <DocumentBulletList24Regular /> Ответы на опросы
          </h2>
          {stats.surveyAnswers.map((survey) => (
            <Card key={survey.surveyTitle} className="stats-survey-card">
              <CardHeader header={<h3 className="stats-survey-title">{survey.surveyTitle}</h3>} />
              <CardPreview>
                <div className="stats-survey-questions">
                  {survey.questions.map((q) => (
                    <div key={q.questionText} className="stats-question">
                      <div className="stats-question-text">{q.questionText}</div>
                      <ul className="stats-options-list">
                        {q.options.map((opt) => (
                          <li key={opt.optionText} className="stats-option">
                            <span className="stats-option-text">{opt.optionText}</span>
                            <span className="stats-option-count">{opt.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardPreview>
            </Card>
          ))}
        </section>
      )}
    </div>
  )
}
