import React from 'react'

export interface WorkbenchIconProps {
  size?: number
  active?: boolean
}

export function WorkbenchIcon({ size = 20, active = false }: WorkbenchIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: 'block',
        margin: 'auto',
        color: active ? '#2563eb' : 'currentColor',
        transition: 'all 0.2s ease',
      }}
    >
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  )
}
