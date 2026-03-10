/** Base URL of invitation frontend. */
export function getInvitationBaseUrl(): string {
  const envBase = import.meta.env.VITE_INVITATION_BASE_URL
  if (envBase) {
    try {
      const parsed = new URL(envBase)
      if (!parsed.hostname.includes('crm')) return parsed.origin
    } catch {
      // ignore invalid URL
    }
  }

  const origin = window.location.origin
  if (origin.includes('crm-testaspire.dev.localhost')) {
    return origin.replace('crm-testaspire', 'server-testaspire')
  }
  if (origin.includes('testaspire.dev.localhost') && !origin.includes('server-testaspire')) {
    return origin.replace('testaspire.dev.localhost', 'server-testaspire.dev.localhost')
  }

  return origin
    .replace(/-crm/, '')
    .replace(/crm-/, '')
    .replace(/^https?:\/\/crm\./, 'https://')
}

export function getInvitationLink(slug: string): string {
  const base = getInvitationBaseUrl().replace(/\/$/, '')
  return `${base}/i/${encodeURIComponent(slug.trim())}`
}

/** Форматирует ввод телефона в вид +7 XXX XXX-XX-XX */
export function formatPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length > 1) digits = '7' + digits.slice(1)
  if (digits && !digits.startsWith('7')) digits = '7' + digits
  digits = digits.slice(0, 11)
  if (digits === '7' || digits === '') return ''
  const [_, a, b, c, d] = digits.match(/^7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/) ?? []
  let s = '+7'
  if (a) s += ' ' + a
  if (b) s += ' ' + b
  if (c) s += '-' + c
  if (d) s += '-' + d
  return s
}