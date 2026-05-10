import { X, GripVertical } from 'lucide-react'

/**
 * Fully controlled section card for ItineraryBuilder.
 * @param {{
 *   index: number,
 *   data: { description: string, start_date: string, end_date: string, budget: string },
 *   onChange: (index: number, field: string, value: string) => void,
 *   onRemove: (index: number) => void,
 *   showRemove: boolean,
 *   tripStartDate: string,
 *   tripEndDate: string,
 *   errors: { start_date?: string, end_date?: string, budget?: string },
 *   isDragging: boolean,
 * }} props
 */
export default function SectionCard({
  index, data, onChange, onRemove, showRemove,
  tripStartDate, tripEndDate, errors = {}, isDragging = false,
}) {
  const handle = (field) => (e) => onChange(index, field, e.target.value)

  const inputCls = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-dark outline-none transition
     hover:border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary
     ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'}`

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm transition-all duration-200
        ${isDragging ? 'opacity-40 border-2 border-dashed border-primary' : 'border border-primary/20'}
      `}
      style={!isDragging ? { borderColor: 'rgba(13,148,136,0.25)' } : {}}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GripVertical
            size={16}
            className="text-slate-300 cursor-grab active:cursor-grabbing shrink-0"
          />
          <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-dark">Section {index + 1}</span>
        </div>
        {showRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400
              hover:text-red-500 hover:bg-red-50 transition"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Description */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Description / Notes
          </label>
          <textarea
            rows={2}
            placeholder="Travel section, hotel, activity or any note..."
            value={data.description}
            onChange={handle('description')}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-dark
              placeholder-slate-400 outline-none resize-none transition
              hover:border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">From</label>
            <input
              type="date"
              value={data.start_date}
              min={tripStartDate}
              max={tripEndDate}
              onChange={handle('start_date')}
              className={inputCls('start_date')}
            />
            {errors.start_date && (
              <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>{errors.start_date}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">To</label>
            <input
              type="date"
              value={data.end_date}
              min={data.start_date || tripStartDate}
              max={tripEndDate}
              onChange={handle('end_date')}
              className={inputCls('end_date')}
            />
            {errors.end_date && (
              <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>{errors.end_date}</p>
            )}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Budget for this section
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              ₹
            </span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={data.budget}
              onChange={handle('budget')}
              onKeyDown={(e) => e.key === '-' && e.preventDefault()}
              className={`${inputCls('budget')} pl-7 pr-3`}
            />
          </div>
          {errors.budget && (
            <p className="text-xs mt-0.5" style={{ color: '#EF4444' }}>{errors.budget}</p>
          )}
        </div>
      </div>
    </div>
  )
}
