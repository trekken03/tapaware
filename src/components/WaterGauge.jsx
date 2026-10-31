const getGaugeStatus = (value) => {
    if (value <= 500) return { label: 'Safe', color: '#16a34a', bg: '#dcfce7' }
    if (value <= 1000) return { label: 'Moderate', color: '#ca8a04', bg: '#fef9c3' }
    return { label: 'High', color: '#dc2626', bg: '#fee2e2' }
}

// Shown instead of a status when a zone has no readings, so an empty zone never reads as "0 ppm, Safe".
const EMPTY_STATUS = { label: 'No readings yet', color: '#6b7280', bg: '#f3f4f6' }

const WaterGauge = ({ value, label, sublabel, size = 140, maxScale = 1500, empty = false }) => {
    const status = empty ? EMPTY_STATUS : getGaugeStatus(value)
    const radius = (size - 16) / 2
    const circumference = 2 * Math.PI * radius
    const percentFilled = empty ? 0 : Math.min(value / maxScale, 1)
    const dashOffset = circumference * (1 - percentFilled)

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="#e5edf5"
                        strokeWidth="10"
                    />
                    {!empty && (
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={status.color}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black tracking-tight" style={{ color: status.color }}>
                        {empty ? '—' : Math.round(value)}
                    </span>
                    {!empty && <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">ppm</span>}
                </div>
            </div>
            <div className="text-center">
                <p className="font-bold text-gray-900 text-sm">{label}</p>
                {sublabel && <p className="text-xs text-gray-500">{sublabel}</p>}
                <span
                    className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold"
                    style={{ color: status.color, backgroundColor: status.bg }}
                >
                    {status.label}
                </span>
            </div>
        </div>
    )
}

export default WaterGauge
export { getGaugeStatus }