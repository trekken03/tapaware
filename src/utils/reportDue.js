// Due dates and "overdue" for reports, matching the promised processing time
// (ESTIMATED_PROCESSING_TEXT: 3 to 4 business days). Days are bucketed in
// Manila time, like the dashboard's weekly overview
// (backend/controllers/visualization.controller.js, manilaDateKey).

export const ESTIMATED_PROCESSING_DAYS_MAX = 4

const manilaDateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
})

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/

// Manila calendar day as "YYYY-MM-DD", or null for a missing or invalid date.
export const manilaDayKey = (value) => {
    if (value === null || value === undefined || value === '') return null
    const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'))
    return isNaN(date.getTime()) ? null : manilaDateKey.format(date)
}

// The day after `ESTIMATED_PROCESSING_DAYS_MAX` business days (Mon–Fri, no
// holiday list) counted from the day the report was made, as "YYYY-MM-DD".
// The arithmetic runs on the calendar date itself (UTC), so no time zone can
// shift it. Returns null when createdAt is missing or invalid.
export const getDueDate = (createdAt) => {
    const startKey = manilaDayKey(createdAt)
    if (!startKey) return null
    const [, year, month, day] = DAY_KEY_PATTERN.exec(startKey)
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

    let counted = 0
    while (counted < ESTIMATED_PROCESSING_DAYS_MAX) {
        date.setUTCDate(date.getUTCDate() + 1)
        const weekday = date.getUTCDay()
        if (weekday !== 0 && weekday !== 6) counted += 1
    }
    return date.toISOString().slice(0, 10)
}

// End of the scheduled visit window as an instant, or null if the schedule is missing or unreadable.
const scheduleEnd = (report) => {
    const dateText = report?.scheduled_date_text
    const timeMatch = TIME_PATTERN.exec(String(report?.scheduled_to || ''))
    if (!dateText || !DAY_KEY_PATTERN.test(dateText) || !timeMatch) return null
    const end = new Date(`${dateText}T${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3] || '00'}+08:00`)
    return isNaN(end.getTime()) ? null : end
}

// Resolved: never. Investigating with a schedule: past the end of the visit
// window. Otherwise: past the end of the due day (Manila time).
export const isOverdue = (report, now = new Date()) => {
    if (!report || report.status === 'resolved') return false

    if (report.status === 'investigating') {
        const end = scheduleEnd(report)
        if (end) return now.getTime() > end.getTime()
    }

    const dueKey = getDueDate(report.created_at)
    const todayKey = manilaDayKey(now)
    return Boolean(dueKey && todayKey && todayKey > dueKey)
}
