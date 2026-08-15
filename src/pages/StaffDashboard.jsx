import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Droplets, Home, Flag, ClockFading, AlertTriangle, FileText, TrendingUp } from 'lucide-react'
import API from '@/services/api'
import { useNavigate } from 'react-router-dom'

const StaffDashboard = () => {
    const [summary, setSummary] = useState(null)
    const [flagged, setFlagged] = useState([])
    const [tdsByPurok, setTdsByPurok] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [summaryRes, flaggedRes, tdsPurokRes] = await Promise.all([
                API.get('/analytics/summary'),
                API.get('/analytics/flagged'),
                API.get('/analytics/tds-by-purok')
            ])
            setSummary(summaryRes.data)
            setFlagged(flaggedRes.data)
            setTdsByPurok(tdsPurokRes.data || [])
        } catch (error) {
            console.log('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        { label: 'Total Reports', value: summary?.total_reports || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', path: '/reports' },
        { label: 'Total Households', value: summary?.total_households || 0, icon: Home, color: 'text-green-600', bg: 'bg-green-50', path: '/households' },
        { label: 'Flagged Households', value: summary?.flagged_households || 0, icon: Flag, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Pending Reports', value: summary?.pending_reports || 0, icon: ClockFading, color: 'text-yellow-600', bg: 'bg-yellow-50', path: '/reports?status=pending' },
        { label: 'Average TDS (ppm)', value: summary?.average_tds || 0, icon: Droplets, color: 'text-purple-600', bg: 'bg-purple-50', path: '/analytics' },
    ]

    const tdsColors = (tds) => {
        const value = Number(tds)
        if (!value) return ' text-gray-500'
        if (value <= 500) return 'text-green-600'
        if (value <= 1000) return ' text-yellow-600'
        return ' text-red-600'
    }

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Barangay Cabalantian Water Quality Overview</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                    {statCards.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.label} className="cursor-pointer hover:shadow-lg transition-shadow transition-shadow hover:-translate-y-2 duration-300 transition-all" onClick={() => navigate(stat.path)}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500">{stat.label}</p>
                                            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>
                                                {stat.value}
                                            </p>
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

                {/* TDS by Purok */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-600" />
                                Average TDS by Purok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tdsByPurok.length === 0 ? (
                                <p className="text-gray-500 text-sm">No TDS data available.</p>
                            ) : (
                                <div className="space-y-3">
                                    {tdsByPurok.map((item) => (
                                        <div key={item.purok} className="flex items-center justify-between pb-3 last:border-b-0">
                                            <span className="text-sm font-medium text-gray-700">Purok {item.purok}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-lg font-bold ${tdsColors(parseFloat(item.average_tds))}`}>{parseFloat(item.average_tds).toFixed(2)}</span>
                                                <span className="text-xs text-gray-500">ppm</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Water Quality Info */}
                    <Card className="h-min">
                        <CardHeader>
                            <CardTitle>Water Quality Guidelines</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex gap-2">
                                    <span className="inline-block w-4 h-4 rounded-full bg-green-500 mt-0.5"></span>
                                    <div>
                                        <p className="font-medium text-gray-700">0-500 ppm</p>
                                        <p className="text-gray-500 text-xs">Fresh water - Safe to use</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="inline-block w-4 h-4 rounded-full bg-yellow-500 mt-0.5"></span>
                                    <div>
                                        <p className="font-medium text-gray-700">500-1000 ppm</p>
                                        <p className="text-gray-500 text-xs">Acceptable - Monitor closely</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="inline-block w-4 h-4 rounded-full bg-red-500 mt-0.5"></span>
                                    <div>
                                        <p className="font-medium text-gray-700">1000+ ppm</p>
                                        <p className="text-gray-500 text-xs">High salinity - Needs attention</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Flagged households table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-500" />
                            Flagged Households
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {flagged.length === 0 ? (
                            <p className="text-gray-500 text-sm">No flagged households at this time.</p>
                        ) : (
                            <Table className="md:min-w-[800px]">
                                <TableHeader className="bg-blue-800">
                                    <TableRow>
                                        <TableHead>No.</TableHead>
                                        <TableHead>Household</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Purok</TableHead>
                                        <TableHead>Issue Type</TableHead>
                                        <TableHead>Times Reported</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {flagged.map((flag, index) => (
                                        <TableRow key={flag.id}>
                                            <TableCell label="No.">{index + 1}</TableCell>
                                            <TableCell label="Household">#{flag.household_number}</TableCell>
                                            <TableCell label="Owner" className="font-semibold">{flag.owner_name}</TableCell>
                                            <TableCell label="Purok">Purok {flag.purok}</TableCell>
                                            <TableCell label="Issue Type" className="capitalize">{flag.issue_type}</TableCell>
                                            <TableCell label="Times Reported">
                                                <span className="bg-red-100 text-red-700 inline-block px-2 py-1 text-xs font-semibold">
                                                    {flag.times_reported}x
                                                </span>
                                            </TableCell>
                                            <TableCell label="Status">
                                                <span className="bg-red-100 text-red-700 inline-block px-2 py-1 text-xs font-semibold capitalize">
                                                    {flag.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

            </div>
        </Layout>
    )
}

export default StaffDashboard
