export default function InputField({ label, id, icon: Icon, error, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-dark">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon size={17} />
          </span>
        )}
        <input
          id={id}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm text-dark placeholder-slate-400 outline-none transition
            focus:ring-2 focus:ring-primary/30 focus:border-primary
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
