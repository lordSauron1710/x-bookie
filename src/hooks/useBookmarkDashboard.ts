import { useEffect, useMemo, useState } from 'react'

import type { BookmarkModelSuggestion, BookmarkRecord } from '../../shared/contracts.ts'
import { buildVelocitySeries, topSources } from '../lib/appView'
import { analyzeBookmarks, type InterestDefinition } from '../lib/bookmarks'

export type DashboardCategoryTile = {
  id: string
  label: string
  count: number
  interestId: string
  gradient: string
}

const gradients = [
  'radial-gradient(circle, rgba(255,59,48,0.8) 0%, rgba(255,59,48,0) 70%)',
  'radial-gradient(circle, rgba(0,122,255,0.8) 0%, rgba(0,122,255,0) 70%)',
  'radial-gradient(circle, rgba(255,204,0,0.8) 0%, rgba(255,204,0,0) 70%)',
  'radial-gradient(circle, rgba(52,199,89,0.8) 0%, rgba(52,199,89,0) 70%)',
  'radial-gradient(circle, rgba(175,82,222,0.8) 0%, rgba(175,82,222,0) 70%)',
  'radial-gradient(circle, rgba(90,200,250,0.8) 0%, rgba(90,200,250,0) 70%)',
]

type UseBookmarkDashboardOptions = {
  bookmarks: BookmarkRecord[]
  activeInterests: InterestDefinition[]
  overrides: Record<string, string>
  classificationSuggestions?: Record<string, BookmarkModelSuggestion>
  isAuthenticated: boolean
}

export function useBookmarkDashboard({
  bookmarks,
  activeInterests,
  overrides,
  classificationSuggestions = {},
  isAuthenticated,
}: UseBookmarkDashboardOptions) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState('all')
  const [activeType, setActiveType] = useState('All')
  const [activeSegment, setActiveSegment] = useState<'Week' | 'Month' | 'Year'>('Month')
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null)
  const [customInterest, setCustomInterest] = useState('')
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const analysis = useMemo(
    () => analyzeBookmarks(bookmarks, activeInterests, overrides, classificationSuggestions),
    [activeInterests, bookmarks, classificationSuggestions, overrides],
  )

  const effectiveCategoryId =
    activeCategoryId === 'all' || analysis.stats.some((stat) => stat.interestId === activeCategoryId)
      ? activeCategoryId
      : 'all'

  const contentTypeOptions = useMemo(
    () => ['All', ...Array.from(new Set(analysis.bookmarks.map((bookmark) => bookmark.contentType)))],
    [analysis.bookmarks],
  )

  const visibleBookmarks = useMemo(
    () =>
      analysis.bookmarks.filter((bookmark) => {
        const matchesCategory =
          effectiveCategoryId === 'all' ? true : bookmark.matchedInterestId === effectiveCategoryId
        const matchesType = activeType === 'All' ? true : bookmark.contentType === activeType
        const matchesSearch =
          !searchTerm ||
          `${bookmark.text} ${bookmark.author} ${bookmark.handle} ${bookmark.matchedInterestLabel}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())

        return matchesCategory && matchesType && matchesSearch
      }),
    [activeType, analysis.bookmarks, effectiveCategoryId, searchTerm],
  )

  const effectiveSelectedBookmarkId =
    selectedBookmarkId && visibleBookmarks.some((bookmark) => bookmark.id === selectedBookmarkId)
      ? selectedBookmarkId
      : (visibleBookmarks[0]?.id ?? null)

  const selectedBookmark = visibleBookmarks.find((bookmark) => bookmark.id === effectiveSelectedBookmarkId) ?? null
  const chartData = useMemo(() => buildVelocitySeries(analysis.bookmarks, activeSegment), [activeSegment, analysis.bookmarks])
  const sourceSummary = useMemo(() => topSources(analysis.bookmarks), [analysis.bookmarks])
  const isCompact = viewportWidth < 1024

  const categoryTiles: DashboardCategoryTile[] = [
    {
      id: 'all',
      label: 'All',
      count: analysis.bookmarks.length,
      interestId: 'review-later',
      gradient: gradients[5],
    },
    ...analysis.stats.map((stat, index) => ({
      id: stat.interestId,
      label: stat.label,
      count: stat.count,
      interestId: stat.interestId,
      gradient: gradients[index % gradients.length],
    })),
  ]

  const emptyStateMessage =
    bookmarks.length === 0
      ? isAuthenticated
        ? 'Sync bookmarks from X to start sorting your feed.'
        : 'Connect X to load your bookmarks.'
      : 'No bookmarks match the current filters. Change the category, content type, or search term.'
  const infoBarPrimary = analysis.bookmarks.length > 0 ? `${analysis.summary.categorized} auto-categorized` : 'No bookmarks loaded yet'
  const infoBarSecondary =
    analysis.bookmarks.length > 0 ? `${analysis.summary.topInterestLabel} is leading` : 'Connect and sync X to populate the feed'

  return {
    searchTerm,
    setSearchTerm,
    activeCategoryId: effectiveCategoryId,
    setActiveCategoryId,
    activeType,
    setActiveType,
    activeSegment,
    setActiveSegment,
    selectedBookmarkId: effectiveSelectedBookmarkId,
    setSelectedBookmarkId,
    customInterest,
    setCustomInterest,
    isCompact,
    analysis,
    chartData,
    sourceSummary,
    categoryTiles,
    contentTypeOptions,
    visibleBookmarks,
    selectedBookmark,
    emptyStateMessage,
    infoBarPrimary,
    infoBarSecondary,
    segments: ['Week', 'Month', 'Year'] as const,
  }
}
