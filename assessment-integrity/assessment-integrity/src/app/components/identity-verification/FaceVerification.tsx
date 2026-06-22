import React, { useState } from 'react'
import { ScanFace, CheckCircle2 } from 'lucide-react'
import { Card, IconWrap, Badge } from '../ui/custom-verification'
import type { ScanStatus } from '../../types/verification-types'

export function FaceVerification() {
  const [status, setStatus] = useState<ScanStatus>('idle')

  function handleBegin() {
    setStatus('scanning')
    setTimeout(() => setStatus('verified'), 2800)
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <IconWrap tone="tan" className="h-11 w-11">
            <ScanFace size={20} strokeWidth={2} />
          </IconWrap>
          <div>
            <h2 className="text-base font-bold text-ink-900">Face Verification</h2>
            <p className="text-sm text-ink-500">Match your face to your ID</p>
          </div>
        </div>

        {status === 'verified' && <Badge tone="green">READY</Badge>}
      </div>

      <div className="relative rounded-2xl bg-ink-900 overflow-hidden h-64 flex items-center justify-center">
        {status === 'scanning' && (
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-tan-400/40 via-tan-400/10 to-transparent animate-scan-sweep pointer-events-none" />
        )}

        {status !== 'idle' && (
          <div className="absolute h-32 w-32 rounded-full border border-tan-400/60 animate-ring-pulse pointer-events-none" />
        )}

        <svg viewBox="0 0 200 200" className="h-40 w-40 relative z-10">
          <ellipse
            cx="100"
            cy="100"
            rx="55"
            ry="70"
            fill="none"
            stroke={status === 'verified' ? '#22c55e' : '#b8a48c'}
            strokeWidth="2"
            className={status === 'scanning' ? 'animate-oval-trace' : ''}
            opacity={status === 'idle' ? 0.35 : 0.9}
          />
        </svg>

        {status === 'verified' && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-900/40">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 size={36} strokeWidth={2} className="text-ready-green" />
              <span className="text-sm font-semibold text-card-bg">Face matched</span>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <p className="absolute bottom-4 text-xs text-card-bg/60 font-medium">
            Position your face in the frame
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleBegin}
        disabled={status !== 'idle'}
        className={[
          'w-full mt-5 rounded-2xl py-3 text-sm font-semibold transition-premium cursor-pointer',
          'bg-ink-900 text-card-bg shadow-btn-dark hover:shadow-btn-dark-hover hover:-translate-y-0.5 active:translate-y-0',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        ].join(' ')}
      >
        {status === 'idle' && 'Begin Face Scan'}
        {status === 'scanning' && 'Scanning…'}
        {status === 'verified' && 'Verified'}
      </button>
    </Card>
  )
}
