export default function EmptyState({ icon: Icon, message, ctaLabel, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
          <Icon size={28} className="text-primary/50" />
        </div>
      )}
      <p className="text-slate-400 text-sm mb-4">{message}</p>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="bg-primary hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
