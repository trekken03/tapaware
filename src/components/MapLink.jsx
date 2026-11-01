import { MapPin, ExternalLink } from 'lucide-react'

const isCoordinate = (value, limit) => {
    if (value === null || value === undefined || value === '') return false
    const number = Number(value)
    return Number.isFinite(number) && Math.abs(number) <= limit
}

// "View on map" link for a saved location (opens Google Maps in a new tab).
// Renders nothing when the coordinates are missing.
const MapLink = ({ lat, lng }) => {
    if (!isCoordinate(lat, 90) || !isCoordinate(lng, 180)) return null
    const query = `${Number(lat)},${Number(lng)}`
    return (
        <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
        >
            <MapPin size={14} aria-hidden="true" />
            View on map
            <ExternalLink size={12} aria-hidden="true" />
        </a>
    )
}

export default MapLink
