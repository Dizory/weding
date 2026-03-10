import type { Invitation, InvitationGuest, GuestListItem, Survey, SurveyQuestion, SurveyQuestionOption } from './types'
import { getToken } from './auth'

const API = '/api'

function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...init, headers })
}

export async function fetchInvitations(): Promise<Invitation[]> {
  const res = await authFetch(`${API}/invitations`)
  if (!res.ok) throw new Error('Failed to fetch invitations')
  return res.json()
}

export async function createInvitation(data: {
  slug?: string | null
  title: string
  bodyTemplate: string
}): Promise<Invitation> {
  const res = await authFetch(`${API}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to create invitation')
  }
  return res.json()
}

export async function updateInvitation(id: number, data: {
  title: string
  bodyTemplate: string
  greetingWord?: string | null
  guestNames?: string | null
}): Promise<void> {
  const res = await authFetch(`${API}/invitations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update invitation')
}

export async function deleteInvitation(id: number): Promise<void> {
  const res = await authFetch(`${API}/invitations/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete invitation')
}

export async function fetchGuests(): Promise<GuestListItem[]> {
  const res = await authFetch(`${API}/guests`)
  if (!res.ok) throw new Error('Failed to fetch guests')
  return res.json()
}

export async function createGuest(data: {
  fullName: string
  phone?: string | null
  gender: string
}): Promise<GuestListItem> {
  const res = await authFetch(`${API}/guests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to create guest')
  }
  return res.json()
}

/** Добавить гостя в приглашение: либо существующего (guestId), либо нового (fullName, phone, gender) */
export async function addGuestToInvitation(
  invitationId: number,
  data:
    | { guestId: number; gender: string }
    | { fullName: string; phone?: string | null; gender: string }
): Promise<InvitationGuest> {
  const body = 'guestId' in data
    ? { guestId: data.guestId, fullName: null, phone: null, gender: data.gender }
    : { guestId: null, fullName: data.fullName.trim(), phone: data.phone ?? null, gender: data.gender }
  const res = await authFetch(`${API}/invitations/${invitationId}/guests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to add guest')
  }
  return res.json()
}

export async function removeGuestFromInvitation(invitationId: number, guestId: number): Promise<void> {
  const res = await authFetch(`${API}/invitations/${invitationId}/guests/${guestId}`, {
    method: 'DELETE'
  })
  if (!res.ok) throw new Error('Failed to remove guest')
}

export async function updateGuest(id: number, data: {
  fullName: string
  phone?: string | null
  gender: string
}): Promise<GuestListItem> {
  const res = await authFetch(`${API}/guests/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to update guest')
  }
  return res.json()
}

// Surveys
export async function fetchSurveys(): Promise<Survey[]> {
  const res = await authFetch(`${API}/surveys`)
  if (!res.ok) throw new Error('Failed to fetch surveys')
  return res.json()
}

export async function fetchSurvey(id: number): Promise<Survey> {
  const res = await authFetch(`${API}/surveys/${id}`)
  if (!res.ok) throw new Error('Failed to fetch survey')
  return res.json()
}

export async function createSurvey(data: { title: string; showTitle?: boolean }): Promise<Survey> {
  const res = await authFetch(`${API}/surveys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: data.title, showTitle: data.showTitle ?? false })
  })
  if (!res.ok) throw new Error('Failed to create survey')
  return res.json()
}

export async function updateSurvey(id: number, data: { title: string; showTitle: boolean }): Promise<void> {
  const res = await authFetch(`${API}/surveys/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update survey')
}

export async function deleteSurvey(id: number): Promise<void> {
  const res = await authFetch(`${API}/surveys/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete survey')
}

export async function createQuestion(surveyId: number, text: string, choiceType: 'single' | 'multiple'): Promise<SurveyQuestion> {
  const res = await authFetch(`${API}/surveys/${surveyId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, choiceType })
  })
  if (!res.ok) throw new Error('Failed to create question')
  return res.json()
}

export async function updateQuestion(surveyId: number, questionId: number, data: { text: string; choiceType: 'single' | 'multiple' }): Promise<void> {
  const res = await authFetch(`${API}/surveys/${surveyId}/questions/${questionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed to update question')
}

export async function deleteQuestion(surveyId: number, questionId: number): Promise<void> {
  const res = await authFetch(`${API}/surveys/${surveyId}/questions/${questionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete question')
}

export async function createOption(surveyId: number, questionId: number, text: string): Promise<SurveyQuestionOption> {
  const res = await authFetch(`${API}/surveys/${surveyId}/questions/${questionId}/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!res.ok) throw new Error('Failed to create option')
  return res.json()
}

export async function updateOption(surveyId: number, questionId: number, optionId: number, text: string): Promise<void> {
  const res = await authFetch(`${API}/surveys/${surveyId}/questions/${questionId}/options/${optionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!res.ok) throw new Error('Failed to update option')
}

export async function deleteOption(surveyId: number, questionId: number, optionId: number): Promise<void> {
  const res = await authFetch(`${API}/surveys/${surveyId}/questions/${questionId}/options/${optionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete option')
}

export interface Stats {
  totalGuests: number
  totalInvitations: number
  confirmedGuests: number
  totalGuestSlots: number
  declinedCount: number
  surveyAnswers: { surveyTitle: string; questions: { questionText: string; options: { optionText: string; count: number }[] }[] }[]
}

export async function fetchStats(): Promise<Stats> {
  const res = await authFetch(`${API}/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

// Auth — используется fetch без токена
export async function login(login: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: login.trim(), password })
  })
  if (!res.ok) {
    if (res.status === 401) throw new Error('Неверный логин или пароль')
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Ошибка входа')
  }
  return res.json()
}

export async function authMe(): Promise<{ login: string }> {
  const res = await authFetch(`${API}/auth/me`)
  if (!res.ok) throw new Error('Не авторизован')
  return res.json()
}

export async function updateMyCredentials(data: {
  currentPassword: string
  newLogin?: string
  newPassword?: string
}): Promise<{ login: string }> {
  const res = await authFetch(`${API}/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPassword: data.currentPassword,
      newLogin: data.newLogin ?? null,
      newPassword: data.newPassword ?? null
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Ошибка обновления')
  }
  return res.json()
}

// Administrators
export interface AdminItem {
  id: number
  login: string
  createdAt: string
}

export async function fetchAdmins(): Promise<AdminItem[]> {
  const res = await authFetch(`${API}/admins`)
  if (!res.ok) throw new Error('Failed to fetch admins')
  return res.json()
}

export async function createAdmin(login: string, password: string): Promise<AdminItem> {
  const res = await authFetch(`${API}/admins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: login.trim(), password })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to create admin')
  }
  return res.json()
}

export async function deleteAdmin(id: number): Promise<void> {
  const res = await authFetch(`${API}/admins/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete admin')
}
