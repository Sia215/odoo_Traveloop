export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center text-white"
        style={{
          background: 'linear-gradient(135deg, #0D9488 0%, #0f766e 40%, #134e4a 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: '#F97316', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#F97316', transform: 'translate(30%, 30%)' }} />

        <div className="relative z-10 text-center px-12 fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-primary fill-current" style={{ color: '#0D9488' }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <span className="text-3xl font-bold tracking-tight">Traveloop</span>
          </div>

          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Personalized Travel<br />Planning Made Easy
          </h2>
          <p className="text-teal-100 text-lg leading-relaxed max-w-sm mx-auto">
            Organize your dream trips, stay within budget, and enjoy every journey with full visibility.
          </p>

          {/* Feature pills */}
          <div className="mt-10 flex flex-col gap-3">
            {['🗺️  Smart itinerary builder', '💰  Budget tracking', '✈️  Trip collaboration'].map((f) => (
              <div key={f} className="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 text-sm font-medium">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-dark">Traveloop</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
