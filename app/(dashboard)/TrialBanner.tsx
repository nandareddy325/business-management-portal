'use client'

import { useRouter } from 'next/navigation'

interface Props {
  daysRemaining: number
}

export default function TrialBanner({ daysRemaining }: Props) {
  const router = useRouter()

  const isUrgent = daysRemaining <= 3
  const isWarning = daysRemaining <= 7 && daysRemaining > 3

  const bgColor = isUrgent ? '#7f1d1d' : isWarning ? '#78350f' : '#1C1712'
  const borderColor = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#B8860B'
  const textColor = isUrgent ? '#fca5a5' : isWarning ? '#fde68a' : 'rgba(255,255,255,0.7)'
  const badgeBg = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#B8860B'

  const message = daysRemaining === 0
    ? 'Trial expires today!'
    : daysRemaining === 1
    ? '1 day left in your trial'
    : `${daysRemaining} days left in your trial`

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        padding: '10px 16px',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Pulsing dot */}
        <div style={{ position: 'relative', width: 8, height: 8, flexShrink: 0 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: badgeBg, opacity: 0.4,
            animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
          }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: badgeBg }} />
        </div>

        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {isUrgent ? '⚠️ ' : '⏳ '}{message}
          </span>
          <span style={{ fontSize: 12, color: textColor, marginLeft: 8 }}>
            · Upgrade cheyyi to continue using GK CRM
          </span>
        </div>
      </div>

      <button
        onClick={() => router.push('/subscription/renew')}
        style={{
          background: badgeBg,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '6px 16px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Upgrade Now →
      </button>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  )
}