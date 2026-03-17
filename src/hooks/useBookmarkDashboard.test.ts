/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import { starterInterests } from '../lib/bookmarks'
import { useBookmarkDashboard } from './useBookmarkDashboard'

function buildBookmark(id: string, text: string) {
  return {
    id,
    text,
    author: 'Tester',
    handle: 'tester',
    url: `https://x.com/tester/status/${id}`,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('useBookmarkDashboard', () => {
  test('falls back to the first visible bookmark when filters hide the selected bookmark', () => {
    const bookmarks = [
      buildBookmark('alpha-1', 'alpha launch planning'),
      buildBookmark('beta-1', 'market multiples and investing notes'),
    ]

    const { result } = renderHook(() =>
      useBookmarkDashboard({
        bookmarks,
        activeInterests: [starterInterests[0], starterInterests[4]],
        overrides: {},
        isAuthenticated: true,
      }),
    )

    act(() => {
      result.current.setSelectedBookmarkId('beta-1')
      result.current.setSearchTerm('alpha')
    })

    expect(result.current.selectedBookmark?.id).toBe('alpha-1')
    expect(result.current.visibleBookmarks).toHaveLength(1)
  })

  test('incorporates model suggestions into the derived analysis', () => {
    const bookmark = buildBookmark('bookmark-1', 'launch planning for a new workflow')

    const { result } = renderHook(() =>
      useBookmarkDashboard({
        bookmarks: [bookmark],
        activeInterests: [starterInterests[0], starterInterests[3]],
        overrides: {},
        classificationSuggestions: {
          [bookmark.id]: {
            bookmarkId: bookmark.id,
            interestId: starterInterests[3].id,
            confidence: 0.9,
            signals: ['Launch planning'],
            contentType: 'Launch',
            actionLane: 'Build',
            reason: 'The model suggests this is a launch-focused bookmark.',
          },
        },
        isAuthenticated: true,
      }),
    )

    expect(result.current.analysis.bookmarks[0].matchedInterestId).toBe(starterInterests[3].id)
    expect(result.current.analysis.bookmarks[0].contentType).toBe('Launch')
  })
})
