import { describe, expect, test } from 'vitest'

import { analyzeBookmarks, createCustomInterest, type InterestDefinition } from './bookmarks'
import type { BookmarkRecord } from '../../shared/contracts.js'

function buildBookmark(partial: Partial<BookmarkRecord>, id = 'bookmark-1'): BookmarkRecord {
  return {
    id,
    author: partial.author ?? 'Tester',
    handle: partial.handle ?? 'tester',
    text: partial.text ?? '',
    url: partial.url ?? `https://x.com/tester/status/${id}`,
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00Z',
  }
}

const focusInterests: InterestDefinition[] = [
  {
    id: 'alpha',
    label: 'Alpha Interest',
    description: 'Questions about alpha',
    keywords: ['alpha', 'launch'],
    tint: '#123456',
  },
  {
    id: 'beta',
    label: 'Beta Interest',
    description: 'Questions about beta',
    keywords: ['beta', 'growth'],
    tint: '#654321',
  },
]

describe('analyzeBookmarks', () => {
  test('assigns the winning interest based on keyword hits', () => {
    const bookmark = buildBookmark({ text: 'Planning a launch for the new alpha tool' }, 'bookmark-alpha')
    const analysis = analyzeBookmarks([bookmark], focusInterests)

    expect(analysis.bookmarks).toHaveLength(1)
    expect(analysis.bookmarks[0].matchedInterestId).toBe('alpha')
    expect(analysis.bookmarks[0].signals).toContain('Alpha')
    expect(analysis.summary.categorized).toBe(1)
  })

  test('allows manual overrides to latch onto a different interest', () => {
    const bookmark = buildBookmark({ text: 'Tracking beta data' }, 'bookmark-beta')
    const overrides = { [bookmark.id]: 'alpha' }
    const analysis = analyzeBookmarks([bookmark], focusInterests, overrides)

    expect(analysis.bookmarks[0].matchedInterestId).toBe('alpha')
    expect(analysis.bookmarks[0].isManual).toBe(true)
    expect(analysis.bookmarks[0].confidence).toBeGreaterThan(0.9)
  })

  test('prefers model suggestions when provided', () => {
    const bookmark = buildBookmark({ text: 'Tracking beta data with launch notes' }, 'bookmark-model')
    const analysis = analyzeBookmarks(
      [bookmark],
      focusInterests,
      {},
      {
        [bookmark.id]: {
          bookmarkId: bookmark.id,
          interestId: 'beta',
          confidence: 0.88,
          signals: ['Market data', 'Multiples'],
          contentType: 'Market Note',
          actionLane: 'Track',
          reason: 'The bookmark is clearly about growth and market tracking.',
        },
      },
    )

    expect(analysis.bookmarks[0].matchedInterestId).toBe('beta')
    expect(analysis.bookmarks[0].contentType).toBe('Market Note')
    expect(analysis.bookmarks[0].actionLane).toBe('Track')
    expect(analysis.bookmarks[0].reason).toContain('clearly about growth')
  })
})

describe('createCustomInterest', () => {
  test('builds deduplicated keywords and lines up the slug', () => {
    const custom = createCustomInterest(' New Idea ')
    expect(custom).not.toBeNull()
    if (!custom) return

    expect(custom.id).toContain('new-idea')
    expect(custom.keywords).toContain('new idea')
    expect(custom.keywords.length).toBeGreaterThanOrEqual(2)
  })
})
