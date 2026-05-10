import { useEffect, useState } from 'react'

const COLOR_MAP = {
  teal:   { bg: '#E6FAF6', text: '#0D9488' },
  orange: { bg: '#FFF0E6', text: '#F97316' },
  blue:   { bg: '#EFF6FF', text: '#3B82F6' },
  red:    { bg: '#FEF2F2', text: '#EF4444' },
  purple: { bg: '#F5F3FF', text: '#7C3AED' },
}

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) return
    const steps = 30
    const step  = Math.ceil(target / steps)
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setVal(current)
      if (current >= target) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])
  return val
}

export default function StatCard({
  // new props
  label, value, icon, color = 'teal', trend, trendLabel,
  // legacy props (keep working)
  title, subtitle,
}) {
  const displayLabel = label || title
  const displayValue = value ?? 0
  const animated     = useCountUp(typeof displayValue === 'number' ? displayValue : 0)
  const colors       = COLOR_MAP[color] || COLOR_MAP.teal

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ background: colors.bg }}
        >
          {typeof icon === 'string' ? icon : icon ? <span style={{ color: colors.text }}>{icon}</span> : null}
        </div>
        {trend != null && trend !== 0 && (
          <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-[28px] font-bold text-[#1E293B] leading-none mb-1">
        {typeof displayValue === 'number' ? animated.toLocaleString('en-IN') : displayValue}
      </div>
      <div className="text-[13px] text-slate-500">{displayLabel}</div>
      {trendLabel && <div className="text-xs text-slate-400 mt-1">{trendLabel}</div>}
      {subtitle && <div className="text-xs text-[#0D9488] mt-1 font-medium">{subtitle}</div>}
    </div>
  )
}
