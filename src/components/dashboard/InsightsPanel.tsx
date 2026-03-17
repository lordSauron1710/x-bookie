import type { CSSProperties } from 'react'

import { buildInsightCopy, percent, polylinePoints } from '../../lib/appView'
import type { InterestDefinition, AnalyzedBookmark } from '../../lib/bookmarks'
import { dashboardStyles } from './styles'

type InsightsPanelProps = {
  columnStyle: CSSProperties
  analysis: ReturnType<typeof import('../../lib/bookmarks').analyzeBookmarks>
  selectedBookmark: AnalyzedBookmark | null
  activeInterests: InterestDefinition[]
  overrides: Record<string, string>
  activeSegment: 'Week' | 'Month' | 'Year'
  segments: ReadonlyArray<'Week' | 'Month' | 'Year'>
  chartData: ReturnType<typeof import('../../lib/appView').buildVelocitySeries>
  sourceSummary: Array<{ label: string; count: number }>
  onSegmentChange: (segment: 'Week' | 'Month' | 'Year') => void
  onSetOverride: (bookmarkId: string, interestId: string) => void
  onClearOverride: (bookmarkId: string) => void
}

export function InsightsPanel({
  columnStyle,
  analysis,
  selectedBookmark,
  activeInterests,
  overrides,
  activeSegment,
  segments,
  chartData,
  sourceSummary,
  onSegmentChange,
  onSetOverride,
  onClearOverride,
}: InsightsPanelProps) {
  return (
    <div style={columnStyle}>
      <div style={dashboardStyles.viewHeader}>
        <span style={dashboardStyles.viewTitle}>Insights</span>
        <span style={dashboardStyles.viewTitle}>{percent(analysis.summary.averageConfidence)} confidence</span>
      </div>

      <div style={dashboardStyles.analysisSection}>
        <div style={{ ...dashboardStyles.sectionLabel, padding: '0 0 16px 0' }}>Bookmark Velocity</div>

        <div style={dashboardStyles.segmentControl}>
          {segments.map((segment, index) => {
            const isActive = activeSegment === segment
            const isLast = index === segments.length - 1
            let buttonStyle = dashboardStyles.segmentBtn

            if (isActive && isLast) buttonStyle = dashboardStyles.segmentBtnLastActive
            else if (isActive) buttonStyle = dashboardStyles.segmentBtnActive
            else if (isLast) buttonStyle = dashboardStyles.segmentBtnLast

            return (
              <button key={segment} style={buttonStyle} onClick={() => onSegmentChange(segment)}>
                {segment}
              </button>
            )
          })}
        </div>

        <div style={dashboardStyles.chartContainer}>
          <div style={dashboardStyles.chartGrid}>
            <div style={dashboardStyles.chartGridLine} />
            <div style={dashboardStyles.chartGridLine} />
            <div style={dashboardStyles.chartGridLine} />
          </div>
          <svg style={dashboardStyles.chartSvg} viewBox="0 0 300 200" preserveAspectRatio="none">
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

        <p style={dashboardStyles.insightText}>
          {buildInsightCopy(
            analysis.bookmarks,
            analysis.summary.topInterestLabel,
            analysis.summary.hottestActionLane,
          )}
        </p>
      </div>

      <div style={dashboardStyles.analysisSection}>
        <div style={{ ...dashboardStyles.sectionLabel, padding: '0 0 16px 0' }}>Selected Bookmark</div>
        {selectedBookmark ? (
          <div style={dashboardStyles.detailCard}>
            <div>
              <div style={dashboardStyles.detailLabel}>Suggested category</div>
              <select
                style={dashboardStyles.detailSelect}
                value={overrides[selectedBookmark.id] ?? '__auto__'}
                onChange={(event) => {
                  const nextValue = event.target.value
                  if (nextValue === '__auto__') {
                    onClearOverride(selectedBookmark.id)
                    return
                  }

                  onSetOverride(selectedBookmark.id, nextValue)
                }}
              >
                <option value="__auto__">Auto suggest ({selectedBookmark.matchedInterestLabel})</option>
                {[...activeInterests, analysis.uncategorizedInterest].map((interest) => (
                  <option key={interest.id} value={interest.id}>
                    {interest.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={dashboardStyles.detailMeta}>
              <span style={dashboardStyles.actionStat}>{selectedBookmark.contentType}</span>
              <span style={dashboardStyles.actionStat}>{selectedBookmark.actionLane}</span>
              <span style={dashboardStyles.actionStat}>
                {selectedBookmark.isManual ? 'Manual override' : percent(selectedBookmark.confidence)}
              </span>
            </div>

            <div>
              <div style={dashboardStyles.detailLabel}>Why it landed here</div>
              <div style={dashboardStyles.detailBody}>{selectedBookmark.reason}</div>
            </div>

            <div>
              <div style={dashboardStyles.detailLabel}>Bookmark text</div>
              <div style={dashboardStyles.detailBody}>{selectedBookmark.text}</div>
            </div>

            <div>
              <div style={dashboardStyles.detailLabel}>Signals</div>
              <div style={{ ...dashboardStyles.tagList, padding: '8px 0 0' }}>
                {selectedBookmark.signals.length > 0 ? (
                  selectedBookmark.signals.map((signal) => (
                    <span key={signal} style={dashboardStyles.tagPill}>
                      {signal}
                    </span>
                  ))
                ) : (
                  <span style={dashboardStyles.insightText}>No dominant keyword signals yet.</span>
                )}
              </div>
            </div>

            {selectedBookmark.url ? (
              <a
                href={selectedBookmark.url}
                target="_blank"
                rel="noreferrer"
                style={{ ...dashboardStyles.secondaryButton, textDecoration: 'none', textAlign: 'center' }}
              >
                Open source post
              </a>
            ) : null}
          </div>
        ) : (
          <div style={dashboardStyles.emptyState}>
            Select a bookmark to inspect the category recommendation and edit it manually.
          </div>
        )}
      </div>

      <div style={{ ...dashboardStyles.analysisSection, borderBottom: 'none' }}>
        <div style={{ ...dashboardStyles.sectionLabel, padding: '0 0 16px 0' }}>Top Sources</div>
        <div style={dashboardStyles.sourceList}>
          {sourceSummary.map((source) => (
            <div key={source.label} style={dashboardStyles.sourceRow}>
              <span style={dashboardStyles.sourceHandle}>{source.label}</span>
              <span style={dashboardStyles.sourceCount}>{source.count} saves</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
