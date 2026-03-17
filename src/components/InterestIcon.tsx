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

type InterestIconProps = {
  interestId: string
}

export function InterestIcon({ interestId }: InterestIconProps) {
  if (interestId.includes('ai') || interestId.includes('dev')) return <TechIcon />
  if (interestId.includes('design') || interestId.includes('product')) return <DesignIcon />
  if (interestId.includes('growth') || interestId.includes('writing')) return <ThreadIcon />
  if (interestId.includes('invest')) return <DataIcon />
  if (interestId.includes('review')) return <OtherIcon />
  return <NewsIcon />
}
