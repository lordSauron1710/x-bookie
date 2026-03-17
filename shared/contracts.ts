export type BookmarkRecord = {
  id: string
  text: string
  author: string
  handle: string
  url: string
  createdAt: string | null
}

export type XAccountSummary = {
  xUserId: string
  username: string
  name: string
  profileImageUrl: string | null
}

export type SessionResponse = {
  authenticated: boolean
  xAuthConfigured: boolean
  account: XAccountSummary | null
  bookmarkCount: number
  lastSyncedAt: string | null
}

export type BookmarksResponse = {
  items: BookmarkRecord[]
  total: number
  lastSyncedAt: string | null
}

export type SyncBookmarksResponse = {
  syncedCount: number
  totalStored: number
  lastSyncedAt: string | null
}

export type ApiError = {
  error: {
    code: string
    message: string
  }
}
