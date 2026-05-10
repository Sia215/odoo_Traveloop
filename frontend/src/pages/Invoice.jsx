import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, FileText, CheckCircle, ArrowLeft, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { fetchPlacePhoto } from '../lib/unsplash'
import Navbar from '../components/Navbar'

const API = import.meta.env.VITE_API_URL
const PIE_COLORS = ['#14B8A6', '#E2E8F0']

const TAX_RATE = 0.05
const DISCOUNT = 500

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return { Authorization: `Bearer ${session?.access_token}` }
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('en-US')
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function generateInvoiceId(tripId) {
  return 'INV-' + (tripId || '').slice(0, 8).toUpperCase()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryRow({ label, value, valueClass = 'text-slate-600' }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}

function BudgetRow({ label, value, valueClass = 'text-slate-700' }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    Paid:    'bg-green-100 text-green-700 border border-green-200',
    Pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${styles[status] ?? styles.Pending}`}>
      {status}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Invoice() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip]         = useState(null)
  const [sections, setSections] = useState([])
  const [profile, setProfile]   = useState(null)
  const [coverPhoto, setCoverPhoto] = useState(null)
  const [status, setStatus]     = useState('Pending')
  const [loading, setLoading]   = useState(true)
  const [marking, setMarking]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const headers = await authHeaders()

      const [tripRes, sectionsRes, profileRes] = await Promise.all([
        fetch(`${API}/api/trips/${tripId}`, { headers }),
        fetch(`${API}/api/trips/${tripId}/sections`, { headers }),
        fetch(`${API}/api/auth/me`, { headers }),
      ])

      const [tripData, sectionsData, profileData] = await Promise.all([
        tripRes.json(), sectionsRes.json(), profileRes.json(),
      ])

      if (!tripData.success) { toast.error('Trip not found'); navigate('/trips'); return }

      setTrip(tripData.trip)
      setSections(sectionsData.success ? sectionsData.sections : [])
      if (profileData.success) setProfile(profileData.user)

      // fetch cover photo
      if (tripData.trip.cover_photo) {
        setCoverPhoto(tripData.trip.cover_photo)
      } else {
        const url = await fetchPlacePhoto(tripData.trip.name)
        if (url) setCoverPhoto(url)
      }
    } catch {
      toast.error('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }, [tripId, navigate])

  useEffect(() => { load() }, [load])

  const handleMarkPaid = async () => {
    setMarking(true)
    // optimistic toggle — no dedicated endpoint needed
    setStatus(s => s === 'Paid' ? 'Pending' : 'Paid')
    toast.success(status === 'Paid' ? 'Marked as Pending' : 'Marked as Paid')
    setMarking(false)
  }

  const handlePrint = () => window.print()

  // ── Derived values ──────────────────────────────────────────────────────────
  const lineItems = sections.map((s, i) => ({
    id:       i + 1,
    category: s.description?.split(' ')[0] || 'General',
    desc:     s.description || `Section ${i + 1}`,
    detail:   s.start_date && s.end_date
      ? `${formatDate(s.start_date)} – ${formatDate(s.end_date)}`
      : '—',
    unit:   parseFloat(s.budget) || 0,
    qty:    1,
    amount: parseFloat(s.budget) || 0,
  }))

  const subtotal   = lineItems.reduce((sum, r) => sum + r.amount, 0)
  const taxAmt     = subtotal * TAX_RATE
  const grand      = subtotal + taxAmt - DISCOUNT
  const totalBudget = subtotal   // treat sum of section budgets as total budget
  const totalSpent  = grand
  const remaining   = totalBudget - totalSpent
  const overBudget  = remaining < 0

  const pieData = [
    { name: 'Spent',     value: Math.min(totalSpent, totalBudget) || 1 },
    { name: 'Remaining', value: Math.max(remaining, 0) },
  ]

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-slate-100" />
        ))}
      </div>
    </div>
  )

  if (!trip) return null

  const invoiceId = generateInvoiceId(trip.id)
  const creatorName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
    : 'Traveler'

  return (
    <div className="min-h-screen bg-[#F1F5F9] print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 fade-in">

        {/* Back nav */}
        <Link
          to="/trips"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#14B8A6] transition mb-5 print:hidden"
        >
          <ArrowLeft size={15} /> Back to My Trips
        </Link>

        {/* Print header (hidden on screen) */}
        <div className="hidden print:flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#14B8A6] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">T</span>
          </div>
          <span className="text-xl font-bold text-[#0F172A]">Traveloop</span>
          <span className="ml-auto text-sm text-slate-500">{invoiceId}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Main Invoice Card ─────────────────────────────────────────── */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

            {/* Trip header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex gap-4">
                {/* Cover thumbnail */}
                <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-teal-400 to-cyan-300">
                  {coverPhoto && (
                    <img src={coverPhoto} alt={trip.name} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Trip info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h1 className="text-lg font-bold text-slate-800 truncate">{trip.name}</h1>
                    <StatusBadge status={status} />
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                    {trip.destination_count > 0 && ` · ${trip.destination_count} ${trip.destination_count === 1 ? 'city' : 'cities'}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Created by {creatorName}</p>
                </div>
              </div>

              {/* Invoice meta */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                <span><span className="font-semibold text-slate-700">Invoice ID:</span> {invoiceId}</span>
                <span><span className="font-semibold text-slate-700">Generated:</span> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Traveler row */}
            <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide shrink-0">Traveler:</span>
              <span className="px-2.5 py-0.5 bg-teal-50 text-[#14B8A6] text-xs font-medium rounded-full">
                {creatorName}
              </span>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0F172A] text-white text-xs font-semibold uppercase tracking-wide">
                    {['#', 'Category', 'Description', 'Qty / Details', 'Unit Cost', 'Amount'].map(h => (
                      <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                        No budget sections added yet.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="px-4 py-3 text-slate-400">{row.id}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#14B8A6] text-xs font-medium">
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{row.desc}</td>
                        <td className="px-4 py-3 text-slate-500">{row.detail}</td>
                        <td className="px-4 py-3 text-slate-700">{fmt(row.unit)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{fmt(row.amount)}</td>
                      </tr>
                    ))
                  )}

                  {/* Empty spacing rows */}
                  {Array.from({ length: Math.max(0, 4 - lineItems.length) }).map((_, n) => (
                    <tr key={`empty-${n}`} className={n % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      {Array(6).fill(null).map((_, ci) => (
                        <td key={ci} className="px-4 py-3 text-transparent select-none">—</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary + Actions */}
            <div className="px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-6">

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 items-end print:hidden">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-[#14B8A6] hover:text-[#14B8A6] transition"
                >
                  <Download size={15} /> Download Invoice
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:border-[#14B8A6] hover:text-[#14B8A6] transition"
                >
                  <FileText size={15} /> Export as PDF
                </button>
                <button
                  onClick={handleMarkPaid}
                  disabled={marking}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-semibold transition disabled:opacity-60"
                >
                  <CheckCircle size={15} />
                  {status === 'Paid' ? 'Mark as Pending' : 'Mark as Paid'}
                </button>
              </div>

              {/* Summary block */}
              <div className="min-w-[220px] space-y-2">
                <SummaryRow label="Subtotal"          value={fmt(subtotal)} />
                <SummaryRow label={`Tax (${TAX_RATE * 100}%)`} value={fmt(taxAmt)} />
                <SummaryRow label="Discount"          value={`-${fmt(DISCOUNT)}`} valueClass="text-green-600" />
                <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-base">Grand Total</span>
                  <span className="font-bold text-[#14B8A6] text-xl">{fmt(grand)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Budget Insights Panel ─────────────────────────────────────── */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-sm font-bold text-slate-700 mb-1">Budget Insights</h2>
              <p className="text-xs text-slate-400 mb-4">Based on section budgets vs. final total</p>

              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={76}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex justify-center gap-4 mt-1 mb-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] inline-block" />Spent
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />Remaining
                </span>
              </div>

              <div className="space-y-0">
                <BudgetRow label="Total Budget" value={fmt(totalBudget)} />
                <BudgetRow label="Total Spent"  value={fmt(totalSpent)} />
                <BudgetRow
                  label="Remaining"
                  value={`${overBudget ? '-' : ''}${fmt(Math.abs(remaining))}`}
                  valueClass={overBudget ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}
                />
              </div>

              <Link
                to={`/itinerary-builder/${tripId}`}
                className="mt-4 flex items-center justify-center w-full bg-[#14B8A6] hover:bg-teal-600 text-white text-sm font-semibold py-2.5 rounded-xl transition"
              >
                View Full Budget
              </Link>
            </div>

            {/* Quick info card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-3 text-sm print:hidden">
              <h3 className="font-bold text-slate-700 text-sm">Invoice Details</h3>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Invoice ID</span>
                  <span className="font-medium text-slate-700">{invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <StatusBadge status={status} />
                </div>
                <div className="flex justify-between">
                  <span>Sections</span>
                  <span className="font-medium text-slate-700">{sections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trip Duration</span>
                  <span className="font-medium text-slate-700">
                    {trip.start_date && trip.end_date
                      ? `${Math.ceil((new Date(trip.end_date) - new Date(trip.start_date)) / 86400000)} days`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:flex { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
