import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
    Droplets, FileText, ClockFading, TrendingUp, Home, MapPin,
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

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [summaryRes, tdsHistoryRes, reportsRes] = await Promise.all([
                API.get('/analytics/resident/summary'),

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
        { label: 'My Reports', value: summary?.my_reports || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pending Reports', value: summary?.pending_reports || 0, icon: ClockFading, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    ]

    const filteredReports = reports.filter(r => {
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = r.issue_type.toLowerCase().includes(searchLower) ||
            r.description?.toLowerCase().includes(searchLower)
        return matchesStatus && matchesSearch
    })

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
            <div>
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome, {user?.name}</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {statCards.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.label}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">{stat.label}</p>
                                            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-full ${stat.bg}`}>
                                            <Icon size={20} className={stat.color} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>




                {/* Household TDS and TDS by Purok */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Droplets size={20} className="text-blue-600" />
                                Your Household Water TDS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {latestTds ? (
                                <div className={`p-6 rounded-lg ${latestTdsStatus.bg}`}>
                                    <p className="text-sm text-gray-600 mb-2">Current TDS Reading</p>
                                    <p className={`text-4xl font-bold ${latestTdsStatus.color}`}>
                                        {parseFloat(latestTds.tds_value).toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Status: <span className={`font-semibold ${latestTdsStatus.color}`}>{latestTdsStatus.label}</span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-3 mb-3">
                                        Last recorded:{new Date(latestTds.recorded_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                    {user?.household_id && (

                                        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-1.5">
                                                <Home size={15} className="text-gray-400" />
                                                Household #{user.household_number}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={15} className="text-gray-400" />
                                                Purok {user.purok}
                                            </div>
                                        </div>

                                    )}

                                </div>

                            ) : (
                                <p className="text-gray-500 text-sm">No TDS reading available yet for your household.</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Droplets size={18} className="text-blue-600" />
                                TDS Reading History ({tdsHistory.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tdsHistory.length === 0 ? (
                                <p className="text-gray-500 text-sm">No TDS readings recorded yet.</p>
                            ) : (
                                <div className="space-y-2 max-h-72 overflow-y-auto">
                                    {tdsHistory.map((t) => {
                                        const s = getTdsStatus(t.tds_value)
                                        return (
                                            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-100 p-3">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{parseFloat(t.tds_value).toFixed(2)} ppm</p>
                                                    <p className="text-xs text-gray-500">
                                                        {t.staff_name} • {new Date(t.recorded_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                                <span className={`${s.bg} ${s.color} px-2 py-1 rounded-full text-xs font-semibold`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>


                </div>


                {/* My Reports */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                My Reports ({filteredReports.length})
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="investigating">Investigating</option>
                                    <option value="resolved">Resolved</option>
                                </select>
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
                                <Button
                                    className="bg-blue-900 hover:bg-blue-700 text-white flex items-center gap-2"
                                    onClick={() => navigate('/reports/add')}
                                >
                                    <Plus size={16} />
                                    Submit Report
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredReports.length === 0 ? (
                            <div className="text-center py-12">
                                <Home size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">You haven't submitted any reports yet.</p>
                                <Button
                                    onClick={() => navigate('/reports/add')}
                                    className="mt-4 bg-blue-900 hover:bg-blue-700"
                                >
                                    Submit Your First Report
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,290px))] justify-center gap-4">
                                {filteredReports.map((r) => {
                                    const s = getReportStatusStyle(r.status)
                                    const Icon = s.icon
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => navigate(`/reports/${r.id}`)}
                                            className={`flex gap-4 rounded-lg border-l-3 ${s.border} border shadow-lg bg-gray-50 p-4 cursor-pointer hover:bg-gray-200 transition-all duration-200`}
                                        >
                                            <div className={`hidden sm:flex items-center justify-center w-14 h-14 rounded-full ${s.bg} shrink-0`}>
                                                <Icon size={24} className={s.color} />
                                            </div>
                                            <div className="flex-1 flex flex-col">
                                                <span className="text-lg font-semibold capitalize mb-1">{r.issue_type}</span>
                                                <p className="text-sm text-gray-700">
                                                    {new Date(r.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric', month: 'long', day: 'numeric',
                                                    })}
                                                </p>
                                                <span className={`${s.bg} ${s.color} mt-auto pt-2 text-xs font-semibold capitalize`}>
                                                    {r.status}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}

export default ResidentDashboard