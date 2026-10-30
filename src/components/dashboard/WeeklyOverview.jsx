import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Droplets, UserPlus, ClockFading, BarChart3, AlertTriangle, Flag, MessageSquare, ChevronRight, CircleCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'

const BAR_MAX_PX = 96

const compareCaption = (last7, previous7) => {
    const diff = last7 - previous7
    if (diff > 0) return `${diff} more than before`
    if (diff < 0) return `${-diff} fewer than before`
    return 'Same as before'
}

const issueLabel = (issue) => issue.charAt(0).toUpperCase() + issue.slice(1)

// Same family as the dashboard's top stat cards (border, gradient, solid badge, colored title),
// one step smaller. Text shades are darkened where the top row's shade would drop below 4.5:1.
const TONES = {
    blue: { border: 'border-blue-300', gradient: 'from-white to-blue-100', badge: 'bg-blue-400', title: 'text-blue-800', value: 'text-blue-900' },
    green: { border: 'border-green-400', gradient: 'from-white to-green-100', badge: 'bg-green-600', title: 'text-green-800', value: 'text-green-800' },
    purple: { border: 'border-purple-400', gradient: 'from-white to-purple-100', badge: 'bg-purple-700', title: 'text-purple-700', value: 'text-purple-700' },
    amber: { border: 'border-amber-300', gradient: 'from-white to-amber-100', badge: 'bg-amber-400', title: 'text-amber-700', value: 'text-amber-700' },
    gray: { border: 'border-gray-300', gradient: 'from-white to-gray-100', badge: 'bg-gray-500', title: 'text-gray-700', value: 'text-gray-900' },
}

const StatTile = ({ icon: Icon, label, value, caption, tag, tone }) => {
    const t = TONES[tone]
    return (
        <div className={`rounded-xl border ${t.border} bg-gradient-to-b ${t.gradient} p-3 shadow-sm`}>
            <div className="flex items-start gap-3">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${t.badge}`}>
                    <Icon size={18} className="text-white" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                    <p className={`flex flex-wrap items-center gap-2 text-sm font-semibold ${t.title}`}>
                        {label}
                        {tag && <span className="rounded-full bg-purple-200 px-2 py-0.5 text-[11px] font-semibold text-purple-900">{tag}</span>}
                    </p>
                    <p className={`mt-1 text-2xl font-bold ${t.value}`}>{value}</p>
                    <p className="mt-1 text-xs text-gray-600">{caption}</p>
                </div>
            </div>
        </div>
    )
}

const AttentionRow = ({ icon: Icon, label, count, to }) => {
    const muted = count === 0
    const content = (
        <>
            <Icon size={18} className={muted ? 'text-gray-400' : 'text-blue-700'} aria-hidden="true" />
            <span className={`flex-1 text-sm ${muted ? 'text-gray-500' : 'font-medium text-gray-800'}`}>{label}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${muted ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                {count}
            </span>
            {to && <ChevronRight size={16} className="text-gray-400" aria-hidden="true" />}
        </>
    )
    const rowClass = 'flex min-h-11 items-center gap-3 rounded-lg px-2 py-2'

    if (!to) return <li className={rowClass}>{content}</li>
    return (
        <li>
            <Link to={to} className={`${rowClass} hover:cursor-pointer hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-blue-600`}>
                {content}
            </Link>
        </li>
    )
}

const Skeleton = () => (
    <div className="mb-8" aria-busy="true" aria-label="Loading weekly overview">
        <div className="mb-3 h-6 w-32 rounded bg-gray-200" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-4">
            {[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-100" />)}
        </div>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4">
            <div className="h-56 rounded-xl bg-gray-100" />
            <div className="h-56 rounded-xl bg-gray-100" />
        </div>
    </div>
)

// Read-only "last 7 days" section for the staff and admin dashboards. It fetches its own data.
const WeeklyOverview = () => {
    const { user } = useAuth()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let ignore = false
        API.get('/visualization/dashboard-week')
            .then((res) => {
                if (ignore) return
                setData(res.data)
            })
            .catch(() => {
                if (!ignore) setFailed(true)
            })
            .finally(() => {
                if (!ignore) setLoading(false)
            })
        return () => { ignore = true }
    }, [])

    if (loading) return <Skeleton />
    if (failed || !data) {
        return <p className="mb-8 text-sm text-gray-500">Couldn&rsquo;t load the weekly overview.</p>
    }

    const { reports, tds_readings: readings, follow_up: followUp, admin } = data
    const maxPerDay = Math.max(0, ...reports.per_day.map((d) => d.count))
    const chartLabel = `Reports per day, last 7 days: ${reports.per_day.map((d) => `${d.label} ${d.count}`).join(', ')}`

    const summaryParts = []
    if (reports.top_issue) {
        summaryParts.push(`Top issue: ${issueLabel(reports.top_issue.issue_type)} (${reports.top_issue.count} of ${reports.last7}).`)
    }
    if (reports.busiest_zone) {
        summaryParts.push(`Busiest zone: Zone ${reports.busiest_zone.zone}.`)
    }

    const attentionRows = [
        { icon: Flag, label: 'Flagged households', count: data.flagged_households, to: user?.role === 'admin' ? '/admin?tab=flagged' : null },
        { icon: ClockFading, label: `Open reports over ${followUp.threshold_days} days`, count: followUp.count, to: '/reports' },
        ...(admin ? [
            { icon: MessageSquare, label: 'New concerns', count: admin.concerns_new, to: '/admin?tab=concerns' },
            { icon: UserPlus, label: 'Account requests waiting', count: admin.account_requests_pending, to: '/admin?tab=requests' },
        ] : []),
    ]
    const nothingWaiting = attentionRows.every((row) => row.count === 0)

    return (
        <section className="mb-8" aria-labelledby="weekly-overview-heading">
            <h2 id="weekly-overview-heading" className="mb-3 text-lg font-semibold text-gray-900">Last 7 days</h2>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-4">
                <StatTile icon={FileText} tone="blue" label="New reports" value={reports.last7} caption={compareCaption(reports.last7, reports.previous7)} />
                <StatTile icon={Droplets} tone="green" label="TDS readings" value={readings.last7} caption={compareCaption(readings.last7, readings.previous7)} />
                {admin && (
                    <StatTile icon={UserPlus} tone="purple" label="New accounts" tag="Admin" value={admin.new_accounts.last7} caption={compareCaption(admin.new_accounts.last7, admin.new_accounts.previous7)} />
                )}
                <StatTile
                    icon={ClockFading}
                    tone={followUp.count > 0 ? 'amber' : 'gray'}
                    label="Needs follow-up"
                    value={followUp.count}
                    caption={`Open for over ${followUp.threshold_days} days`}
                />
            </div>

            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-600" />
                            Reports per day
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div role="img" aria-label={chartLabel} className="flex items-end gap-2">
                            {reports.per_day.map((day) => {
                                const height = maxPerDay > 0 ? Math.max(2, Math.round((day.count / maxPerDay) * BAR_MAX_PX)) : 2
                                return (
                                    <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center">
                                        <div className="flex w-full flex-col items-center justify-end" style={{ height: BAR_MAX_PX + 20 }}>
                                            <span className="mb-1 text-xs font-semibold text-gray-700">{day.count}</span>
                                            <div className="w-full max-w-10 rounded-t bg-blue-600" style={{ height }} />
                                        </div>
                                        <span className="mt-1 text-xs text-gray-600">{day.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <p className="mt-4 text-sm text-gray-600">
                            {reports.last7 === 0 ? 'No reports in the last 7 days.' : summaryParts.join(' ')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="h-min">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle size={20} className="text-blue-600" />
                            Needs attention
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {nothingWaiting ? (
                            <p className="flex items-center gap-2 text-sm text-gray-600">
                                <CircleCheck size={18} className="text-green-700" aria-hidden="true" />
                                Nothing needs attention right now.
                            </p>
                        ) : (
                            <ul className="space-y-1">
                                {attentionRows.map((row) => <AttentionRow key={row.label} {...row} />)}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}

export default WeeklyOverview
