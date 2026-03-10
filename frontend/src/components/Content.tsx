import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import vetkaNav from '../img/vetka_nav.svg'
import foto from '../img/foto.svg'
import vetka2 from '../img/vetka2.svg'
import vetka3 from '../img/vetka3.svg'
import qr from '../img/qr.png'
import { WeddingMap } from './WeddingMap'
import './Content.css'

const targetDate = new Date(2026, 5, 27, 16, 0, 0) // 27 июня 2026, 16:00

interface InvitationData {
  title: string
  greetingWord: string
  guestNames: string
  bodyWithGuests: string
  confirmedAt?: string | null
}

interface SurveyOption {
  id: number
  text: string
  sortOrder: number
}

interface SurveyQuestion {
  id: number
  text: string
  choiceType: 'single' | 'multiple'
  sortOrder: number
  options: SurveyOption[]
}

interface Survey {
  id: number
  title: string
  showTitle?: boolean
  createdAt: string
  questions: SurveyQuestion[]
}

const defaultTitle = 'Дмитрий и Ксения'
const defaultGreeting = 'Дорогие'
const defaultGuests = 'гости'
const defaultBodyTemplate = defaultGreeting + ' ' + defaultGuests + '!'

type AnswersState = Record<number, number[]> // questionId -> optionIds (for single: [one id], for multi: [id1, id2])

export function Content() {
  const { slug } = useParams<{ slug: string }>()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [confirmed, setConfirmed] = useState<boolean | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [timeLeft, setTimeLeft] = useState({ weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [answers, setAnswers] = useState<AnswersState>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!slug) {
      setInvitation(null)
      return
    }

    const controller = new AbortController()
    fetch(`/api/invitations/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status.toString()))))
      .then((data) => {
        if (controller.signal.aborted) return
        setInvitation({
          title: data.title ?? defaultTitle,
          greetingWord: data.greetingWord ?? defaultGreeting,
          guestNames: data.guestNames ?? defaultGuests,
          bodyWithGuests: data.bodyWithGuests ?? defaultBodyTemplate,
          confirmedAt: data.confirmedAt ?? null
        })
        setConfirmed(!!data.confirmedAt)
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        console.error('Failed to load invitation', error)
        setInvitation(null)
      })

    return () => controller.abort()
  }, [slug])

  useEffect(() => {
    fetch('/api/surveys')
      .then((r) => (r.ok ? r.json() : []))
      .then(setSurveys)
      .catch(() => setSurveys([]))
  }, [])

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft({ weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const msInWeek = 1000 * 60 * 60 * 24 * 7
      const msInDay = 1000 * 60 * 60 * 24
      const msInHour = 1000 * 60 * 60
      const msInMinute = 1000 * 60

      setTimeLeft({
        weeks: Math.floor(diff / msInWeek),
        days: Math.floor((diff % msInWeek) / msInDay),
        hours: Math.floor((diff % msInDay) / msInHour),
        minutes: Math.floor((diff % msInHour) / msInMinute),
        seconds: Math.floor((diff % msInMinute) / 1000),
      })
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="header" id="glavnaya">
      <img src={vetkaNav} alt="" className="header__img" />
      <div className="main_text">
        <p className="headertext">Дмитрий</p>
        <p className="headertext headertext--shift">и</p>
        <p className="headertext">Ксения</p>
      </div>
      <div className="date_block">
        <div className="date">
          <div className="date__cell date__cell--full">июнь</div>
          <div className="date__cell border_td">суббота</div>
          <div className="date__cell daily">27</div>
          <div className="date__cell border_td">16:00</div>
          <div className="date__cell date__cell--full">2026</div>
        </div>
        <div className="timer">
          <div className="timer__part">
            <span className="timer__value">{timeLeft.weeks}</span>
            <span className="timer__label">недель</span>
          </div>
          <div className="timer__part">
            <span className="timer__value">{timeLeft.days}</span>
            <span className="timer__label">дней</span>
          </div>
          <div className="timer__part">
            <span className="timer__value">{timeLeft.hours}</span>
            <span className="timer__label">часов</span>
          </div>
          <div className="timer__part">
            <span className="timer__value">{timeLeft.minutes}</span>
            <span className="timer__label">минут</span>
          </div>
          <div className="timer__part">
            <span className="timer__value">{timeLeft.seconds}</span>
            <span className="timer__label">секунд</span>
          </div>
        </div>
      </div>
      <div className="top__img-wrap" style={{ overflow: 'hidden' }}>
        <img src={vetkaNav} alt="" className="top__img" />
      </div>
      <div className="down__img-wrap" style={{ overflow: 'hidden' }}>
        <img src={vetkaNav} alt="" className="down__img" />
      </div>
      <div className="invite">
        <div className="personal_invite">
          <span className="greeting">{invitation?.greetingWord ?? 'Дорогие'}</span>
          <span className="guests">{invitation?.guestNames ?? 'гости'}</span>
        </div>
        <img src={vetka2} alt="" className="vetka2" />
        <div className="text_invite">
          <span>Мы будем очень счастливы видеть<br />
            Вас в этот важный и трогательный<br />
            для нас день.</span>
          <span>Очень хотим разделить эту<br />
            радость именно с Вами.</span>
          <img src={foto} alt="" className="foto" />
          <div className='final_text'>
            <span className='tab'>Примечание<br /></span>
            <span>
              Будем благодарны, если вы <br />
              воздержитесь от криков «Горько!» на <br />
              празднике.<br /><br />
            </span>
            <span>
            Ведь поцелуй — это знак выражения чувств <br />
            и не может быть по заказу.<br />
            </span>
          </div>
          <div className='final_text'>
            <span className='tab'>Подтверждение<br /></span>
            <span>
              Пожалуйста, подтвердите свое<br />
              присутствие до 01.06.2026 <br />
            </span>
          </div>
          <div className='final_text' id="palitra">
            <span>
              Будем благодарны, если при<br />
              выборе нарядов на наше<br />
              торжество вы придержитесь<br />
              следующей палитры<br />
            </span>
            <div className='palira'>
              <span className='palira__circle' />
              <span className='palira__circle' />
              <span className='palira__circle' />
              <span className='palira__circle' />
              <span className='palira__circle' />
            </div>
          </div>
        </div>
      </div>
      <img src={vetka3} alt="" className="vetka3" />
      <div id="podtverzhdenie">
      <button
        className={`confirm_button ${confirmed ? 'confirm_button--confirmed' : ''}`}
        disabled={!slug || confirming}
        onClick={async () => {
          if (!slug || confirming) return
          setConfirming(true)
          try {
            const method = confirmed ? 'DELETE' : 'POST'
            const res = await fetch(`/api/invitations/${encodeURIComponent(slug)}/confirm`, { method })
            if (res.ok) {
              setConfirmed(!confirmed)
            }
          } catch {
            /* ignore */
          } finally {
            setConfirming(false)
          }
        }}
      >
        <i className={`fa-solid ${confirmed ? 'fa-xmark' : 'fa-check'} confirm_button__icon`} aria-hidden="true" />
        <span>
          {confirming ? 'Отправка…' : confirmed ? 'Отменить согласие' : 'Подтвердить'}
        </span>
      </button>
      </div>
      <div className='callback'>
        <span className='text_callback'>
          Для связи с ведущей и<br />
          обсуждения деталей<br />
          присоединяйтесь к чату<br />
        </span>
        <span className='qr'>
          <img src={qr} alt="" className="qr" />
        </span>
      </div>
      <div className='questionnaire' id="opros">
        <div className='header_qw'>
          <div className='header_qw_text'>
            <span>Пожалуйста, ответьте на вопросы,</span>
            <span className='header_qw_text_line2'>которые мы для вас подготовили:</span>
          </div>
        </div>
        {surveys.map((survey) => (
          <form
            key={survey.id}
            className='questionnaire__survey'
            onSubmit={async (e) => {
              e.preventDefault()
              if (!slug || submitting) return
              const surveyAnswers = survey.questions
                .map((q) => ({
                  questionId: q.id,
                  optionIds: answers[q.id] ?? []
                }))
                .filter((a) => a.optionIds.length > 0)
              if (surveyAnswers.length === 0) return
              setSubmitting(true)
              try {
                const res = await fetch(`/api/invitations/${encodeURIComponent(slug)}/survey-responses`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ surveyId: survey.id, answers: surveyAnswers })
                })
                if (res.ok) setSubmitted(true)
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {survey.showTitle && <h4 className='questionnaire__title'>{survey.title}</h4>}
            {survey.questions.map((q) => (
              <div key={q.id} className='questionnaire__question'>
                <p className='questionnaire__question-text'>{q.text}</p>
                <div className='questionnaire__options' role={q.choiceType === 'single' ? 'radiogroup' : 'group'}>
                  {q.options.map((opt) =>
                    q.choiceType === 'single' ? (
                      <label key={opt.id} className='questionnaire__option'>
                        <input
                          type='radio'
                          name={`q-${q.id}`}
                          value={opt.id}
                          checked={(answers[q.id] ?? [])[0] === opt.id}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: [opt.id] }))}
                        />
                        <span>{opt.text}</span>
                      </label>
                    ) : (
                      <label key={opt.id} className='questionnaire__option'>
                        <input
                          type='checkbox'
                          name={`q-${q.id}`}
                          value={opt.id}
                          checked={(answers[q.id] ?? []).includes(opt.id)}
                          onChange={(e) => {
                            setAnswers((a) => {
                              const prev = a[q.id] ?? []
                              return {
                                ...a,
                                [q.id]: e.target.checked ? [...prev, opt.id] : prev.filter((id) => id !== opt.id)
                              }
                            })
                          }}
                        />
                        <span>{opt.text}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            ))}
            <button type='submit' className='questionnaire__submit' disabled={submitting || submitted}>
              {submitting ? 'Отправка…' : submitted ? 'Отправлено' : 'Отправить ответы'}
            </button>
          </form>
        ))}
      </div>
      <div className='text_invite' id="raspisanie">
        <div className='final_text'>
          <span className='tab'>Будем ждать вас</span>
          <table className='timetable'>
            <tbody>
              <tr>
                <td className='timetable__time'>16:00</td>
                <td className='timetable__description'>
                  <span className='timetable__place'>База отдыха «Ровесник»</span>
                  <span className='timetable__address'>д. Брод ул. Гагарина 50</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className='maps'>
        <WeddingMap />
      </div>
      <div className='copirate'>
        © Zorin Dmitry <a href="mailto:dmitry@anzorin.ru">dmitry@anzorin.ru</a>
      </div>
    </div>
  )
}
