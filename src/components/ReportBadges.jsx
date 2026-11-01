// Small staff-facing badges for a report row, shared by the Reports list,
// Reports Maintenance and the report detail page so they look the same everywhere.

const formatDateTime = (value) => {
    const date = new Date(value)
    return isNaN(date) ? '' : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export const formatConfirmationDate = (value) => {
    const date = new Date(value)
    return isNaN(date) ? '' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Resident confirmation state of a resolved report, as derived by the API
// (`confirmation`). Nothing when the report has no confirmation state.
const CONFIRMATION_STYLES = {
    awaiting: 'bg-sky-100 text-sky-800',
    confirmed: 'bg-green-100 text-green-800',
    auto_confirmed: 'bg-gray-100 text-gray-700',
    reopened: 'bg-rose-100 text-rose-800',
}

export const ConfirmationBadge = ({ confirmation }) => {
    if (!confirmation || !CONFIRMATION_STYLES[confirmation.state]) return null
    const label = {
        awaiting: `Awaiting confirmation${confirmation.deadline ? ` (until ${formatConfirmationDate(confirmation.deadline)})` : ''}`,
        confirmed: 'Confirmed',
        auto_confirmed: 'Auto-confirmed',
        reopened: 'Reopened by resident',
    }[confirmation.state]
    return (
        <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${CONFIRMATION_STYLES[confirmation.state]}`}>
            {label}
        </span>
    )
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
