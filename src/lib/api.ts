import type {
  ApiError,
  BookmarksResponse,
  SessionResponse,
  SyncBookmarksResponse,
} from '../../shared/contracts.ts'

const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/$/, '') ?? ''

function buildUrl(path: string) {
  return configuredOrigin ? `${configuredOrigin}${path}` : path
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...init,
  })

  const text = await response.text()
  const payload = text ? (JSON.parse(text) as ApiError | T) : null

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      payload.error &&
      typeof payload.error === 'object' &&
      'message' in payload.error &&
      typeof payload.error.message === 'string'
        ? payload.error.message
        : `Request failed with status ${response.status}.`
    throw new Error(message)
  }

  return payload as T
}

export async function fetchSession() {
  return requestJson<SessionResponse>('/api/session')
}

export async function fetchBookmarks() {
  return requestJson<BookmarksResponse>('/api/bookmarks')
}

export async function syncBookmarks() {
  return requestJson<SyncBookmarksResponse>('/api/bookmarks/sync', {
    method: 'POST',
  })
}

export async function logout() {
  await requestJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
}

export function startXLogin() {
  window.location.assign(buildUrl('/api/auth/x/start'))
}
