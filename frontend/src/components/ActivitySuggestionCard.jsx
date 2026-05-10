import { Check } from 'lucide-react'

const CATEGORY_COLORS = {
  Sightseeing: 'bg-blue-50 text-blue-600',
  Food:        'bg-orange-50 text-orange-600',
  Nature:      'bg-green-50 text-green-600',
  Culture:     'bg-violet-50 text-violet-600',
  Adventure:   'bg-red-50 text-red-600',
}

const GRADIENTS = [
  'from-teal-400 to-cyan-300',
  'from-orange-400 to-amber-300',
  'from-violet-400 to-purple-300',
  'from-rose-400 to-pink-300',
  'from-blue-400 to-indigo-300',
  'from-green-400 to-emerald-300',
]

export default function ActivitySuggestionCard({ id, name, category, estimated_cost, image_url, isSelected, onToggle, index = 0 }) {
  return (
    <div
      onClick={() => onToggle(id)}
      className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all
        ${isSelected ? 'border-primary shadow-md shadow-teal-100' : 'border-slate-100 hover:border-primary/40 hover:shadow-sm'}`}
    >
      {/* Image / gradient */}
      <div className={`h-24 bg-gradient-to-br ${GRADIENTS[index % GRADIENTS.length]} relative`}>
        {image_url && (
          <img src={image_url} alt={name} className="w-full h-full object-cover absolute inset-0" />
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow">
            <Check size={13} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white p-3">
        <p className="text-sm font-semibold text-dark truncate mb-1.5">{name}</p>
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category] ?? 'bg-slate-100 text-slate-500'}`}>
            {category}
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            {estimated_cost > 0 ? `$${estimated_cost}` : 'Free'}
          </span>
        </div>
      </div>

      {/* Add button overlay */}
      <div className={`absolute bottom-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full transition
        ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
        {isSelected ? '✓ Added' : '+ Add'}
      </div>
    </div>
  )
}

export function ActivitySuggestionSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-100">
      <div className="h-24 bg-slate-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  )
}
