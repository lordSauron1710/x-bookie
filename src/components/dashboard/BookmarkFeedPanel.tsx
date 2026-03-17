import type { CSSProperties } from 'react'

import { InterestIcon } from '../InterestIcon'
import { BookmarkListItem } from './BookmarkListItem'
import { dashboardStyles } from './styles'
import type { AnalyzedBookmark } from '../../lib/bookmarks'

type BookmarkFeedPanelProps = {
  columnStyle: CSSProperties
  searchTerm: string
  visibleBookmarks: AnalyzedBookmark[]
  selectedBookmarkId: string | null
  infoBarPrimary: string
  infoBarSecondary: string
  emptyStateMessage: string
  onSearchTermChange: (value: string) => void
  onSelectBookmark: (bookmarkId: string) => void
}

export function BookmarkFeedPanel({
  columnStyle,
  searchTerm,
  visibleBookmarks,
  selectedBookmarkId,
  infoBarPrimary,
  infoBarSecondary,
  emptyStateMessage,
  onSearchTermChange,
  onSelectBookmark,
}: BookmarkFeedPanelProps) {
  return (
    <div style={columnStyle}>
      <div style={dashboardStyles.viewHeader}>
        <span style={dashboardStyles.viewTitle}>Saved Bookmarks</span>
        <span style={dashboardStyles.viewTitle}>{visibleBookmarks.length} visible</span>
      </div>

      <div style={dashboardStyles.searchBar}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search bookmarks..."
          style={dashboardStyles.searchInput}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
        />
      </div>

      <div style={dashboardStyles.infoBar}>
        <span>{infoBarPrimary}</span>
        <span>{infoBarSecondary}</span>
      </div>

      <div style={dashboardStyles.bookmarkList}>
        {visibleBookmarks.length === 0 ? (
          <div style={dashboardStyles.emptyState}>{emptyStateMessage}</div>
        ) : (
          visibleBookmarks.map((bookmark) => (
            <BookmarkListItem
              key={bookmark.id}
              bookmark={bookmark}
              icon={<InterestIcon interestId={bookmark.matchedInterestId} />}
              isSelected={selectedBookmarkId === bookmark.id}
              onClick={() => onSelectBookmark(bookmark.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
