/* @vitest-environment jsdom */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { BookmarkRecord, SessionResponse } from '../shared/contracts.ts'

const useBookmarkSourceMock = vi.fn()
const useInterestProfileMock = vi.fn()

vi.mock('./hooks/useBookmarkSource', () => ({
  useBookmarkSource: () => useBookmarkSourceMock(),
}))

vi.mock('./hooks/useInterestProfile', () => ({
  useInterestProfile: (scope: string) => useInterestProfileMock(scope),
}))

import App from './App'
import { starterInterests } from './lib/bookmarks'

function buildSession(overrides: Partial<SessionResponse> = {}): SessionResponse {
  return {
    authenticated: true,
    xAuthConfigured: true,
    account: {
      xUserId: 'u1',
      username: 'alice',
      name: 'Alice',
      profileImageUrl: null,
    },
    bookmarkCount: 2,
    lastSyncedAt: null,
    ...overrides,
  }
}

function buildBookmark(id: string, text: string): BookmarkRecord {
  return {
    id,
    text,
    author: 'Alice',
    handle: 'alice',
    url: `https://x.com/alice/status/${id}`,
    createdAt: '2026-01-01T00:00:00Z',
  }
}

describe('App integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.innerWidth = 1400
  })

  test('renders authenticated controls and supports search/filtering + override actions', async () => {
    const connectX = vi.fn()
    const syncFromX = vi.fn(async () => {})
    const signOut = vi.fn(async () => {})
    const setOverride = vi.fn()
    const clearOverride = vi.fn()

    useBookmarkSourceMock.mockReturnValue({
      bookmarks: [
        buildBookmark('b1', 'alpha launch planning'),
        buildBookmark('b2', 'market data and multiples'),
      ],
      session: buildSession(),
      statusMessage: 'Connected',
      isBootstrapping: false,
      isSyncing: false,
      connectX,
      refreshRemoteState: vi.fn(),
      signOut,
      syncFromX,
    })

    useInterestProfileMock.mockReturnValue({
      activeInterests: [starterInterests[0], starterInterests[1], starterInterests[2]],
      overrides: {},
      profileMessage: null,
      addCustomInterest: vi.fn(() => true),
      clearOverride,
      setOverride,
      toggleStarterInterest: vi.fn(),
    })

    render(React.createElement(App))

    const connectedButton = screen.getByRole('button', { name: /Connected @alice/i }) as HTMLButtonElement
    const syncButton = screen.getByRole('button', { name: /Sync now/i }) as HTMLButtonElement
    const signOutButton = screen.getByRole('button', { name: /Sign out/i }) as HTMLButtonElement

    expect(connectedButton.disabled).toBe(true)
    expect(syncButton.disabled).toBe(false)
    expect(signOutButton.disabled).toBe(false)

    fireEvent.click(syncButton)
    fireEvent.click(signOutButton)
    expect(syncFromX).toHaveBeenCalledTimes(1)
    expect(signOut).toHaveBeenCalledTimes(1)

    const search = screen.getByPlaceholderText(/Search bookmarks/i)
    fireEvent.change(search, { target: { value: 'market' } })
    await waitFor(() => {
      expect(screen.getByText('1 visible')).toBeTruthy()
    })

    const detailSelect = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(detailSelect, { target: { value: starterInterests[0].id } })
    expect(setOverride).toHaveBeenCalled()

    fireEvent.change(detailSelect, { target: { value: '__auto__' } })
    expect(clearOverride).toHaveBeenCalled()
  })

  test('clears custom interest input only when addCustomInterest succeeds', async () => {
    const addCustomInterest = vi
      .fn<(label: string) => boolean>()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)

    useBookmarkSourceMock.mockReturnValue({
      bookmarks: [buildBookmark('b1', 'alpha launch planning')],
      session: buildSession(),
      statusMessage: 'Connected',
      isBootstrapping: false,
      isSyncing: false,
      connectX: vi.fn(),
      refreshRemoteState: vi.fn(),
      signOut: vi.fn(async () => {}),
      syncFromX: vi.fn(async () => {}),
    })

    useInterestProfileMock.mockReturnValue({
      activeInterests: [starterInterests[0], starterInterests[1]],
      overrides: {},
      profileMessage: null,
      addCustomInterest,
      clearOverride: vi.fn(),
      setOverride: vi.fn(),
      toggleStarterInterest: vi.fn(),
    })

    render(React.createElement(App))

    const input = screen.getByPlaceholderText(/Add a custom interest/i) as HTMLInputElement
    const addButton = screen.getByRole('button', { name: /Add interest/i })

    fireEvent.change(input, { target: { value: 'Deep Work' } })
    fireEvent.click(addButton)
    await waitFor(() => {
      expect(input.value).toBe('')
    })

    fireEvent.change(input, { target: { value: 'Retry Label' } })
    fireEvent.click(addButton)
    await waitFor(() => {
      expect(input.value).toBe('Retry Label')
    })
  })
})
