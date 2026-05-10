import { useNavigate } from 'react-router-dom'
import { Plane } from 'lucide-react'
import SectionHeading from './SectionHeading'
import EmptyState from './EmptyState'
import TripCard from './TripCard'

export default function TripGallery({ title, trips, emptyMessage }) {
  const navigate = useNavigate()

  return (
    <section>
      <SectionHeading title={title} />
      {trips.length === 0 ? (
        <EmptyState icon={Plane} message={emptyMessage} />
      ) : (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {trips.map((trip, i) => (
              <div key={trip.id} className="shrink-0 w-60">
                <TripCard
                  {...trip}
                  index={i}
                  onView={(id) => navigate(`/itinerary-builder/${id}`)}
                  onEdit={(id) => navigate(`/create-trip?edit=${id}`)}
                  onDelete={null}
                />
              </div>
            ))}
          </div>
          {/* Right fade hint */}
          {trips.length > 3 && (
            <div className="absolute right-0 top-0 bottom-3 w-10 pointer-events-none
              bg-gradient-to-l from-background to-transparent" />
          )}
        </div>
      )}
    </section>
  )
}
