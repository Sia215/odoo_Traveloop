import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, FileText, CheckCircle, Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import AdminLayout from '../components/AdminLayout'

const INVOICE = {
  id: 'INV-xyz-30290',
  trip: 'Trip to Europe Adventures',
  dateRange: 'Jun 12 – Jun 28, 2025',
  cities: 4,
  createdBy: 'james_t',
  generatedDate: 'Jun 10, 2025',
  coverImg: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=120&q=80',
  travelers: ['James', 'Arjun', 'Jerry', 'Cristina'],
  status: 'Pending', // 'Pending' | 'Paid'
}

const LINE_ITEMS = [
  { id: 1, category: 'Hotel',  description: 'Hotel booking Paris',        details: '3 nights', unitCost: 3000,  amount: 9000  },
  { id: 2, category: 'Travel', description: 'Flight bookings (DEL → PAR)', details: '1',        unitCost: 12000, amount: 12000 },
]

const BUDGET = { total: 25000, spent: 21000 }
const remaining = BUDGET.total - BUDGET.spent
const PIE_DATA = [
  { name: 'Spent',     value: BUDGET.spent },
  { name: 'Remaining', value: Math.max(remaining, 0) },
]
const PIE_COLORS = ['#14B8A6', '#E2E8F0']

const subtotal  = LINE_ITEMS.reduce((s, r) => s + r.amount, 0)
const tax       = subtotal * 0.05
const discount  = 500
const grandTotal = subtotal + tax - discount

const fmt = n => `$${n.toLocaleString()}`

export default function AdminInvoice() {
  const [status, setStatus] = useState(INVOICE.status)
  const [search, setSearch] = useState('')

  return (
    <AdminLayout>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl outline-none
              focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6]"
          />
        </div>
        <button className="flex items-center gap-1.5 text-sm border border-slate-200 px-3 py-2 rounded-xl hover:border-[#14B8A6] hover:text-[#14B8A6] transition">
          <SlidersHorizontal size={14} /> Filter
        </button>
        <button className="flex items-center gap-1.5 text-sm border border-slate-200 px-3 py-2 rounded-xl hover:border-[#14B8A6] hover:text-[#14B8A6] transition">
          <ArrowUpDown size={14} /> Sort
        </button>
      </div>

      {/* ── Back nav ────────────────────────────────────────── */}
      <Link to="/my-trips" className="inline-flex items-center gap-1 text-sm text-[#14B8A6] hover:underline mb-5">
        ← Back to My Trips
      </Link>

      {/* ── Main grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Invoice card ──────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Trip header */}
          <div className="flex items-start gap-4 p-6 border-b border-slate-100">
            <img
              src={INVOICE.coverImg}
              alt="trip"
              className="w-20 h-20 rounded-xl object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[#0F172A] truncate">{INVOICE.trip}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {INVOICE.dateRange} &nbsp;·&nbsp; {INVOICE.cities} cities &nbsp;·&nbsp; by&nbsp;
                <span className="font-medium text-[#0F172A]">@{INVOICE.createdBy}</span>
              </p>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                <span><span className="font-semibold text-slate-700">Invoice ID:</span> {INVOICE.id}</span>
                <span><span className="font-semibold text-slate-700">Generated:</span> {INVOICE.generatedDate}</span>
                <span className="col-span-2">
                  <span className="font-semibold text-slate-700">Travelers:</span>{' '}
                  {INVOICE.travelers.join(', ')}
                </span>
              </div>
            </div>
            {/* Status badge */}
            <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full
              ${status === 'Paid'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'}`}>
              {status}
            </span>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-xs text-slate-400 font-medium">
                  {['#', 'Category', 'Description', 'Qty / Details', 'Unit Cost', 'Amount'].map(h => (
                    <th key={h} className="text-left px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LINE_ITEMS.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    <td className="px-5 py-3.5 text-slate-400">{row.id}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold bg-[#F0FDFA] text-[#0D9488] px-2 py-0.5 rounded-full">
                        {row.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#0F172A]">{row.description}</td>
                    <td className="px-5 py-3.5 text-slate-500">{row.details}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmt(row.unitCost)}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#0F172A]">{fmt(row.amount)}</td>
                  </tr>
                ))}
                {/* Empty spacing rows */}
                {[...Array(2)].map((_, i) => (
                  <tr key={`empty-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-3.5 text-transparent select-none">—</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary + Actions */}
          <div className="p-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">

              {/* Summary */}
              <div className="space-y-1.5 text-sm min-w-[220px]">
                {[
                  { label: 'Subtotal',  value: fmt(subtotal) },
                  { label: 'Tax (5%)', value: fmt(tax) },
                  { label: 'Discount',  value: `-${fmt(discount)}` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-slate-500">
                    <span>{r.label}</span><span>{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base text-[#0F172A] border-t border-slate-200 pt-2 mt-2">
                  <span>Grand Total</span><span>{fmt(grandTotal)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-1.5 text-sm font-semibold border border-slate-300 text-slate-600
                  px-4 py-2 rounded-xl hover:border-[#14B8A6] hover:text-[#14B8A6] transition">
                  <Download size={14} /> Download Invoice
                </button>
                <button className="flex items-center gap-1.5 text-sm font-semibold border border-slate-300 text-slate-600
                  px-4 py-2 rounded-xl hover:border-[#14B8A6] hover:text-[#14B8A6] transition">
                  <FileText size={14} /> Export as PDF
                </button>
                <button
                  onClick={() => setStatus('Paid')}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-[#14B8A6] text-white
                    px-4 py-2 rounded-xl hover:bg-[#0D9488] transition disabled:opacity-60"
                  disabled={status === 'Paid'}
                >
                  <CheckCircle size={14} /> Mark as Paid
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Budget Insights ──────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-5">
          <h3 className="text-base font-bold text-[#0F172A]">Budget Insights</h3>

          {/* Pie chart */}
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
              >
                {PIE_DATA.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={v => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex justify-center gap-5 text-xs text-slate-500 -mt-2">
            {PIE_DATA.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                {d.name}
              </div>
            ))}
          </div>

          {/* Budget rows */}
          <div className="space-y-3 text-sm">
            {[
              { label: 'Total Budget', value: fmt(BUDGET.total), color: 'text-[#0F172A]' },
              { label: 'Total Spent',  value: fmt(BUDGET.spent),  color: 'text-[#0F172A]' },
              {
                label: 'Remaining',
                value: fmt(Math.abs(remaining)),
                color: remaining < 0 ? 'text-red-500 font-bold' : 'text-green-600 font-semibold',
                prefix: remaining < 0 ? '−' : '',
              },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0">
                <span className="text-slate-500">{r.label}</span>
                <span className={r.color}>{r.prefix}{r.value}</span>
              </div>
            ))}
          </div>

          <Link
            to="/my-trips"
            className="mt-auto block text-center bg-[#14B8A6] hover:bg-[#0D9488] text-white
              text-sm font-semibold py-2.5 rounded-xl transition"
          >
            View Full Budget
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}
