/** Гость в приглашении (связь InvitationGuest) */
export interface InvitationGuest {
  id: number
  name: string
  phone?: string | null
  gender: string
  sortOrder: number
}

/** Гость в справочнике (самостоятельная сущность) */
export interface GuestListItem {
  id: number
  fullName: string
  phone?: string | null
  gender: string
}

export interface SurveyResponseItem {
  questionText: string
  selectedOptions: string[]
}

export interface SurveyResponse {
  surveyId: number
  surveyTitle: string
  createdAt: string
  items: SurveyResponseItem[]
}

export interface Invitation {
  id: number
  slug: string
  title: string
  bodyTemplate: string
  greetingWord?: string | null
  guestNames?: string | null
  createdAt: string
  confirmedAt?: string | null
  guests: InvitationGuest[]
  surveyResponses?: SurveyResponse[]
}

export interface SurveyQuestionOption {
  id: number
  text: string
  sortOrder: number
}

export interface SurveyQuestion {
  id: number
  text: string
  choiceType: 'single' | 'multiple'
  sortOrder: number
  options: SurveyQuestionOption[]
}

export interface Survey {
  id: number
  title: string
  showTitle: boolean
  createdAt: string
  questions: SurveyQuestion[]
}
