import { useState, type ReactNode } from 'react'

import { dashboardStyles } from './styles'

type CategoryTileProps = {
  label: string
  count: number
  icon: ReactNode
  gradient: string
  isActive: boolean
  onClick: () => void
}

export function CategoryTile({ label, count, icon, gradient, isActive, onClick }: CategoryTileProps) {
  const [hovered, setHovered] = useState(false)
  const isHighlighted = isActive || hovered

  return (
    <div
      style={dashboardStyles.categoryItem}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          ...dashboardStyles.iconBg,
          background: gradient,
          opacity: isHighlighted ? 0.6 : 0,
        }}
      />
      <div style={dashboardStyles.abstractIcon}>{icon}</div>
      <span style={isHighlighted ? dashboardStyles.categoryLabelActive : dashboardStyles.categoryLabel}>
        {label}
      </span>
      <span style={dashboardStyles.categoryCount}>{count} saved</span>
    </div>
  )
}
