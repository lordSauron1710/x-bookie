import { useState } from 'react'

import { dashboardStyles } from './styles'

type FilterPillProps = {
  label: string
  active: boolean
  onClick: () => void
}

export function FilterPill({ label, active, onClick }: FilterPillProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      style={{
        ...(active ? dashboardStyles.tagPillActive : dashboardStyles.tagPill),
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
