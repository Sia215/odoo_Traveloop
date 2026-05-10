export default function SectionHeading({ title, ctaLabel, onCta }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-dark">{title}</h2>
      {ctaLabel && (
        <button
          onClick={onCta}
          className="text-sm text-primary font-medium hover:underline"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
