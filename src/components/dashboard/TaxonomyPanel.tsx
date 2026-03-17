import type { CSSProperties } from 'react'

import { InterestIcon } from '../InterestIcon'
import { FilterPill } from './FilterPill'
import { CategoryTile } from './CategoryTile'
import { dashboardStyles } from './styles'
import type { DashboardCategoryTile } from '../../hooks/useBookmarkDashboard'
import type { InterestDefinition } from '../../lib/bookmarks'

type TaxonomyPanelProps = {
  columnStyle: CSSProperties
  activeCategoryId: string
  categoryTiles: DashboardCategoryTile[]
  starterInterests: InterestDefinition[]
  activeInterests: InterestDefinition[]
  contentTypeOptions: string[]
  activeType: string
  customInterest: string
  canConnectX: boolean
  canSyncX: boolean
  connectButtonLabel: string
  accountStatusCopy: string
  statusMessage: string
  profileMessage: string | null
  classificationStatusMessage: string | null
  isSyncing: boolean
  isPending: boolean
  onConnectX: () => void
  onSyncFromX: () => void
  onSignOut: () => void
  onCategorySelect: (categoryId: string) => void
  onCustomInterestChange: (value: string) => void
  onAddCustomInterest: () => void
  onToggleStarterInterest: (interest: InterestDefinition) => void
  onTypeSelect: (value: string) => void
}

export function TaxonomyPanel({
  columnStyle,
  activeCategoryId,
  categoryTiles,
  starterInterests,
  activeInterests,
  contentTypeOptions,
  activeType,
  customInterest,
  canConnectX,
  canSyncX,
  connectButtonLabel,
  accountStatusCopy,
  statusMessage,
  profileMessage,
  classificationStatusMessage,
  isSyncing,
  isPending,
  onConnectX,
  onSyncFromX,
  onSignOut,
  onCategorySelect,
  onCustomInterestChange,
  onAddCustomInterest,
  onToggleStarterInterest,
  onTypeSelect,
}: TaxonomyPanelProps) {
  return (
    <div style={columnStyle}>
      <div style={dashboardStyles.viewHeader}>
        <span style={dashboardStyles.viewTitle}>Taxonomy</span>
        <button
          style={dashboardStyles.iconBtn}
          onClick={() => {
            if (canSyncX) {
              onSyncFromX()
              return
            }

            if (canConnectX) {
              onConnectX()
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

      <div style={dashboardStyles.sectionLabel}>Interest Categories</div>
      <div style={dashboardStyles.categoryGrid}>
        {categoryTiles.map((category) => (
          <CategoryTile
            key={category.id}
            label={category.label}
            count={category.count}
            icon={<InterestIcon interestId={category.interestId} />}
            gradient={category.gradient}
            isActive={activeCategoryId === category.id}
            onClick={() => onCategorySelect(category.id)}
          />
        ))}
      </div>

      <div style={dashboardStyles.sectionLabel}>X Account</div>
      <div style={dashboardStyles.statusBox}>{accountStatusCopy}</div>
      <div style={dashboardStyles.actionRow}>
        <button
          style={{
            ...dashboardStyles.primaryButton,
            opacity: canConnectX ? 1 : 0.6,
            cursor: canConnectX ? 'pointer' : 'not-allowed',
          }}
          onClick={onConnectX}
          disabled={!canConnectX}
        >
          {connectButtonLabel}
        </button>
        <button
          style={{
            ...dashboardStyles.secondaryButton,
            opacity: canSyncX ? 1 : 0.6,
            cursor: canSyncX ? 'pointer' : 'not-allowed',
          }}
          onClick={onSyncFromX}
          disabled={!canSyncX || isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Sync now'}
        </button>
        <button
          style={{
            ...dashboardStyles.secondaryButton,
            opacity: canSyncX ? 1 : 0.6,
            cursor: canSyncX ? 'pointer' : 'not-allowed',
          }}
          onClick={onSignOut}
          disabled={!canSyncX}
        >
          Sign out
        </button>
      </div>
      <div style={dashboardStyles.statusBox}>{isPending ? 'Re-sorting bookmarks...' : statusMessage}</div>
      {classificationStatusMessage ? <div style={dashboardStyles.statusBox}>{classificationStatusMessage}</div> : null}

      <div style={dashboardStyles.sectionLabel}>Refine Profile</div>
      <input
        value={customInterest}
        onChange={(event) => onCustomInterestChange(event.target.value)}
        style={dashboardStyles.compactInput}
        placeholder="Add a custom interest"
      />
      <div style={dashboardStyles.actionRow}>
        <button style={dashboardStyles.secondaryButton} onClick={onAddCustomInterest}>
          Add interest
        </button>
      </div>
      {profileMessage ? <div style={dashboardStyles.statusBox}>{profileMessage}</div> : null}
      <div style={dashboardStyles.tagList}>
        {starterInterests.map((interest) => (
          <FilterPill
            key={interest.id}
            label={interest.label}
            active={activeInterests.some((item) => item.id === interest.id)}
            onClick={() => onToggleStarterInterest(interest)}
          />
        ))}
      </div>

      <div style={{ ...dashboardStyles.sectionLabel, borderTop: '1px solid #000000', paddingTop: '20px' }}>
        Filter by Type
      </div>
      <div style={dashboardStyles.tagList}>
        {contentTypeOptions.map((label) => (
          <FilterPill
            key={label}
            label={label}
            active={activeType === label}
            onClick={() => onTypeSelect(label)}
          />
        ))}
      </div>
      <div style={dashboardStyles.helperText}>
        Sorting stays on the existing review contract, so heuristic and model-backed suggestions use the same UI.
      </div>
    </div>
  )
}
