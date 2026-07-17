import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Home, Flag, ClockFading, AlertTriangle, FileText, TrendingUp } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'


const AdminDashboard = () => {
    const [summary, setSummary] = useState(null)
    const [flagged, setFlagged] = useState([])
    const [tdsByPurok, setTdsByPurok] = useState([])
    const [loading, setLoading] = useState(true)

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
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const statCards = [
        { label: 'Total Reports', value: summary?.total_reports || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Households', value: summary?.total_households || 0, icon: Home, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Flagged Households', value: summary?.flagged_households || 0, icon: Flag, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'Pending Reports', value: summary?.pending_reports || 0, icon: ClockFading, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        { label: 'Average TDS (ppm)', value: summary?.average_tds || 0, icon: Droplets, color: 'text-purple-600', bg: 'bg-purple-50' },
    ]

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
                            <Card key={stat.label}>
                                <CardContent className="pt-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-black font-semibold">{stat.label}</p>
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
                                        <div key={item.purok} className="flex items-center justify-between pb-3">
                                            <span className="text-sm font-medium text-gray-700">Purok {item.purok}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-blue-600">{parseFloat(item.average_tds).toFixed(2)}</span>
                                                <span className="text-xs text-gray-500">ppm</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Water Quality Info */}
                    <Card>
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
                            <>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="border-b">
                                                {['Household No.', 'Owner', 'Purok', 'Issue Type', 'Times Reported', 'Status'].map(h => (
                                                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {flagged.map((flag, index) => (
                                                <tr key={flag.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="py-3 px-4 text-sm font-semibold">{flag.household_number}</td>
                                                    <td className="py-3 px-4 text-sm">{flag.owner_name}</td>
                                                    <td className="py-3 px-4 text-sm">Purok {flag.purok}</td>
                                                    <td className="py-3 px-4 text-sm capitalize">{flag.issue_type}</td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <span className="bg-red-100 text-red-700 px-2 py-1  text-xs font-semibold">
                                                            {flag.times_reported}x
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm">
                                                        <span className="bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold capitalize">
                                                            {flag.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="space-y-3 md:hidden">
                                    {flagged.map((flag) => (
                                        <div key={flag.id} className="border border-gray-200 bg-gray-50 p-4 shadow-sm">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-sm font-semibold">#{flag.household_number}</span>
                                                <span className="bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold">
                                                    {flag.times_reported}x
                                                </span>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-700">
                                                <div><span className="font-semibold text-gray-900">Owner:</span> {flag.owner_name}</div>
                                                <div><span className="font-semibold text-gray-900">Purok:</span> {flag.purok}</div>
                                                <div><span className="font-semibold text-gray-900">Issue:</span> <span className="capitalize">{flag.issue_type}</span></div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">Status:</span>{' '}
                                                    <span className="bg-red-100 text-red-700 px-2 py-0.5  text-xs font-semibold capitalize">
                                                        {flag.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>


            </div>
        </Layout>
    )
}

export default AdminDashboard
