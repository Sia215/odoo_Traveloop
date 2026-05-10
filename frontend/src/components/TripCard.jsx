import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2, MapPin, Calendar, Receipt } from 'lucide-react'
import { fetchPlacePhoto } from '../lib/unsplash'

const STATUS_STYLES = {
  ongoing:   'bg-teal-50 text-teal-700',
  upcoming:  'bg-blue-50 text-blue-700',
  completed: 'bg-slate-100 text-slate-500',
}

const TRIP_GRADIENTS = [
  'from-teal-400 to-cyan-300',
  'from-orange-400 to-amber-300',
  'from-violet-400 to-purple-300',
  'from-rose-400 to-pink-300',
  'from-blue-400 to-indigo-300',
  'from-green-400 to-emerald-300',
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TripCard({ id, name, start_date, end_date, status, cover_photo, destination_count, onView, onEdit, onDelete, index = 0 }) {
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(cover_photo || null)

  useEffect(() => {
    if (!photo && name) {
      fetchPlacePhoto(name).then(url => { if (url) setPhoto(url) })
    }
  }, [name, cover_photo])
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Cover */}
      <div className={`h-36 relative bg-gradient-to-br ${TRIP_GRADIENTS[index % TRIP_GRADIENTS.length]}`}>
        {photo && (
          <img src={photo} alt={name} className="w-full h-full object-cover absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Status badge */}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.upcoming}`}>
          {status}
        </span>
        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {onEdit && (
            <button onClick={() => onEdit?.(id)}
              className="w-7 h-7 bg-white/90 hover:bg-white rounded-lg flex items-center justify-center transition shadow-sm">
              <Pencil size={13} className="text-slate-600" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete?.(id)}
              className="w-7 h-7 bg-white/90 hover:bg-red-50 rounded-lg flex items-center justify-center transition shadow-sm">
              <Trash2 size={13} className="text-red-500" />
            </button>
          )}
        </div>
        {/* Trip name overlay */}
        <p className="absolute bottom-3 left-3 right-3 text-white font-bold text-sm truncate drop-shadow">{name}</p>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Calendar size={12} />
          <span>{formatDate(start_date)} — {formatDate(end_date)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin size={12} />
            <span>{destination_count ?? 0} destination{destination_count !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(`/invoice/${id}`)}
              className="text-xs font-semibold text-slate-500 border border-slate-200 hover:border-primary hover:text-primary px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              <Receipt size={11} /> Invoice
            </button>
            <button
              onClick={() => onView?.(id)}
              className="text-xs font-semibold text-white bg-primary hover:bg-teal-700 px-3 py-1.5 rounded-lg transition"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="h-36 bg-slate-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}
