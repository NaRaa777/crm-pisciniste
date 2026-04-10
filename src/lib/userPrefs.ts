const KEY_NAME = 'crm-perso-user-name'
const KEY_EMAIL = 'crm-perso-user-email'

export function loadUserPrefs(defaultName: string): { name: string; email: string } {
  if (typeof window === 'undefined') return { name: defaultName, email: '' }
  try {
    const nameRaw = localStorage.getItem(KEY_NAME)
    const emailRaw = localStorage.getItem(KEY_EMAIL)
    return {
      name: nameRaw?.trim() ? nameRaw.trim() : defaultName,
      email: emailRaw?.trim() ?? '',
    }
  } catch {
    return { name: defaultName, email: '' }
  }
}

export function saveUserPrefs(profile: { name: string; email: string }) {
  try {
    localStorage.setItem(KEY_NAME, profile.name)
    localStorage.setItem(KEY_EMAIL, profile.email)
  } catch {
    /* ignore quota / private mode */
  }
}

export function initialsFromName(name: string, fallback: string): string {
  const t = name.trim()
  if (!t) return fallback.slice(0, 2).toUpperCase()
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]![0]
    const b = parts[parts.length - 1]![0]
    if (a && b) return `${a}${b}`.toUpperCase()
  }
  const w = parts[0] ?? t
  return w.length >= 2 ? w.slice(0, 2).toUpperCase() : `${w[0] ?? '?'}${w[0] ?? '?'}`.toUpperCase()
}

/** Initiales à partir d’une adresse e-mail (partie locale). */
export function initialsFromEmail(email: string): string {
  const e = email.trim()
  if (!e) return '?'
  const local = e.split('@')[0] ?? e
  const parts = local.split(/[._+-]+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]![0]
    const b = parts[1]![0]
    if (a && b) return `${a}${b}`.toUpperCase()
  }
  return local.length >= 2
    ? local.slice(0, 2).toUpperCase()
    : `${local[0] ?? '?'}${local[0] ?? '?'}`.toUpperCase()
}
