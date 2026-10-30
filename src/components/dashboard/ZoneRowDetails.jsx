const STALE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

const manilaShortDate = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' })

const chip = 'rounded-full px-2 py-0.5 text-[11px] font-semibold'

// Same thresholds as the dashboard's tdsColors helper.
const statusChip = (tds) => {
    const value = Number(tds)
    if (!value) return null
    if (value <= 500) return { label: 'Safe', className: 'bg-green-100 text-green-800' }
    if (value <= 1000) return { label: 'Acceptable', className: 'bg-yellow-100 text-yellow-800' }
    return { label: 'High', className: 'bg-red-100 text-red-800' }
}

// Extra line under one row of the "Average TDS by Zone" card. Renders nothing without
// data, so the card looks exactly as before when the weekly overview isn't available.
const ZoneRowDetails = ({ info }) => {
    if (!info) return null

    const recorded = info.last_recorded
        ? new Date(typeof info.last_recorded === 'string' ? info.last_recorded.replace(' ', 'T') : info.last_recorded)
        : null
    const hasReading = recorded && !isNaN(recorded)
    const isStale = hasReading && Date.now() - recorded.getTime() > STALE_DAYS * DAY_MS
    const status = hasReading ? statusChip(info.average_tds) : null
    const openReports = Number(info.open_reports) || 0

    return (
        <div className="-mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pb-3 text-xs text-gray-600">
            {status && <span className={`${chip} ${status.className}`}>{status.label}</span>}
            {hasReading ? (
                <span>Last reading: {manilaShortDate.format(recorded)}</span>
            ) : (
                <span className={`${chip} bg-gray-100 text-gray-700`}>No readings</span>
            )}
            {isStale && <span className={`${chip} bg-amber-100 text-amber-800`}>Stale</span>}
            <span>{openReports} open {openReports === 1 ? 'report' : 'reports'}</span>
        </div>
    )
}

export default ZoneRowDetails
