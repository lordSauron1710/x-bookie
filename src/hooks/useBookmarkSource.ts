import { useEffect, useState } from 'react'

import type { BookmarkRecord, SessionResponse } from '../../shared/contracts.ts'
import { fetchBookmarks, fetchSession, logout, startXLogin, syncBookmarks } from '../lib/api'

function readAuthSearchMessage() {
  const searchParams = new URLSearchParams(window.location.search)
  const authError = searchParams.get('authError')
  const authState = searchParams.get('auth')

  if (!authError && !authState) {
    return null
  }

  searchParams.delete('authError')
  searchParams.delete('auth')
  const nextQuery = searchParams.toString()
  const nextUrl = nextQuery ? `${window.location.pathname}?${nextQuery}` : window.location.pathname
  window.history.replaceState({}, '', nextUrl)

  if (authError) return authError
  if (authState === 'connected') return 'Connected to X. Sync your bookmarks to load the feed.'
  return null
}

export function useBookmarkSource() {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([])
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [statusMessage, setStatusMessage] = useState('Checking X connection...')
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  async function loadRemoteState(initialMessage: string | null = null) {
    setIsBootstrapping(true)

    try {
      const nextSession = await fetchSession()
      setSession(nextSession)

      if (!nextSession.xAuthConfigured) {
        setBookmarks([])
        setStatusMessage('Set the X server env vars before Connect X can run.')
        return
      }

      if (!nextSession.authenticated || !nextSession.account) {
        setBookmarks([])
        setStatusMessage(initialMessage ?? 'Connect X to load your live bookmarks.')
        return
      }

      if (nextSession.bookmarkCount === 0) {
        setBookmarks([])
        setStatusMessage(initialMessage ?? `Connected as @${nextSession.account.username}. Sync to load your bookmarks.`)
        return
      }

      const feed = await fetchBookmarks()
      setBookmarks(feed.items)
      setStatusMessage(
        initialMessage ??
          `Connected as @${nextSession.account.username}. ${feed.total} bookmarks are ready to sort.`,
      )
    } catch (error) {
      setBookmarks([])
      setStatusMessage(error instanceof Error ? error.message : 'The X backend could not be reached.')
    } finally {
      setIsBootstrapping(false)
    }
  }

  useEffect(() => {
    const authMessage = readAuthSearchMessage()
    void loadRemoteState(authMessage)
  }, [])

  async function syncFromX() {
    if (!session?.authenticated || !session.account) {
      setStatusMessage('Connect X before syncing bookmarks.')
      return
    }

    setIsSyncing(true)

    try {
      const result = await syncBookmarks()
      const feed = await fetchBookmarks()
      const nextSession = await fetchSession()

      setSession(nextSession)
      setBookmarks(feed.items)

      setStatusMessage(
        result.syncedCount > 0
          ? `Synced ${result.syncedCount} bookmarks from X.`
          : 'The sync completed, but X did not return any bookmarks.',
      )
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Bookmark sync failed.')
    } finally {
      setIsSyncing(false)
    }
  }

  async function signOut() {
    try {
      await logout()
      setSession({
        authenticated: false,
        xAuthConfigured: session?.xAuthConfigured ?? true,
        account: null,
        bookmarkCount: 0,
        lastSyncedAt: null,
      })
      setBookmarks([])
      setStatusMessage('Signed out of X.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Sign out failed.')
    }
  }

  return {
    bookmarks,
    session,
    statusMessage,
    isBootstrapping,
    isSyncing,
    connectX: startXLogin,
    refreshRemoteState: loadRemoteState,
    signOut,
    syncFromX,
  }
}
