import {
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
  type CSSProperties,
  type ReactNode,
} from 'react'
import './App.css'
import { useBookmarkSource } from './hooks/useBookmarkSource'
import { useInterestProfile } from './hooks/useInterestProfile'
import { analyzeBookmarks, starterInterests, type AnalyzedBookmark } from './lib/bookmarks'

const customStyles: Record<string, CSSProperties> = {
  appContainer: {
    display: 'grid',
    gridTemplateColumns: '320px minmax(0, 1fr) 380px',
    width: '100%',
    minHeight: '100vh',
    overflow: 'hidden',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: '#F4F3F0',
    color: '#000000',
    fontSize: '14px',
    WebkitFontSmoothing: 'antialiased',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #000000',
    minHeight: '100vh',
    overflowY: 'auto',
    backgroundColor: '#F4F3F0',
  },
  columnLast: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflowY: 'auto',
    backgroundColor: '#F4F3F0',
  },
  viewHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #000000',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    backgroundColor: '#F4F3F0',
    zIndex: 10,
  },
  viewTitle: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000000',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '20px 20px 12px',
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    padding: '0 20px 20px',
    borderBottom: '1px solid #D1D1D1',
  },
  categoryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    position: 'relative',
    textAlign: 'center',
  },
  abstractIcon: {
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  categoryLabel: {
    fontSize: '11px',
    color: '#888888',
    transition: 'color 0.2s ease',
  },
  categoryLabelActive: {
    fontSize: '11px',
    color: '#000000',
    fontWeight: 500,
  },
  categoryCount: {
    fontSize: '10px',
    color: '#888888',
  },
  iconBg: {
    position: 'absolute',
    width: '80px',
    height: '80px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: 1,
    filter: 'blur(12px)',
  },
  searchBar: {
    padding: '12px 20px',
    borderBottom: '1px solid #000000',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '14px',
    outline: 'none',
    color: '#000000',
  },
  infoBar: {
    padding: '10px 20px',
    borderBottom: '1px solid #D1D1D1',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center',
    color: '#666666',
    fontSize: '12px',
  },
  bookmarkList: {
    display: 'flex',
    flexDirection: 'column',
  },
  bookmarkItem: {
    display: 'flex',
    padding: '20px',
    borderBottom: '1px solid #000000',
    gap: '16px',
    color: 'inherit',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    transition: 'background-color 0.2s',
  },
  authorAvatar: {
    width: '48px',
    height: '48px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
    border: '1px solid #000000',
  },
  tweetContentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  tweetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '12px',
  },
  authorName: {
    fontWeight: 600,
    fontSize: '14px',
  },
  authorHandle: {
    color: '#888888',
    fontSize: '13px',
    marginLeft: '6px',
  },
  tweetMeta: {
    fontSize: '12px',
    color: '#888888',
  },
  tweetText: {
    fontSize: '14px',
    lineHeight: 1.5,
    color: '#000000',
  },
  tweetActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '2px',
  },
  actionStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#666666',
    border: '1px solid #000000',
    padding: '3px 8px',
    borderRadius: '999px',
  },
  itemTag: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: '1px solid #000000',
    marginTop: '2px',
  },
  analysisSection: {
    padding: '20px',
    borderBottom: '1px solid #000000',
  },
  segmentControl: {
    display: 'flex',
    border: '1px solid #000000',
    borderRadius: '20px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  segmentBtn: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '8px 0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    color: '#000000',
    cursor: 'pointer',
    borderRight: '1px solid #000000',
    transition: 'all 0.2s',
  },
  segmentBtnActive: {
    flex: 1,
    border: 'none',
    padding: '8px 0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    borderRight: '1px solid #000000',
    transition: 'all 0.2s',
    backgroundColor: '#000000',
    color: '#F4F3F0',
  },
  segmentBtnLast: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '8px 0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    color: '#000000',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  segmentBtnLastActive: {
    flex: 1,
    border: 'none',
    padding: '8px 0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#000000',
    color: '#F4F3F0',
  },
  chartContainer: {
    width: '100%',
    height: '200px',
    position: 'relative',
    marginBottom: '16px',
  },
  chartGrid: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  chartGridLine: {
    borderBottom: '1px dashed #888888',
    width: '100%',
  },
  chartSvg: {
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 2,
    overflow: 'visible',
  },
  insightText: {
    fontSize: '13px',
    lineHeight: 1.5,
    color: '#666666',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '0 20px 20px',
  },
  tagPill: {
    border: '1px solid #000000',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#000000',
  },
  tagPillActive: {
    border: '1px solid #000000',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    cursor: 'pointer',
    backgroundColor: '#000000',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: '#F4F3F0',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    padding: '0 20px 16px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: '1px solid #000000',
    backgroundColor: '#000000',
    color: '#F4F3F0',
    padding: '9px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  secondaryButton: {
    border: '1px solid #000000',
    backgroundColor: 'transparent',
    color: '#000000',
    padding: '9px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  hiddenInput: {
    display: 'none',
  },
  statusBox: {
    margin: '0 20px 16px',
    padding: '12px',
    border: '1px solid #000000',
    fontSize: '12px',
    lineHeight: 1.5,
    color: '#666666',
  },
  pasteArea: {
    margin: '0 20px 16px',
    width: 'calc(100% - 40px)',
    minHeight: '108px',
    border: '1px solid #000000',
    backgroundColor: 'transparent',
    padding: '12px',
    fontSize: '12px',
    resize: 'vertical',
    outline: 'none',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  compactInput: {
    margin: '0 20px 10px',
    width: 'calc(100% - 40px)',
    border: '1px solid #000000',
    backgroundColor: 'transparent',
    padding: '10px 12px',
    fontSize: '12px',
    outline: 'none',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  helperText: {
    fontSize: '12px',
    color: '#666666',
    padding: '0 20px 16px',
    lineHeight: 1.5,
  },
  detailCard: {
    border: '1px solid #000000',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  detailTitle: {
    fontSize: '13px',
    fontWeight: 600,
  },
  detailMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  detailLabel: {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#666666',
  },
  detailBody: {
    fontSize: '14px',
    lineHeight: 1.6,
  },
  detailSelect: {
    width: '100%',
    border: '1px solid #000000',
    backgroundColor: 'transparent',
    padding: '10px 12px',
    fontSize: '12px',
    outline: 'none',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  sourceList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sourceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px dashed #D1D1D1',
    paddingBottom: '8px',
  },
  sourceHandle: {
    fontWeight: 500,
    fontSize: '13px',
  },
  sourceCount: {
    color: '#888888',
    fontSize: '13px',
  },
  emptyState: {
    padding: '28px 20px',
    color: '#666666',
    fontSize: '13px',
    lineHeight: 1.6,
  },
}

const gradients = [
  'radial-gradient(circle, rgba(255,59,48,0.8) 0%, rgba(255,59,48,0) 70%)',
  'radial-gradient(circle, rgba(0,122,255,0.8) 0%, rgba(0,122,255,0) 70%)',
  'radial-gradient(circle, rgba(255,204,0,0.8) 0%, rgba(255,204,0,0) 70%)',
  'radial-gradient(circle, rgba(52,199,89,0.8) 0%, rgba(52,199,89,0) 70%)',
  'radial-gradient(circle, rgba(175,82,222,0.8) 0%, rgba(175,82,222,0) 70%)',
  'radial-gradient(circle, rgba(90,200,250,0.8) 0%, rgba(90,200,250,0) 70%)',
]

const avatarPalette = ['#FFE0D6', '#DDE8FF', '#E7F1D3', '#F9E6B6', '#EAD9FF', '#D7EEF2']

function TechIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: '40px', height: '40px', position: 'relative', zIndex: 2 }}>
      <path fill="#000000" d="M14,14 h12 v12 h-12 z" />
      <rect fill="#000000" x="4" y="4" width="6" height="6" />
      <rect fill="#000000" x="30" y="4" width="6" height="6" />
      <rect fill="#000000" x="4" y="30" width="6" height="6" />
      <rect fill="#000000" x="30" y="30" width="6" height="6" />
    </svg>
  )
}

function DesignIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: '40px', height: '40px', position: 'relative', zIndex: 2 }}>
      <line stroke="#000000" strokeWidth="2" strokeLinecap="square" fill="none" x1="20" y1="4" x2="20" y2="36" />
      <line stroke="#000000" strokeWidth="2" strokeLinecap="square" fill="none" x1="4" y1="20" x2="36" y2="20" />
      <line stroke="#000000" strokeWidth="2" strokeLinecap="square" fill="none" x1="8" y1="8" x2="32" y2="32" />
      <line stroke="#000000" strokeWidth="2" strokeLinecap="square" fill="none" x1="8" y1="32" x2="32" y2="8" />
    </svg>
  )
}

function ThreadIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: '40px', height: '40px', position: 'relative', zIndex: 2 }}>
      <polygon fill="#000000" points="20,4 36,20 20,36 4,20" />
      <polygon fill="#F4F3F0" points="20,12 28,20 20,28 12,20" />
    </svg>
  )
}

function NewsIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: '40px', height: '40px', position: 'relative', zIndex: 2 }}>
      <path stroke="#000000" strokeWidth="2" strokeLinecap="square" fill="none" d="M4,20 Q12,4 20,20 T36,20" />
      <path stroke="#000000" strokeWidth="2" strokeLinecap="square" fill="none" d="M4,30 Q12,14 20,30 T36,30" />
    </svg>
  )
}

function DataIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: '40px', height: '40px', position: 'relative', zIndex: 2 }}>
      <rect fill="#000000" x="4" y="16" width="6" height="24" />
      <rect fill="#000000" x="14" y="8" width="6" height="32" />
      <rect fill="#000000" x="24" y="20" width="6" height="20" />
      <rect fill="#000000" x="34" y="12" width="6" height="28" />
    </svg>
  )
}

function OtherIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: '40px', height: '40px', position: 'relative', zIndex: 2 }}>
      <circle stroke="#000000" strokeWidth="2" fill="none" cx="20" cy="20" r="16" strokeDasharray="4 4" />
      <circle fill="#000000" cx="20" cy="20" r="6" />
    </svg>
  )
}

function hashSeed(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'BK'
}

function avatarColor(name: string) {
  return avatarPalette[hashSeed(name) % avatarPalette.length]
}

function relativeTime(value: string | null) {
  if (!value) return 'No date'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.valueOf())) return value

  const diffHours = Math.round((Date.now() - parsed.getTime()) / (1000 * 60 * 60))
  if (diffHours < 24) return `${Math.max(diffHours, 1)}h ago`
  if (diffHours < 24 * 7) return `${Math.round(diffHours / 24)}d ago`
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`
}

function topSources(bookmarks: AnalyzedBookmark[]) {
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

function buildInsightCopy(bookmarks: AnalyzedBookmark[], topLabel: string, lane: string) {
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

function polylinePoints(values: number[], width = 300, height = 180, maxValue = 1) {
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

function buildVelocitySeries(bookmarks: AnalyzedBookmark[], segment: 'Week' | 'Month' | 'Year') {
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

function iconForInterest(interestId: string) {
  if (interestId.includes('ai') || interestId.includes('dev')) return <TechIcon />
  if (interestId.includes('design') || interestId.includes('product')) return <DesignIcon />
  if (interestId.includes('growth') || interestId.includes('writing')) return <ThreadIcon />
  if (interestId.includes('invest')) return <DataIcon />
  if (interestId.includes('review')) return <OtherIcon />
  return <NewsIcon />
}

type CategoryItemProps = {
  label: string
  count: number
  icon: ReactNode
  gradient: string
  isActive: boolean
  onClick: () => void
}

function CategoryItem({
  label,
  count,
  icon,
  gradient,
  isActive,
  onClick,
}: CategoryItemProps) {
  const [hovered, setHovered] = useState(false)
  const isHighlighted = isActive || hovered

  return (
    <div
      style={customStyles.categoryItem}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          ...customStyles.iconBg,
          background: gradient,
          opacity: isHighlighted ? 0.6 : 0,
        }}
      />
      <div style={customStyles.abstractIcon}>{icon}</div>
      <span style={isHighlighted ? customStyles.categoryLabelActive : customStyles.categoryLabel}>
        {label}
      </span>
      <span style={customStyles.categoryCount}>{count} saved</span>
    </div>
  )
}

type FilterPillProps = {
  label: string
  active: boolean
  onClick: () => void
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      style={{
        ...(active ? customStyles.tagPillActive : customStyles.tagPill),
        backgroundColor: active ? '#000000' : hovered ? 'rgba(0,0,0,0.05)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

type BookmarkItemProps = {
  bookmark: AnalyzedBookmark
  isSelected: boolean
  icon: ReactNode
  onClick: () => void
}

function BookmarkItem({ bookmark, isSelected, icon, onClick }: BookmarkItemProps) {
  const [hovered, setHovered] = useState(false)
  const excerpt =
    bookmark.text.length > 210 ? `${bookmark.text.slice(0, 210).trim()}...` : bookmark.text

  return (
    <div
      style={{
        ...customStyles.bookmarkItem,
        backgroundColor: isSelected ? 'rgba(0,0,0,0.05)' : hovered ? 'rgba(0,0,0,0.03)' : 'transparent',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          ...customStyles.authorAvatar,
          backgroundColor: avatarColor(bookmark.author),
        }}
      >
        {getInitials(bookmark.author)}
      </div>

      <div style={customStyles.tweetContentWrapper}>
        <div style={customStyles.tweetHeader}>
          <div>
            <span style={customStyles.authorName}>{bookmark.author}</span>
            <span style={customStyles.authorHandle}>
              {bookmark.handle ? `@${bookmark.handle}` : 'Imported'}
            </span>
          </div>
          <span style={customStyles.tweetMeta}>{relativeTime(bookmark.createdAt)}</span>
        </div>

        <div style={customStyles.tweetText}>{excerpt}</div>

        <div style={customStyles.tweetActions}>
          <span style={customStyles.actionStat}>{bookmark.matchedInterestLabel}</span>
          <span style={customStyles.actionStat}>{percent(bookmark.confidence)}</span>
          <span style={customStyles.actionStat}>{bookmark.actionLane}</span>
          <span style={customStyles.actionStat}>{bookmark.contentType}</span>
        </div>

        <div style={customStyles.itemTag}>{icon}</div>
      </div>
    </div>
  )
}

function App() {
  const { bookmarks, session, statusMessage, isBootstrapping, isSyncing, connectX, signOut, syncFromX } =
    useBookmarkSource()
  const storageScope = session?.account?.xUserId ?? 'anonymous'
  const { activeInterests, overrides, profileMessage, addCustomInterest, clearOverride, setOverride, toggleStarterInterest } =
    useInterestProfile(storageScope)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState('all')
  const [activeType, setActiveType] = useState('All')
  const [activeSegment, setActiveSegment] = useState<'Week' | 'Month' | 'Year'>('Month')
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<string | null>(null)
  const [customInterest, setCustomInterest] = useState('')
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const [isPending, startTransition] = useTransition()

  const deferredSearch = useDeferredValue(searchTerm)
  const analysis = analyzeBookmarks(bookmarks, activeInterests, overrides)
  const effectiveCategoryId =
    activeCategoryId === 'all' || analysis.stats.some((stat) => stat.interestId === activeCategoryId)
      ? activeCategoryId
      : 'all'

  const contentTypeOptions = ['All', ...Array.from(new Set(analysis.bookmarks.map((bookmark) => bookmark.contentType)))]

  const visibleBookmarks = analysis.bookmarks.filter((bookmark) => {
    const matchesCategory =
      effectiveCategoryId === 'all' ? true : bookmark.matchedInterestId === effectiveCategoryId
    const matchesType = activeType === 'All' ? true : bookmark.contentType === activeType
    const matchesSearch =
      !deferredSearch ||
      `${bookmark.text} ${bookmark.author} ${bookmark.handle} ${bookmark.matchedInterestLabel}`
        .toLowerCase()
        .includes(deferredSearch.toLowerCase())

    return matchesCategory && matchesType && matchesSearch
  })

  const effectiveSelectedBookmarkId =
    selectedBookmarkId && visibleBookmarks.some((bookmark) => bookmark.id === selectedBookmarkId)
      ? selectedBookmarkId
      : (visibleBookmarks[0]?.id ?? null)

  const selectedBookmark =
    visibleBookmarks.find((bookmark) => bookmark.id === effectiveSelectedBookmarkId) ?? null

  const chartData = buildVelocitySeries(analysis.bookmarks, activeSegment)
  const sourceSummary = topSources(analysis.bookmarks)
  const isCompact = viewportWidth < 1024

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleAddCustomInterest() {
    const pendingLabel = customInterest

    startTransition(() => {
      const added = addCustomInterest(pendingLabel)
      if (added) {
        setCustomInterest('')
      }
    })
  }

  const canConnectX = Boolean(session?.xAuthConfigured && !session?.authenticated && !isBootstrapping)
  const canSyncX = Boolean(session?.authenticated && session.account)
  const accountStatusCopy = !session?.xAuthConfigured
    ? 'Set the X server env vars before Connect X can run.'
    : session?.authenticated && session.account
      ? `Connected as @${session.account.username}. Syncing pulls the latest bookmarked posts from X into your app session store.`
      : 'Connect X to load your live bookmarks and replace the empty local shell.'

  const categoryTiles = [
    {
      id: 'all',
      label: 'All',
      count: analysis.bookmarks.length,
      icon: <OtherIcon />,
      gradient: gradients[5],
    },
    ...analysis.stats.map((stat, index) => ({
      id: stat.interestId,
      label: stat.label,
      count: stat.count,
      icon: iconForInterest(stat.interestId),
      gradient: gradients[index % gradients.length],
    })),
  ]

  const appContainerStyle: CSSProperties = {
    ...customStyles.appContainer,
    gridTemplateColumns: isCompact ? '1fr' : '320px minmax(0, 1fr) 380px',
    overflow: isCompact ? 'visible' : 'hidden',
  }

  const columnStyle: CSSProperties = {
    ...customStyles.column,
    borderRight: isCompact ? 'none' : '1px solid #000000',
    minHeight: isCompact ? 'auto' : '100vh',
    overflowY: isCompact ? 'visible' : 'auto',
  }

  const columnLastStyle: CSSProperties = {
    ...customStyles.columnLast,
    minHeight: isCompact ? 'auto' : '100vh',
    overflowY: isCompact ? 'visible' : 'auto',
    borderTop: isCompact ? '1px solid #000000' : 'none',
  }

  const segments: Array<'Week' | 'Month' | 'Year'> = ['Week', 'Month', 'Year']
  const emptyStateMessage =
    bookmarks.length === 0
      ? session?.authenticated
        ? 'Sync bookmarks from X to start sorting your feed.'
        : 'Connect X to load your bookmarks.'
      : 'No bookmarks match the current filters. Change the category, content type, or search term.'
  const infoBarPrimary = analysis.bookmarks.length > 0 ? `${analysis.summary.categorized} auto-categorized` : 'No bookmarks loaded yet'
  const infoBarSecondary =
    analysis.bookmarks.length > 0 ? `${analysis.summary.topInterestLabel} is leading` : 'Connect and sync X to populate the feed'

  return (
    <div style={appContainerStyle}>
      <div style={columnStyle}>
        <div style={customStyles.viewHeader}>
          <span style={customStyles.viewTitle}>Taxonomy</span>
          <button
            style={customStyles.iconBtn}
            onClick={() => {
              if (canSyncX) {
                void syncFromX()
                return
              }

              if (canConnectX) {
                connectX()
              }
            }}
            aria-label={canSyncX ? 'Sync bookmarks from X' : 'Connect X'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>

        <div style={customStyles.sectionLabel}>Interest Categories</div>
        <div style={customStyles.categoryGrid}>
          {categoryTiles.map((category) => (
            <CategoryItem
              key={category.id}
              label={category.label}
              count={category.count}
              icon={category.icon}
              gradient={category.gradient}
              isActive={effectiveCategoryId === category.id}
              onClick={() => setActiveCategoryId(category.id)}
            />
          ))}
        </div>

        <div style={customStyles.sectionLabel}>X Account</div>
        <div style={customStyles.statusBox}>{accountStatusCopy}</div>
        <div style={customStyles.actionRow}>
          <button
            style={{
              ...customStyles.primaryButton,
              opacity: canConnectX ? 1 : 0.6,
              cursor: canConnectX ? 'pointer' : 'not-allowed',
            }}
            onClick={connectX}
            disabled={!canConnectX}
          >
            {session?.authenticated && session.account ? `Connected @${session.account.username}` : 'Connect X'}
          </button>
          <button
            style={{
              ...customStyles.secondaryButton,
              opacity: canSyncX ? 1 : 0.6,
              cursor: canSyncX ? 'pointer' : 'not-allowed',
            }}
            onClick={() => {
              void syncFromX()
            }}
            disabled={!canSyncX || isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync now'}
          </button>
          <button
            style={{
              ...customStyles.secondaryButton,
              opacity: canSyncX ? 1 : 0.6,
              cursor: canSyncX ? 'pointer' : 'not-allowed',
            }}
            onClick={() => {
              void signOut()
            }}
            disabled={!canSyncX}
          >
            Sign out
          </button>
        </div>
        <div style={customStyles.statusBox}>
          {isPending ? 'Re-sorting bookmarks...' : statusMessage}
        </div>

        <div style={customStyles.sectionLabel}>Refine Profile</div>
        <input
          value={customInterest}
          onChange={(event) => setCustomInterest(event.target.value)}
          style={customStyles.compactInput}
          placeholder="Add a custom interest"
        />
        <div style={customStyles.actionRow}>
          <button style={customStyles.secondaryButton} onClick={handleAddCustomInterest}>
            Add interest
          </button>
        </div>
        {profileMessage ? <div style={customStyles.statusBox}>{profileMessage}</div> : null}
        <div style={customStyles.tagList}>
          {starterInterests.map((interest) => (
            <FilterPill
              key={interest.id}
              label={interest.label}
              active={activeInterests.some((item) => item.id === interest.id)}
              onClick={() => {
                startTransition(() => {
                  toggleStarterInterest(interest)
                })
              }}
            />
          ))}
        </div>

        <div style={{ ...customStyles.sectionLabel, borderTop: '1px solid #000000', paddingTop: '20px' }}>
          Filter by Type
        </div>
        <div style={customStyles.tagList}>
          {contentTypeOptions.map((label) => (
            <FilterPill
              key={label}
              label={label}
              active={activeType === label}
              onClick={() => setActiveType(label)}
            />
          ))}
        </div>
        <div style={customStyles.helperText}>
          Interest matching is local and heuristic for now. It is designed so an AI classifier can replace the scoring layer later without changing the UI.
        </div>
      </div>

      <div style={columnStyle}>
        <div style={customStyles.viewHeader}>
          <span style={customStyles.viewTitle}>Saved Bookmarks</span>
          <span style={customStyles.viewTitle}>{visibleBookmarks.length} visible</span>
        </div>

        <div style={customStyles.searchBar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search bookmarks..."
            style={customStyles.searchInput}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div style={customStyles.infoBar}>
          <span>{infoBarPrimary}</span>
          <span>{infoBarSecondary}</span>
        </div>

        <div style={customStyles.bookmarkList}>
          {visibleBookmarks.length === 0 ? (
            <div style={customStyles.emptyState}>
              {emptyStateMessage}
            </div>
          ) : (
            visibleBookmarks.map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                icon={iconForInterest(bookmark.matchedInterestId)}
                isSelected={selectedBookmark?.id === bookmark.id}
                onClick={() => setSelectedBookmarkId(bookmark.id)}
              />
            ))
          )}
        </div>
      </div>

      <div style={columnLastStyle}>
        <div style={customStyles.viewHeader}>
          <span style={customStyles.viewTitle}>Insights</span>
          <span style={customStyles.viewTitle}>{percent(analysis.summary.averageConfidence)} confidence</span>
        </div>

        <div style={customStyles.analysisSection}>
          <div style={{ ...customStyles.sectionLabel, padding: '0 0 16px 0' }}>Bookmark Velocity</div>

          <div style={customStyles.segmentControl}>
            {segments.map((segment, index) => {
              const isActive = activeSegment === segment
              const isLast = index === segments.length - 1
              let buttonStyle = customStyles.segmentBtn

              if (isActive && isLast) buttonStyle = customStyles.segmentBtnLastActive
              else if (isActive) buttonStyle = customStyles.segmentBtnActive
              else if (isLast) buttonStyle = customStyles.segmentBtnLast

              return (
                <button key={segment} style={buttonStyle} onClick={() => setActiveSegment(segment)}>
                  {segment}
                </button>
              )
            })}
          </div>

          <div style={customStyles.chartContainer}>
            <div style={customStyles.chartGrid}>
              <div style={customStyles.chartGridLine} />
              <div style={customStyles.chartGridLine} />
              <div style={customStyles.chartGridLine} />
            </div>
            <svg style={customStyles.chartSvg} viewBox="0 0 300 200" preserveAspectRatio="none">
              {analysis.stats.slice(0, 3).map((stat) => {
                const series = chartData.seriesMap.get(stat.interestId) ?? []
                return (
                  <polyline
                    key={stat.interestId}
                    points={polylinePoints(series, 300, 180, chartData.maxValue)}
                    fill="none"
                    stroke={stat.tint}
                    strokeWidth="2"
                    strokeLinejoin="miter"
                  />
                )
              })}
              <line
                x1="210"
                y1="0"
                x2="210"
                y2="200"
                stroke="#000000"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </svg>
          </div>

          <p style={customStyles.insightText}>
            {buildInsightCopy(
              analysis.bookmarks,
              analysis.summary.topInterestLabel,
              analysis.summary.hottestActionLane,
            )}
          </p>
        </div>

        <div style={customStyles.analysisSection}>
          <div style={{ ...customStyles.sectionLabel, padding: '0 0 16px 0' }}>Selected Bookmark</div>
          {selectedBookmark ? (
            <div style={customStyles.detailCard}>
              <div>
                <div style={customStyles.detailLabel}>Suggested category</div>
                <select
                  style={customStyles.detailSelect}
                  value={overrides[selectedBookmark.id] ?? '__auto__'}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    if (nextValue === '__auto__') {
                      startTransition(() => {
                        clearOverride(selectedBookmark.id)
                      })
                      return
                    }

                    startTransition(() => {
                      setOverride(selectedBookmark.id, nextValue)
                    })
                  }}
                >
                  <option value="__auto__">
                    Auto suggest ({selectedBookmark.matchedInterestLabel})
                  </option>
                  {[...activeInterests, analysis.uncategorizedInterest].map((interest) => (
                    <option key={interest.id} value={interest.id}>
                      {interest.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={customStyles.detailMeta}>
                <span style={customStyles.actionStat}>{selectedBookmark.contentType}</span>
                <span style={customStyles.actionStat}>{selectedBookmark.actionLane}</span>
                <span style={customStyles.actionStat}>
                  {selectedBookmark.isManual ? 'Manual override' : percent(selectedBookmark.confidence)}
                </span>
              </div>

              <div>
                <div style={customStyles.detailLabel}>Why it landed here</div>
                <div style={customStyles.detailBody}>{selectedBookmark.reason}</div>
              </div>

              <div>
                <div style={customStyles.detailLabel}>Bookmark text</div>
                <div style={customStyles.detailBody}>{selectedBookmark.text}</div>
              </div>

              <div>
                <div style={customStyles.detailLabel}>Signals</div>
                <div style={{ ...customStyles.tagList, padding: '8px 0 0' }}>
                  {selectedBookmark.signals.length > 0 ? (
                    selectedBookmark.signals.map((signal) => (
                      <span key={signal} style={customStyles.tagPill}>
                        {signal}
                      </span>
                    ))
                  ) : (
                    <span style={customStyles.insightText}>No dominant keyword signals yet.</span>
                  )}
                </div>
              </div>

              {selectedBookmark.url ? (
                <a
                  href={selectedBookmark.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...customStyles.secondaryButton, textDecoration: 'none', textAlign: 'center' }}
                >
                  Open source post
                </a>
              ) : null}
            </div>
          ) : (
            <div style={customStyles.emptyState}>
              Select a bookmark to inspect the category recommendation and edit it manually.
            </div>
          )}
        </div>

        <div style={{ ...customStyles.analysisSection, borderBottom: 'none' }}>
          <div style={{ ...customStyles.sectionLabel, padding: '0 0 16px 0' }}>Top Sources</div>
          <div style={customStyles.sourceList}>
            {sourceSummary.map((source) => (
              <div key={source.label} style={customStyles.sourceRow}>
                <span style={customStyles.sourceHandle}>{source.label}</span>
                <span style={customStyles.sourceCount}>{source.count} saves</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
