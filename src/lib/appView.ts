import type { AnalyzedBookmark } from './bookmarks'

const avatarPalette = ['#FFE0D6', '#DDE8FF', '#E7F1D3', '#F9E6B6', '#EAD9FF', '#D7EEF2']

function hashSeed(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'BK'
}

export function avatarColor(name: string) {
  return avatarPalette[hashSeed(name) % avatarPalette.length]
}

export function relativeTime(value: string | null) {
  if (!value) return 'No date'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.valueOf())) return value

  const diffHours = Math.round((Date.now() - parsed.getTime()) / (1000 * 60 * 60))
  if (diffHours < 24) return `${Math.max(diffHours, 1)}h ago`
  if (diffHours < 24 * 7) return `${Math.round(diffHours / 24)}d ago`
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function topSources(bookmarks: AnalyzedBookmark[]) {
  const counts = new Map<string, { label: string; count: number }>()

  bookmarks.forEach((bookmark) => {
    const label = bookmark.handle ? `@${bookmark.handle}` : bookmark.author
    const entry = counts.get(label)
    if (entry) {
      entry.count += 1
      return
    }
    counts.set(label, { label, count: 1 })
  })

  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 4)
}

export function buildInsightCopy(bookmarks: AnalyzedBookmark[], topLabel: string, lane: string) {
  if (bookmarks.length === 0) {
    return 'Connect X and sync your bookmarks to see momentum, source concentration, and next-action patterns.'
  }

  const datedCount = bookmarks.filter((bookmark) => bookmark.createdAt).length
  const cadenceNote =
    datedCount > 0
      ? `Most recent saves lean toward ${topLabel}.`
      : 'X returned limited timestamps, so cadence is estimated from the bookmark order.'

  return `${cadenceNote} The strongest next step right now is "${lane.toLowerCase()}".`
}

export function polylinePoints(values: number[], width = 300, height = 180, maxValue = 1) {
  if (values.length === 0) return ''
  const step = values.length > 1 ? width / (values.length - 1) : width
  return values
    .map((value, index) => {
      const x = Math.round(index * step)
      const y = Math.round(height - (value / Math.max(maxValue, 1)) * (height - 18))
      return `${x},${y}`
    })
    .join(' ')
}

export function buildVelocitySeries(bookmarks: AnalyzedBookmark[], segment: 'Week' | 'Month' | 'Year') {
  const bucketCount = segment === 'Week' ? 7 : segment === 'Month' ? 6 : 12
  const windowDays = segment === 'Week' ? 7 : segment === 'Month' ? 30 : 365
  const now = Date.now()
  const topIds = Array.from(
    new Set(
      bookmarks
        .map((bookmark) => bookmark.matchedInterestId)
        .filter((id) => id !== 'review-later'),
    ),
  ).slice(0, 3)

  const seriesMap = new Map<string, number[]>()
  topIds.forEach((id) => {
    seriesMap.set(id, Array(bucketCount).fill(0))
  })

  const withDates = bookmarks.filter((bookmark) => {
    if (!bookmark.createdAt) return false
    const parsed = new Date(bookmark.createdAt)
    return !Number.isNaN(parsed.valueOf())
  })

  if (withDates.length > 0) {
    withDates.forEach((bookmark) => {
      if (!seriesMap.has(bookmark.matchedInterestId)) return
      const parsed = new Date(bookmark.createdAt as string)
      const diffDays = (now - parsed.getTime()) / (1000 * 60 * 60 * 24)
      if (diffDays < 0 || diffDays > windowDays) return
      const bucket = Math.min(
        bucketCount - 1,
        Math.floor(((windowDays - diffDays) / windowDays) * bucketCount),
      )
      const series = seriesMap.get(bookmark.matchedInterestId)
      if (series) {
        series[Math.max(bucket, 0)] += 1
      }
    })
  }

  const hasValues = Array.from(seriesMap.values()).some((series) => series.some((value) => value > 0))

  if (!hasValues) {
    const fallback = bookmarks.filter((bookmark) => seriesMap.has(bookmark.matchedInterestId))
    fallback.forEach((bookmark, index) => {
      const bucket = Math.round((index / Math.max(fallback.length - 1, 1)) * (bucketCount - 1))
      const series = seriesMap.get(bookmark.matchedInterestId)
      if (series) {
        series[bucket] += 1
      }
    })
  }

  const maxValue = Math.max(
    1,
    ...Array.from(seriesMap.values()).flatMap((series) => series),
  )

  return {
    maxValue,
    topIds,
    seriesMap,
  }
}
