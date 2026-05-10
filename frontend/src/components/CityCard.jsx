import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { fetchPlacePhoto } from '../lib/unsplash'

const CITY_GRADIENTS = [
  'from-rose-400 to-orange-300',
  'from-teal-400 to-cyan-300',
  'from-violet-400 to-purple-300',
  'from-amber-400 to-yellow-300',
  'from-blue-400 to-indigo-300',
]

export default function CityCard({ id, name, country, popularity, image_url, index = 0 }) {
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(image_url || null)

  useEffect(() => {
    if (!photo && name) {
      fetchPlacePhoto(`${name} ${country}`).then(url => { if (url) setPhoto(url) })
    }
  }, [name, country])

  return (
    <div
      onClick={() => navigate(`/explore?city=${id}`)}
      className="shrink-0 w-44 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md
        transition-all hover:-translate-y-1 border border-slate-100"
    >
      <div className={`h-28 relative bg-gradient-to-br ${CITY_GRADIENTS[index % CITY_GRADIENTS.length]}`}>
        {photo && (
          <img src={photo} alt={name} className="w-full h-full object-cover absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute top-2 right-2 bg-white/90 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
          🔥 {popularity}
        </span>
        <p className="absolute bottom-2 left-2 text-white text-xs font-bold drop-shadow">{name}</p>
      </div>
      <div className="bg-white p-3">
        <p className="font-semibold text-dark text-sm truncate">{name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={11} className="text-slate-400" />
          <p className="text-xs text-slate-400 truncate">{country}</p>
        </div>
      </div>
    </div>
  )
}

export function CityCardSkeleton() {
  return (
    <div className="shrink-0 w-44 rounded-2xl overflow-hidden border border-slate-100">
      <div className="h-28 bg-slate-100 animate-pulse" />
      <div className="bg-white p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}
