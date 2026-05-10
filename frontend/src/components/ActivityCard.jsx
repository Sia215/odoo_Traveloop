import { useState, useEffect } from 'react'
import { Check, Plus, MapPin, Clock, Star } from 'lucide-react'
import { fetchPlacePhoto } from '../lib/unsplash'

const CATEGORY_STYLES = {
  Sightseeing: { gradient: 'from-[#0D9488] to-[#0f766e]',   badge: 'bg-[#0D9488]' },
  Culture:     { gradient: 'from-[#7C3AED] to-[#6D28D9]',   badge: 'bg-[#7C3AED]' },
  Food:        { gradient: 'from-[#F97316] to-[#EA580C]',   badge: 'bg-[#F97316]' },
  Adventure:   { gradient: 'from-[#EF4444] to-[#DC2626]',   badge: 'bg-[#EF4444]' },
  Nature:      { gradient: 'from-[#22C55E] to-[#16A34A]',   badge: 'bg-[#22C55E]' },
}
const DEFAULT_STYLE = { gradient: 'from-[#94A3B8] to-[#64748B]', badge: 'bg-[#94A3B8]' }

function formatDuration(h) {
  if (!h && h !== 0) return null
  if (h < 1) return `${Math.round(h * 60)} min`
  return h % 1 === 0 ? `${h}h` : `${h}h`
}

export default function ActivityCard({
  id, name, category, estimated_cost, duration_hours,
  description, rating, city_name,
  isAdded, onAdd, onRemove,
}) {
  const [loading, setLoading] = useState(false)
  const [photo, setPhoto]     = useState(null)
  const style = CATEGORY_STYLES[category] || DEFAULT_STYLE

  useEffect(() => {
    fetchPlacePhoto(`${name} ${city_name ?? category}`).then(url => { if (url) setPhoto(url) })
  }, [name, city_name, category])

  const handleClick = async () => {
    setLoading(true)
    try {
      if (isAdded) await onRemove(id)
      else await onAdd(id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col">
      {/* Gradient + real photo */}
      <div className={`h-40 bg-gradient-to-br ${style.gradient} relative shrink-0`}>
        {photo && (
          <img src={photo} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <span className={`absolute top-3 left-3 ${style.badge} text-white text-[11px] font-semibold px-2.5 py-1 rounded-full`}>
          {category}
        </span>
        <span className="absolute top-3 right-3 bg-white/90 text-[#1E293B] text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
          {rating != null
            ? <><Star size={11} className="text-amber-400 fill-amber-400" />{rating}</>
            : <span className="text-[#0D9488]">New</span>}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-[#1E293B] text-sm leading-snug">{name}</h3>

        {description && (
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{description}</p>
        )}

        <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-[#1E293B]">
            ₹{(estimated_cost ?? 0).toLocaleString('en-IN')}
          </span>
          {formatDuration(duration_hours) && (
            <span className="flex items-center gap-1">
              <Clock size={12} />{formatDuration(duration_hours)}
            </span>
          )}
        </div>

        {city_name && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin size={12} />{city_name}
          </div>
        )}

        <button
          onClick={handleClick}
          disabled={loading}
          className={`mt-auto w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-xl transition
            ${isAdded
              ? 'border-2 border-[#0D9488] text-[#0D9488] bg-white hover:bg-teal-50'
              : 'bg-[#0D9488] hover:bg-teal-700 text-white'
            } disabled:opacity-60`}
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            : isAdded
              ? <><Check size={15} />Added</>
              : <><Plus size={15} />Add to Trip</>
          }
        </button>
      </div>
    </div>
  )
}
