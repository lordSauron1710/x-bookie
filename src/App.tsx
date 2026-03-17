import { useTransition, type CSSProperties } from 'react'

import './App.css'
import { BookmarkFeedPanel } from './components/dashboard/BookmarkFeedPanel'
import { InsightsPanel } from './components/dashboard/InsightsPanel'
import { dashboardStyles } from './components/dashboard/styles'
import { TaxonomyPanel } from './components/dashboard/TaxonomyPanel'
import { useBookmarkClassification } from './hooks/useBookmarkClassification'
import { useBookmarkDashboard } from './hooks/useBookmarkDashboard'
import { useBookmarkSource } from './hooks/useBookmarkSource'
import { useInterestProfile } from './hooks/useInterestProfile'
import { starterInterests, type InterestDefinition } from './lib/bookmarks'

function App() {
  const { bookmarks, session, statusMessage, isBootstrapping, isSyncing, connectX, signOut, syncFromX } =
    useBookmarkSource()
  const storageScope = session?.account?.xUserId ?? 'anonymous'
  const {
    activeInterests,
    overrides,
    profileMessage,
    addCustomInterest,
    clearOverride,
    setOverride,
    toggleStarterInterest,
  } = useInterestProfile(storageScope)
  const { suggestions, statusMessage: classificationStatusMessage, isClassifying } = useBookmarkClassification({
    bookmarks,
    interests: activeInterests,
    classificationMode: session?.classificationMode ?? 'heuristic',
    isAuthenticated: Boolean(session?.authenticated && session.account),
  })
  const [isPending, startTransition] = useTransition()
  const dashboard = useBookmarkDashboard({
    bookmarks,
    activeInterests,
    overrides,
    classificationSuggestions: suggestions,
    isAuthenticated: Boolean(session?.authenticated),
  })

  const canConnectX = Boolean(session?.xAuthConfigured && !session?.authenticated && !isBootstrapping)
  const canSyncX = Boolean(session?.authenticated && session.account)
  const connectButtonLabel =
    session?.authenticated && session.account ? `Connected @${session.account.username}` : 'Connect X'
  const accountStatusCopy = !session?.xAuthConfigured
    ? 'Set the X server env vars before Connect X can run.'
    : session?.authenticated && session.account
      ? `Connected as @${session.account.username}. Syncing pulls the latest bookmarked posts from X into your app session store.`
      : 'Connect X to load your live bookmarks and replace the empty local shell.'

  function handleAddCustomInterest() {
    const pendingLabel = dashboard.customInterest

    startTransition(() => {
      const added = addCustomInterest(pendingLabel)
      if (added) {
        dashboard.setCustomInterest('')
      }
    })
  }

  function handleToggleStarterInterest(interest: InterestDefinition) {
    startTransition(() => {
      toggleStarterInterest(interest)
    })
  }

  function handleSetOverride(bookmarkId: string, interestId: string) {
    startTransition(() => {
      setOverride(bookmarkId, interestId)
    })
  }

  function handleClearOverride(bookmarkId: string) {
    startTransition(() => {
      clearOverride(bookmarkId)
    })
  }

  const appContainerStyle: CSSProperties = {
    ...dashboardStyles.appContainer,
    gridTemplateColumns: dashboard.isCompact ? '1fr' : '320px minmax(0, 1fr) 380px',
    overflow: dashboard.isCompact ? 'visible' : 'hidden',
  }

  const columnStyle: CSSProperties = {
    ...dashboardStyles.column,
    borderRight: dashboard.isCompact ? 'none' : '1px solid #000000',
    minHeight: dashboard.isCompact ? 'auto' : '100vh',
    overflowY: dashboard.isCompact ? 'visible' : 'auto',
  }

  const columnLastStyle: CSSProperties = {
    ...dashboardStyles.columnLast,
    minHeight: dashboard.isCompact ? 'auto' : '100vh',
    overflowY: dashboard.isCompact ? 'visible' : 'auto',
    borderTop: dashboard.isCompact ? '1px solid #000000' : 'none',
  }

  return (
    <div style={appContainerStyle}>
      <TaxonomyPanel
        columnStyle={columnStyle}
        activeCategoryId={dashboard.activeCategoryId}
        categoryTiles={dashboard.categoryTiles}
        starterInterests={starterInterests}
        activeInterests={activeInterests}
        contentTypeOptions={dashboard.contentTypeOptions}
        activeType={dashboard.activeType}
        customInterest={dashboard.customInterest}
        canConnectX={canConnectX}
        canSyncX={canSyncX}
        connectButtonLabel={connectButtonLabel}
        accountStatusCopy={accountStatusCopy}
        statusMessage={statusMessage}
        profileMessage={profileMessage}
        classificationStatusMessage={
          isClassifying ? 'Refreshing model-backed suggestions...' : classificationStatusMessage
        }
        isSyncing={isSyncing}
        isPending={isPending}
        onConnectX={connectX}
        onSyncFromX={() => {
          void syncFromX()
        }}
        onSignOut={() => {
          void signOut()
        }}
        onCategorySelect={dashboard.setActiveCategoryId}
        onCustomInterestChange={dashboard.setCustomInterest}
        onAddCustomInterest={handleAddCustomInterest}
        onToggleStarterInterest={handleToggleStarterInterest}
        onTypeSelect={dashboard.setActiveType}
      />

      <BookmarkFeedPanel
        columnStyle={columnStyle}
        searchTerm={dashboard.searchTerm}
        visibleBookmarks={dashboard.visibleBookmarks}
        selectedBookmarkId={dashboard.selectedBookmarkId}
        infoBarPrimary={dashboard.infoBarPrimary}
        infoBarSecondary={dashboard.infoBarSecondary}
        emptyStateMessage={dashboard.emptyStateMessage}
        onSearchTermChange={dashboard.setSearchTerm}
        onSelectBookmark={dashboard.setSelectedBookmarkId}
      />

      <InsightsPanel
        columnStyle={columnLastStyle}
        analysis={dashboard.analysis}
        selectedBookmark={dashboard.selectedBookmark}
        activeInterests={activeInterests}
        overrides={overrides}
        activeSegment={dashboard.activeSegment}
        segments={dashboard.segments}
        chartData={dashboard.chartData}
        sourceSummary={dashboard.sourceSummary}
        onSegmentChange={dashboard.setActiveSegment}
        onSetOverride={handleSetOverride}
        onClearOverride={handleClearOverride}
      />
    </div>
  )
}

export default App
