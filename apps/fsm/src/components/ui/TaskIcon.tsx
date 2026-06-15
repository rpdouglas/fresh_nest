import React from 'react'

export type TaskIconType =
  | 'mop'
  | 'toilet'
  | 'trash'
  | 'key'
  | 'bed'
  | 'oven'
  | 'fridge'
  | 'window'
  | 'photo'
  | 'check'
  | 'vacuum'
  | 'sink'

interface TaskIconProps {
  type: string
  className?: string
}

export const TaskIcon: React.FC<TaskIconProps> = ({ type, className = 'w-6 h-6' }) => {
  // Normalize types
  const iconType = type.toLowerCase().trim()

  switch (iconType) {
    case 'mop':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {/* Mop handle and head */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 5L5 19M16 4l4 4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h3l1-3H3l-1 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 17c1.5-1.5 3.5-1.5 5 0s1.5 3.5 0 5" />
        </svg>
      )
    case 'toilet':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {/* Toilet bowl and tank */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h10v6H7V3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h12v4c0 3.314-2.686 6-6 6s-6-2.686-6-6V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19h4v2h-4v-2z" />
        </svg>
      )
    case 'trash':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    case 'key':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 11-4 0 2 2 0 014 0zM12 14a5 5 0 01-3 1.28v1.09c0 .738.404 1.41 1.055 1.75l1.055.55A1 1 0 0012.618 19h1.764a1 1 0 00.894-.553l.553-1.106A2 2 0 0015.382 16h-.882a1 1 0 01-.894-.553l-.553-1.106a1 1 0 00-.894-.553H12z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 9.5l-4 4V17h3.5l2.5-2.5" />
        </svg>
      )
    case 'bed':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10V19M21 10V19M3 14h18M3 10h18M5 6v4m14-4v4M3 19h18" />
        </svg>
      )
    case 'oven':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {/* Oven structure, door, window, knobs */}
          <rect width={18} height={18} x={3} y={3} rx={2} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={3} y1={8} x2={21} y2={8} strokeLinecap="round" strokeLinejoin="round" />
          <rect width={12} height={8} x={6} y={11} rx={1} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={6} cy={5.5} r={1} />
          <circle cx={12} cy={5.5} r={1} />
          <circle cx={18} cy={5.5} r={1} />
        </svg>
      )
    case 'fridge':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {/* Refrigerator handles and split door */}
          <rect width={16} height={20} x={4} y={2} rx={2} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={4} y1={10} x2={20} y2={10} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={9} y1={5} x2={9} y2={8} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={9} y1={12} x2={9} y2={16} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'window':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect width={16} height={16} x={4} y={4} rx={2} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={12} y1={4} x2={12} y2={20} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={4} y1={12} x2={20} y2={12} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'photo':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <circle cx={12} cy={13} r={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'check':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'vacuum':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {/* Vacuum cleaner body, hose, and nozzle */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 17v-6a4 4 0 00-8 0v2H7a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2z" />
          <circle cx={7} cy={17} r={1.5} />
          <circle cx={17} cy={17} r={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 7a3 3 0 016 0v4" />
        </svg>
      )
    case 'sink':
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          {/* Faucet and basin */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10V4m0 0a2 2 0 114 0M12 4H9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16a2 2 0 012 2v2a6 6 0 01-6 6H8a6 6 0 01-6-6v-2a2 2 0 012-2z" />
        </svg>
      )
    default:
      // Fallback checklist/bullet icon
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
  }
}
