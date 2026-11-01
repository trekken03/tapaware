// Small staff-facing badges for a report row, shared by the Reports list,
// Reports Maintenance and the report detail page so they look the same everywhere.

const formatDateTime = (value) => {
    const date = new Date(value)
    return isNaN(date) ? '' : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// "Followed up N times (last …)". Nothing when there are no follow-ups.
export const FollowupBadge = ({ count, lastAt }) => {
    const total = Number(count) || 0
    if (total <= 0) return null
    const last = lastAt ? formatDateTime(lastAt) : ''
    return (
        <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-800">
            Followed up {total} {total === 1 ? 'time' : 'times'}{last ? ` (last ${last})` : ''}
        </span>
    )
}
