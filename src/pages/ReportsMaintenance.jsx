import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InputGroupAddon, InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Wrench, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import ReportStatusDialog from '@/components/ReportStatusDialog'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'
import { getDueDate, isOverdue } from '@/utils/reportDue'

const PAGE_SIZE = 10

const STATUS_STYLES = {
    pending: { label: 'New', className: 'bg-yellow-100 text-yellow-700' },
    investigating: { label: 'Investigating', className: 'bg-violet-100 text-violet-700' },
    resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
}

// Statuses a report can be moved to from the Edit dialog.
const EDIT_OPTIONS = {
    pending: ['investigating', 'resolved'],
    investigating: ['investigating', 'resolved'],
}

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
})

const formatTime = (time) => {
    const [hours, minutes] = String(time).split(':').map(Number)
    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// "YYYY-MM-DD" built from its parts, so it can't shift a day.
const formatDayKey = (key) => {
    const [year, month, day] = key.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Resolved reports show when they were resolved; open ones their due date.
const formatDue = (r) => {
    if (r.status === 'resolved') {
        return r.resolved_at && !isNaN(new Date(r.resolved_at)) ? formatDate(r.resolved_at) : '—'
    }
    const dueKey = getDueDate(r.created_at)
    return dueKey ? formatDayKey(dueKey) : '—'
}

const formatSchedule = (r) => {
    if (!r.scheduled_date_text || !r.scheduled_from || !r.scheduled_to) return '—'
    const [year, month, day] = r.scheduled_date_text.split('-').map(Number)
    const date = new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${date}, ${formatTime(r.scheduled_from)}–${formatTime(r.scheduled_to)}`
}

const ReportsMaintenance = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'
    const [reports, setReports] = useState([])
    const [archived, setArchived] = useState([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [editReport, setEditReport] = useState(null)
    const [overdueOnly, setOverdueOnly] = useState(false)

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            const res = await API.get('/reports')
            setReports(res.data || [])
        } catch (error) {
            console.log('Error fetching reports:', error)
            toast.error('Failed to fetch reports')
        } finally {
            setLoading(false)
        }
    }

    // Archived reports are admin-only (GET /reports/archived); staff never request them.
    const fetchArchived = async () => {
        try {
            const res = await API.get('/reports/archived')
            setArchived(res.data || [])
        } catch (error) {
            console.log('Error fetching archived reports:', error)
            toast.error('Failed to fetch archived reports')
        }
    }

    useEffect(() => {
        if (tab === 'archived' && isAdmin) fetchArchived()
    }, [tab, isAdmin])

    const handleArchive = async (report) => {
        try {
            await API.delete(`/reports/${report.id}`)
            toast.success('Report archived successfully')
            fetchReports()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to archive report')
        }
    }

    const statusForTab = { new: 'pending', investigating: 'investigating', resolved: 'resolved' }[tab]
    const sourceRows = tab === 'archived' ? archived : reports
    const tabRows = statusForTab ? sourceRows.filter(r => r.status === statusForTab) : sourceRows
    // The Overdue filter only exists on All, New and Investigating.
    const now = new Date()
    const overdueAllowed = tab === 'all' || tab === 'new' || tab === 'investigating'
    const overdueCount = overdueAllowed ? tabRows.filter(r => isOverdue(r, now)).length : 0
    const overdueActive = overdueAllowed && overdueOnly
    const visibleRows = overdueActive ? tabRows.filter(r => isOverdue(r, now)) : tabRows
    const searchLower = searchTerm.toLowerCase()
    const filteredRows = visibleRows.filter(r =>
        r.issue_type?.toLowerCase().includes(searchLower) ||
        r.household_number?.toString().includes(searchLower) ||
        r.owner_name?.toLowerCase().includes(searchLower) ||
        r.zone?.toString().includes(searchLower)
    )

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
    const pageStart = (currentPage - 1) * PAGE_SIZE
    const paginatedRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE)

    useEffect(() => {
        setCurrentPage(1)
    }, [tab, searchTerm, overdueOnly])

    useEffect(() => {
        if (tab === 'resolved' || tab === 'archived') setOverdueOnly(false)
    }, [tab])

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [currentPage, totalPages])

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading reports...</p>
                </div>
            </Layout>
        )
    }

    const isArchivedTab = tab === 'archived'

    return (
        <Layout>
            <div>
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports Maintenance</h1>
                    <p className="text-gray-500 mt-1">Schedule, resolve and archive reports.</p>
                </div>

                <Card className="bg-white/80">
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <CardTitle className="flex flex-wrap items-center gap-2">
                                <Wrench size={20} className="text-blue-600" />
                                Reports
                                <span className="text-sm font-normal text-gray-500">({filteredRows.length})</span>
                            </CardTitle>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Tabs value={tab} onValueChange={setTab}>
                                        <TabsList variant="line" className="flex-wrap">
                                            <TabsTrigger value="all">All</TabsTrigger>
                                            <TabsTrigger value="new">New</TabsTrigger>
                                            <TabsTrigger value="investigating">Investigating</TabsTrigger>
                                            <TabsTrigger value="resolved">Resolved</TabsTrigger>
                                            {isAdmin && <TabsTrigger value="archived">Archived</TabsTrigger>}
                                        </TabsList>
                                    </Tabs>
                                    {overdueAllowed && (
                                        <button
                                            type="button"
                                            aria-pressed={overdueActive}
                                            onClick={() => setOverdueOnly(!overdueOnly)}
                                            className={`min-h-9 rounded-full border px-3 py-1 text-sm font-medium hover:cursor-pointer transition-colors ${overdueActive
                                                ? 'border-red-600 bg-red-600 text-white'
                                                : 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                                                }`}
                                        >
                                            Overdue ({overdueCount})
                                        </button>
                                    )}
                                </div>
                                <InputGroup className="max-w-xs">
                                    <InputGroupInput
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <InputGroupAddon>
                                        <Search size={16} />
                                    </InputGroupAddon>
                                </InputGroup>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredRows.length === 0 ? (
                            <div className="text-center py-12">
                                <Wrench size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No reports found.</p>
                            </div>
                        ) : (
                            <>
                                <Table className="md:min-w-[900px]">
                                    <TableHeader className="bg-blue-800">
                                        <TableRow>
                                            <TableHead>No.</TableHead>
                                            <TableHead>Issue</TableHead>
                                            <TableHead>Household</TableHead>
                                            <TableHead>Zone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Due</TableHead>
                                            <TableHead>{isArchivedTab ? 'Archived' : 'Scheduled'}</TableHead>
                                            <TableHead>Reported</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedRows.map((r, index) => {
                                            const statusStyle = STATUS_STYLES[r.status] || { label: r.status, className: 'bg-gray-100 text-gray-700' }
                                            return (
                                                <TableRow key={r.id}>
                                                    <TableCell label="No.">{pageStart + index + 1}</TableCell>
                                                    <TableCell label="Issue" className="font-semibold capitalize">
                                                        {r.issue_type}
                                                        {r.issue_type === 'other' && r.other_issue ? ` — ${r.other_issue}` : ''}
                                                    </TableCell>
                                                    <TableCell label="Household">#{r.household_number} · {r.owner_name}</TableCell>
                                                    <TableCell label="Zone">Zone {r.zone || '—'}</TableCell>
                                                    <TableCell label="Status">
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <span className={`inline-block px-2 py-1 text-xs font-semibold ${statusStyle.className}`}>
                                                                {statusStyle.label}
                                                            </span>
                                                            {!isArchivedTab && isOverdue(r, now) && (
                                                                <span className="inline-block rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                                                                    Overdue
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell label="Due" className="whitespace-nowrap">{formatDue(r)}</TableCell>
                                                    <TableCell label={isArchivedTab ? 'Archived' : 'Scheduled'} className="whitespace-nowrap">
                                                        {isArchivedTab ? formatDate(r.deleted_at) : formatSchedule(r)}
                                                    </TableCell>
                                                    <TableCell label="Reported" className="whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
                                                    <TableCell label="Actions">
                                                        {isArchivedTab ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                                                                onClick={() => navigate('/archive')}
                                                            >
                                                                Open Archive
                                                            </Button>
                                                        ) : (
                                                            <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 gap-1 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
                                                                    onClick={() => navigate(`/reports/${r.id}`, { state: { from: 'reports' } })}
                                                                >
                                                                    <Eye size={12} className="sm:h-[14px] sm:w-[14px]" />
                                                                    View
                                                                </Button>
                                                                {EDIT_OPTIONS[r.status] && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 gap-1 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 sm:h-9 sm:px-3 sm:text-sm"
                                                                        onClick={() => setEditReport(r)}
                                                                    >
                                                                        <Pencil size={12} className="sm:h-[14px] sm:w-[14px]" />
                                                                        Edit
                                                                    </Button>
                                                                )}
                                                                {isAdmin && (
                                                                    <ConfirmDialog
                                                                        title="Archive this report?"
                                                                        description="It can be restored later from the Archive. If it counts toward an active recurring flag, that count goes down by one."
                                                                        actionText="Archive Report"
                                                                        actionVariant="destructive"
                                                                        onConfirm={() => handleArchive(r)}
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-7 gap-1 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 sm:h-9 sm:px-3 sm:text-sm"
                                                                        >
                                                                            <Trash2 size={12} className="sm:h-[14px] sm:w-[14px]" />
                                                                            Archive
                                                                        </Button>
                                                                    </ConfirmDialog>
                                                                )}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 flex justify-end">
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ReportStatusDialog
                open={editReport !== null}
                onOpenChange={(open) => !open && setEditReport(null)}
                report={editReport}
                targetStatus="investigating"
                statusOptions={editReport ? EDIT_OPTIONS[editReport.status] : undefined}
                onUpdated={fetchReports}
            />
        </Layout>
    )
}

export default ReportsMaintenance
