import { useState, type ReactNode } from 'react'

import type { AnalyzedBookmark } from '../../lib/bookmarks'
import { avatarColor, getInitials, percent, relativeTime } from '../../lib/appView'
import { dashboardStyles } from './styles'

type BookmarkListItemProps = {
  bookmark: AnalyzedBookmark
  isSelected: boolean
  icon: ReactNode
  onClick: () => void
}

export function BookmarkListItem({ bookmark, isSelected, icon, onClick }: BookmarkListItemProps) {
  const [hovered, setHovered] = useState(false)
  const excerpt =
    bookmark.text.length > 210 ? `${bookmark.text.slice(0, 210).trim()}...` : bookmark.text

  return (
    <div
      style={{
        ...dashboardStyles.bookmarkItem,
        backgroundColor: isSelected ? 'rgba(0,0,0,0.05)' : hovered ? 'rgba(0,0,0,0.03)' : 'transparent',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          ...dashboardStyles.authorAvatar,
          backgroundColor: avatarColor(bookmark.author),
        }}
      >
        {getInitials(bookmark.author)}
      </div>

      <div style={dashboardStyles.tweetContentWrapper}>
        <div style={dashboardStyles.tweetHeader}>
          <div>
            <span style={dashboardStyles.authorName}>{bookmark.author}</span>
            <span style={dashboardStyles.authorHandle}>
              {bookmark.handle ? `@${bookmark.handle}` : 'Imported'}
            </span>
          </div>
          <span style={dashboardStyles.tweetMeta}>{relativeTime(bookmark.createdAt)}</span>
        </div>

        <div style={dashboardStyles.tweetText}>{excerpt}</div>

        <div style={dashboardStyles.tweetActions}>
          <span style={dashboardStyles.actionStat}>{bookmark.matchedInterestLabel}</span>
          <span style={dashboardStyles.actionStat}>{percent(bookmark.confidence)}</span>
          <span style={dashboardStyles.actionStat}>{bookmark.actionLane}</span>
          <span style={dashboardStyles.actionStat}>{bookmark.contentType}</span>
        </div>

        <div style={dashboardStyles.itemTag}>{icon}</div>
      </div>
    </div>
  )
}
