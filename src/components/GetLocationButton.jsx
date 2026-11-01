import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin } from 'lucide-react'

const ERROR_MESSAGES = {
    1: 'Location is blocked. Allow it in your browser settings, then try again.',
    2: 'Could not find your location. Try again outdoors or on your phone.',
    3: 'Getting location took too long. Try again.',
}
const NOT_SUPPORTED = 'This browser does not support location.'

// Optional location, asked for only when the user taps the button. The parent
// keeps the coordinates (onChange gets { latitude, longitude, accuracy } or null;
// accuracy is in whole metres, or null if the browser gave none) and
// decides what to send; this component only handles asking and showing status.
// Used by the Resolved status dialog and the Add TDS Reading form.
const GetLocationButton = ({ hasLocation, onChange }) => {
    const [status, setStatus] = useState('idle') // idle | getting | error
    const [accuracy, setAccuracy] = useState(null)
    const [errorMessage, setErrorMessage] = useState('')
    const mounted = useRef(true)

    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])

    const getLocation = () => {
        if (!navigator.geolocation) {
            onChange(null)
            setErrorMessage(NOT_SUPPORTED)
            setStatus('error')
            return
        }
        setStatus('getting')
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!mounted.current) return
                const metres = Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null
                setAccuracy(metres)
                setStatus('idle')
                onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: metres })
            },
            (error) => {
                if (!mounted.current) return
                // A failed "Get again" must not leave the earlier location to be sent.
                onChange(null)
                setAccuracy(null)
                setErrorMessage(ERROR_MESSAGES[error?.code] || ERROR_MESSAGES[2])
                setStatus('error')
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }

    const clear = () => {
        onChange(null)
        setAccuracy(null)
        setStatus('idle')
    }

    const linkClass = 'text-xs font-medium text-blue-700 underline underline-offset-2 hover:cursor-pointer disabled:opacity-50'

    if (status === 'getting') {
        return (
            <Button type="button" variant="outline" size="sm" disabled className="gap-1">
                <MapPin size={14} aria-hidden="true" />
                Getting location…
            </Button>
        )
    }

    if (hasLocation) {
        return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" role="status">
                <span className="inline-flex items-center gap-1 font-medium text-green-700">
                    <MapPin size={12} aria-hidden="true" />
                    {accuracy !== null ? `Location saved (±${accuracy} m)` : 'Location saved'}
                </span>
                <button type="button" className={linkClass} onClick={getLocation}>Get again</button>
                <button type="button" className={linkClass} onClick={clear}>Clear</button>
            </div>
        )
    }

    return (
        <div className="space-y-1">
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={getLocation}>
                <MapPin size={14} aria-hidden="true" />
                {status === 'error' ? 'Try again' : 'Get location'}
            </Button>
            {status === 'error' ? (
                <p className="text-xs text-red-600" role="alert">{errorMessage}</p>
            ) : (
                <p className="text-xs text-gray-500">Optional. The location is saved only if you tap the button.</p>
            )}
        </div>
    )
}

export default GetLocationButton
