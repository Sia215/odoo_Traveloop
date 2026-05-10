import { Search, X } from 'lucide-react'

const SORT_OPTIONS = [
  { value: '',          label: 'Sort by' },
  { value: 'cost_asc',  label: 'Cost: Low → High' },
  { value: 'cost_desc', label: 'Cost: High → Low' },
  { value: 'rating',    label: 'Top Rated' },
  { value: 'duration',  label: 'Shortest First' },
]

const inputCls = (active) =>
  `h-10 px-3 text-sm rounded-xl border bg-white text-[#1E293B] outline-none transition
   ${active ? 'border-[#0D9488] ring-1 ring-[#0D9488]' : 'border-slate-200 focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]'}`

export default function ActivityFilterBar({ filters, onFilterChange, categories, cities }) {
  const set = (key, val) => onFilterChange({ ...filters, [key]: val })

  const activeCount = Object.values(filters).filter(v => v !== '').length

  const clear = () => onFilterChange({
    search: '', category: '', city: '',
    min_cost: '', max_cost: '', max_duration: '', sort: '',
  })

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex flex-wrap gap-3 items-center">

        {/* Search */}
        <div className={`flex items-center gap-2 h-10 px-3 rounded-xl border bg-white flex-1 min-w-[180px] transition
          ${filters.search
            ? 'border-[#0D9488] ring-1 ring-[#0D9488]'
            : 'border-slate-200 focus-within:border-[#0D9488] focus-within:ring-1 focus-within:ring-[#0D9488]'}`}>
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search activities..."
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            className="flex-1 text-sm text-[#1E293B] placeholder-slate-400 outline-none bg-transparent"
          />
          {filters.search && (
            <button onClick={() => set('search', '')} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={e => set('category', e.target.value)}
          className={inputCls(!!filters.category)}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* City */}
        <select
          value={filters.city}
          onChange={e => set('city', e.target.value)}
          className={inputCls(!!filters.city)}
        >
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Max Cost */}
        <input
          type="number"
          placeholder="Max cost (₹)"
          value={filters.max_cost}
          onChange={e => set('max_cost', e.target.value)}
          min={0}
          className={`${inputCls(!!filters.max_cost)} w-32`}
        />

        {/* Max Duration */}
        <input
          type="number"
          placeholder="Max hours"
          value={filters.max_duration}
          onChange={e => set('max_duration', e.target.value)}
          min={0}
          step={0.5}
          className={`${inputCls(!!filters.max_duration)} w-28`}
        />

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={e => set('sort', e.target.value)}
          className={inputCls(!!filters.sort)}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Clear */}
        {activeCount > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 h-10 px-3 text-sm font-medium text-[#0D9488] border border-[#0D9488] rounded-xl hover:bg-teal-50 transition whitespace-nowrap"
          >
            <X size={14} />Clear ({activeCount})
          </button>
        )}
      </div>
    </div>
  )
}
