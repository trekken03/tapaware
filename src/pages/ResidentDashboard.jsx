import { useState, useEffect } from 'react'
import Layout, { TopScene } from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pagination } from '@/components/ui/pagination'
import {
    Droplets, FileText, ClockFading, Home, MapPin,
    Search, Plus, Hourglass, CircleCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'

const getReportStatusStyle = (status) => {
    switch (status) {
        case 'pending':
            return { color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-400', icon: ClockFading }
        case 'investigating':
            return { color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-400', icon: Hourglass }
        case 'resolved':
            return { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-400', icon: CircleCheck }
        default:
            return { color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-400', icon: ClockFading }
    }
}

const getTdsStatus = (value) => {
    if (value < 500) return { label: 'Fresh', color: 'text-green-600', bg: 'bg-green-50' }
    if (value < 1000) return { label: 'Acceptable', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { label: 'High', color: 'text-red-600', bg: 'bg-red-50' }
}

const ResidentDashboard = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [summary, setSummary] = useState(null)
    const [tdsHistory, setTdsHistory] = useState([])
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 5

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [summaryRes, tdsHistoryRes, reportsRes] = await Promise.all([
                API.get('/visualization/resident/summary'),

                user?.household_id ? API.get(`/tds/household/${user.household_id}`) : Promise.resolve({ data: [] }),
                user?.household_id ? API.get(`/reports/household/${user.household_id}`) : Promise.resolve({ data: [] })
            ])
            setSummary(summaryRes.data)

            setTdsHistory(tdsHistoryRes.data || [])
            setReports(reportsRes.data || [])
        } catch (error) {
            console.log('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        { label: 'My Reports', value: summary?.my_reports || 0, icon: FileText, color: 'text-blue-900', titleColor: 'text-blue-800', border: 'border-blue-300', gradient: 'from-white to-blue-100', badge: 'bg-blue-400' },
        { label: 'Pending Reports', value: summary?.pending_reports || 0, icon: ClockFading, color: 'text-amber-600', titleColor: 'text-amber-600', border: 'border-amber-300', gradient: 'from-white to-amber-100', badge: 'bg-amber-400' },
    ]

    const filteredReports = reports.filter(r => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = r.issue_type.toLowerCase().includes(searchLower) ||
            r.description?.toLowerCase().includes(searchLower)
        return matchesStatus && matchesSearch
    })

    const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize))
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    const latestTds = tdsHistory.length > 0 ? tdsHistory[0] : null
    const latestTdsStatus = latestTds ? getTdsStatus(latestTds.tds_value) : null

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading dashboard...</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="relative -m-4 min-h-[calc(100vh-4rem)] bg-[#eff3fb] sm:-m-6 lg:-m-8">
                <TopScene />
                <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                    <section className="relative -mx-4 mb-0 min-h-44 px-5 py-7 sm:-mx-6 sm:px-8 sm:py-9 lg:-mx-8 lg:px-10">
                        <div className="relative z-10">
                            <p className="text-xs font-semibold text-[#102765]">Dashboard</p>
                            <h1 className="mt-1 text-2xl font-bold leading-tight text-[#102765] sm:text-3xl lg:text-4xl">
                                Welcome, {user?.name}!
                            </h1>
                        </div>
                    </section>

                    <div className="relative z-10 mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((stat) => {
                            const Icon = stat.icon
                            return (
                                <Card key={stat.label} className={`rounded-xl border ${stat.border} bg-gradient-to-b ${stat.gradient} shadow-sm`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${stat.badge}`}>
                                                <Icon size={21} className="text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className={`text-sm font-semibold ${stat.titleColor}`}>{stat.label}</p>
                                                <p className={`mt-1 text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {stat.label === 'My Reports' ? 'Total Reports' : 'Awaiting review'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                        <Card className="rounded-xl border border-green-400 bg-gradient-to-b from-white to-green-100 shadow-sm sm:col-span-2 lg:col-span-2">
                            <CardContent className="flex h-full items-start gap-4 p-4">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-green-600">
                                    <Droplets size={21} className="text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-green-700">Household Water TDS</p>
                                    {latestTds ? (
                                        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                            <div>
                                                <p className="text-xs text-slate-500">Most Recent TDS Reading</p>
                                                <p className="text-3xl font-bold text-green-600">
                                                    {parseFloat(latestTds.tds_value).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-slate-600">
                                                    Status: <span className={`font-semibold ${latestTdsStatus.color}`}>{latestTdsStatus.label}</span>
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-xs text-slate-500 sm:text-right">
                                                <p>
                                                    Last Recorded: {new Date(latestTds.recorded_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                {user?.household_id && (
                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-600 sm:justify-end">
                                                        <div className="flex items-center gap-1.5">
                                                            <Home size={15} className="text-gray-400" />
                                                            Household #{user.household_number}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin size={15} className="text-gray-400" />
                                                            Zone {user.zone}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-slate-500">No TDS reading available yet for your household.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    <Card className="mb-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3 text-lg font-bold text-[#173574]">
                                <span className="flex size-10 items-center justify-center rounded-full bg-[#173574] text-white">
                                    <ClockFading size={19} />
                                </span>
                                TDS Reading History ({tdsHistory.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tdsHistory.length === 0 ? (
                                <p className="text-gray-500 text-sm">No TDS readings recorded yet.</p>
                            ) : (
                                <Table containerClassName="max-h-72 overflow-y-auto" className="md:min-w-[620px]">
                                    <TableHeader className="sticky top-0 z-10 bg-[#102765]">
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>TDS</TableHead>
                                            <TableHead>Recorded By</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tdsHistory.map((t) => {
                                            const s = getTdsStatus(t.tds_value)
                                            return (
                                                <TableRow key={t.id}>
                                                    <TableCell label="Date" className="whitespace-nowrap">
                                                        {new Date(t.recorded_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </TableCell>
                                                    <TableCell label="TDS" className="font-semibold whitespace-nowrap">
                                                        {parseFloat(t.tds_value).toFixed(2)} ppm
                                                    </TableCell>
                                                    <TableCell label="Recorded By">{t.staff_name}</TableCell>
                                                    <TableCell label="Status" className="text-center">
                                                        <span className={`${s.bg} ${s.color} inline-block w-[110px] rounded-full px-2 py-1 text-xs font-semibold`}>
                                                            {s.label}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* My Reports */}
                    <Card className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <CardHeader>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <CardTitle className="flex flex-wrap items-center gap-3 text-lg font-bold text-[#173574]">
                                        <span className="flex size-10 items-center justify-center rounded-full bg-[#173574] text-white">
                                            <FileText size={19} />
                                        </span>
                                        My Reports
                                        <span className="text-sm font-normal text-gray-500">
                                            {searchTerm
                                                ? `Showing ${filteredReports.length} of ${reports.length}`
                                                : `(${reports.length})`}
                                        </span>
                                    </CardTitle>
                                    <Button
                                        className="h-11 w-full bg-[#173574] text-white hover:bg-blue-800 sm:w-auto"
                                        onClick={() => navigate('/reports/add')}
                                    >
                                        <Plus size={16} />
                                        Create Report
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="max-w-full overflow-x-auto">
                                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                                            <TabsList variant="line" className="h-11 w-max min-w-full">
                                                <TabsTrigger value="all" className="min-h-11">All</TabsTrigger>
                                                <TabsTrigger value="pending" className="min-h-11">Pending</TabsTrigger>
                                                <TabsTrigger value="investigating" className="min-h-11">Investigating</TabsTrigger>
                                                <TabsTrigger value="resolved" className="min-h-11">Resolved</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </div>

                                    <InputGroup className="h-11 w-full lg:max-w-xs">
                                        <InputGroupInput
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-11 text-base"
                                        />
                                        <InputGroupAddon>
                                            <Search size={16} />
                                        </InputGroupAddon>
                                    </InputGroup>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredReports.length === 0 ? (
                                <div className="text-center py-12">
                                    <Home size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        {reports.length === 0
                                            ? "You haven't submitted any reports yet."
                                            : 'No reports match your filters.'}
                                    </p>
                                    {reports.length === 0 && (
                                        <Button
                                            onClick={() => navigate('/reports/add')}
                                            className="mt-4 h-11 w-full bg-blue-900 hover:bg-blue-700 sm:w-auto"
                                        >
                                            Submit Your First Report
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Table className="md:min-w-[620px]">
                                        <TableHeader className="bg-[#24499b]">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Issue</TableHead>
                                                <TableHead>Reported</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedReports.map((r, index) => {
                                                const s = getReportStatusStyle(r.status)
                                                const rowNum = (currentPage - 1) * pageSize + index + 1

                                                return (
                                                    <TableRow
                                                        key={r.id}
                                                        className="cursor-pointer hover:bg-gray-50"
                                                        onClick={() => navigate(`/reports/${r.id}`)}
                                                    >
                                                        <TableCell label="No.">{rowNum}</TableCell>
                                                        <TableCell label="Issue" className="font-semibold capitalize">{r.issue_type}</TableCell>
                                                        <TableCell label="Reported" className="whitespace-nowrap">
                                                            {new Date(r.created_at).toLocaleDateString('en-US', {
                                                                month: 'short', day: 'numeric', year: 'numeric',
                                                            })}
                                                        </TableCell>
                                                        <TableCell label="Status" className="text-center">
                                                            <span className={`${s.bg} ${s.color} inline-block w-[133px] px-2 py-1 text-xs font-semibold capitalize`}>
                                                                {r.status}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                    <div className="mt-4 flex flex-wrap justify-end">
                                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="[&_button]:min-h-11" />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    )
}

export default ResidentDashboard