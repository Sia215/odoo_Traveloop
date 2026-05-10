import { useState } from 'react'
import { X, Clock, MapPin, Tag, DollarSign } from 'lucide-react'

const CATEGORIES = ['Sightseeing', 'Food', 'Adventure', 'Shopping', 'Transport', 'Other']

const CATEGORY_COLORS = {
  Sightseeing: 'border-blue-400',
  Food:        'border-orange-400',
  Adventure:   'border-green-400',
  Shopping:    'border-purple-400',
  Transport:   'border-slate-400',
  Other:       'border-teal-400',
}

const blank = () => ({
  name: '', description: '', category: 'Sightseeing',
  activity_time: '', duration_minutes: '', cost: '',
  currency: 'INR', is_paid: false, location_name: '',
})

/**
 * Modal form for adding / editing an activity.
 * @param {{ initial: object|null, onSave: Function, onClose: Function, saving: boolean }} props
 */
export default function ActivityModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial ? {
    name:              initial.name              || '',
    description:       initial.description       || '',
    category:          initial.category          || 'Sightseeing',
    activity_time:     initial.activity_time     || '',
    duration_minutes:  initial.duration_minutes  != null ? String(initial.duration_minutes) : '',
    cost:              initial.cost              != null ? String(initial.cost) : '',
    currency:          initial.currency          || 'INR',
    is_paid:           initial.is_paid           || false,
    location_name:     initial.location_name     || '',
  } : blank())
  const [errors, setErrors] = useState({})

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Activity name is required'
    if (form.cost && isNaN(parseFloat(form.cost))) e.cost = 'Enter a valid number'
    return e
  }

  const handleSubmit = e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      ...form,
      cost:             parseFloat(form.cost)             || 0,
      duration_minutes: parseInt(form.duration_minutes)   || null,
      activity_time:    form.activity_time                || null,
    })
  }

  const inputCls = field =>
    `w-full rounded-xl border px-3 py-2 text-sm text-dark outline-none transition
     focus:ring-2 focus:ring-primary/30 focus:border-primary
     ${errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-dark">
            {initial ? 'Edit Activity' : 'Add Activity'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Activity Name *
            </label>
            <input type="text" placeholder="e.g. Visit Eiffel Tower"
              value={form.name} onChange={set('name')} className={inputCls('name')} />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </div>

          {/* Category + Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block flex items-center gap-1">
                <Tag size={11} /> Category
              </label>
              <select value={form.category} onChange={set('category')} className={inputCls('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block flex items-center gap-1">
                <Clock size={11} /> Time
              </label>
              <input type="time" value={form.activity_time} onChange={set('activity_time')}
                className={inputCls('activity_time')} />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block flex items-center gap-1">
              <MapPin size={11} /> Location / Venue
            </label>
            <input type="text" placeholder="e.g. Champ de Mars, Paris"
              value={form.location_name} onChange={set('location_name')} className={inputCls('location_name')} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Description
            </label>
            <textarea rows={2} placeholder="Optional notes..."
              value={form.description} onChange={set('description')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-dark
                outline-none resize-none transition hover:border-slate-300
                focus:ring-2 focus:ring-primary/30 focus:border-primary" />
          </div>

          {/* Cost + Currency + Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block flex items-center gap-1">
                <DollarSign size={11} /> Cost
              </label>
              <input type="number" min="0" placeholder="0"
                value={form.cost} onChange={set('cost')}
                onKeyDown={e => e.key === '-' && e.preventDefault()}
                className={inputCls('cost')} />
              {errors.cost && <p className="text-xs text-red-500 mt-0.5">{errors.cost}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                Currency
              </label>
              <select value={form.currency} onChange={set('currency')} className={inputCls('currency')}>
                {['INR','USD','EUR','GBP','JPY','AED'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
                Duration (min)
              </label>
              <input type="number" min="0" placeholder="60"
                value={form.duration_minutes} onChange={set('duration_minutes')}
                className={inputCls('duration_minutes')} />
            </div>
          </div>

          {/* Paid toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className={`w-10 h-5 rounded-full transition-colors ${form.is_paid ? 'bg-primary' : 'bg-slate-200'}`}
              onClick={() => setForm(p => ({ ...p, is_paid: !p.is_paid }))}>
              <div className={`w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform
                ${form.is_paid ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm font-medium text-dark">Mark as Paid</span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 border border-slate-200 text-slate-500 font-semibold py-2.5 rounded-xl
                hover:bg-slate-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl
                transition flex items-center justify-center gap-2 disabled:opacity-60">
              {saving
                ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                : initial ? 'Save Changes' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { CATEGORY_COLORS, CATEGORIES }
