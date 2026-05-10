import { useState } from 'react'
import { X } from 'lucide-react'

/**
 * Modal to set / update the total trip budget.
 * @param {{ current: number|null, onSave: Function, onClose: Function, saving: boolean }} props
 */
export default function BudgetModal({ current, onSave, onClose, saving }) {
  const [amount, setAmount] = useState(current != null ? String(current) : '')
  const [currency, setCurrency] = useState('INR')
  const [error, setError] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!amount || isNaN(val) || val <= 0) { setError('Enter a valid budget amount'); return }
    onSave({ total_budget: val, currency })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-dark">Set Trip Budget</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">
              Total Budget
            </label>
            <div className="flex gap-2">
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-dark outline-none
                  focus:ring-2 focus:ring-primary/30 focus:border-primary w-24">
                {['INR','USD','EUR','GBP','JPY','AED'].map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" min="1" placeholder="e.g. 50000"
                value={amount} onChange={e => { setAmount(e.target.value); setError('') }}
                onKeyDown={e => e.key === '-' && e.preventDefault()}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm text-dark outline-none transition
                  focus:ring-2 focus:ring-primary/30 focus:border-primary
                  ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`} />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex gap-3">
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
                : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
