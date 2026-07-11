import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, FileText, ClockFading, AlertCircle, TrendingUp, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'

const ResidentDashboard = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [summary, setSummary] = useState(null)
    const [tdsByPurok, setTdsByPurok] = useState([])
    const [householdTds, setHouseholdTds] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [summaryRes, tdsPurokRes, householdTdsRes] = await Promise.all([
                API.get('/analytics/resident/summary'),
                API.get('/analytics/tds-by-purok'),
                API.get(`/tds/household/${user?.household_id}/latest`)
            ])
            setSummary(summaryRes.data)
            setTdsByPurok(tdsPurokRes.data || [])
            setHouseholdTds(householdTdsRes.data || null)
        } catch (error) {
            console.log('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTdsStatus = (value) => {
        if (value < 500) return { label: 'Fresh', color: 'text-green-600', bg: 'bg-green-50' }
        if (value < 1000) return { label: 'Acceptable', color: 'text-yellow-600', bg: 'bg-yellow-50' }
        return { label: 'High', color: 'text-red-600', bg: 'bg-red-50' }
    }

    const statCards = [
        { label: 'My Reports', value: summary?.my_reports || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pending Reports', value: summary?.pending_reports || 0, icon: ClockFading, color: 'text-yellow-600', bg: 'bg-yellow-50' },
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

    const householdTdsStatus = householdTds ? getTdsStatus(householdTds.tds_value) : null

    return (
        <Layout>
            <div>

                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome, {user?.name}</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {statCards.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.label}>
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

                {/* Household TDS and TDS by Purok */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Current Household TDS */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Droplets size={20} className="text-blue-600" />
                                Your Household Water TDS
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {householdTds ? (
                                <div className="space-y-4">
                                    <div className={`p-6 rounded-lg ${householdTdsStatus.bg}`}>
                                        <p className="text-sm text-gray-600 mb-2">Current TDS Reading</p>
                                        <p className={`text-4xl font-bold ${householdTdsStatus.color}`}>
                                            {parseFloat(householdTds.tds_value).toFixed(2)}
                                        </p>
                                        <p className="text-sm text-gray-600 mt-2">
                                            Status: <span className={`font-semibold ${householdTdsStatus.color}`}>{householdTdsStatus.label}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-3">
                                            Last recorded: {new Date(householdTds.recorded_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No TDS reading available yet for your household.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* TDS by Purok */}
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
                                        <div key={item.purok} className="flex items-center justify-between pb-3  last:border-b-0">
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
                </div>

                {/* Water Quality Information */}
                <div className="grid grid-cols-1 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Info size={20} className="text-blue-600" />
                                About TDS (Total Dissolved Solids)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-gray-700">
                                    <strong>TDS (Total Dissolved Solids)</strong> measures the concentration of dissolved minerals and salts in water, expressed in parts per million (ppm).
                                </p>

                                <div className="space-y-3 mt-4">
                                    <div className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="inline-block w-4 h-4 rounded-full bg-green-500 mt-0.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="font-medium text-gray-700">0-500 ppm: Fresh Water</p>
                                            <p className="text-sm text-gray-600">Safe for all uses including drinking, cooking, and washing.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <div className="inline-block w-4 h-4 rounded-full bg-yellow-500 mt-0.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="font-medium text-gray-700">500-1000 ppm: Acceptable</p>
                                            <p className="text-sm text-gray-600">Generally safe but may have slight taste. Monitor water quality closely.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="inline-block w-4 h-4 rounded-full bg-red-500 mt-0.5 flex-shrink-0"></div>
                                        <div>
                                            <p className="font-medium text-gray-700">1000+ ppm: High Salinity</p>
                                            <p className="text-sm text-gray-600">Water may be unsuitable for drinking. Report any issues to barangay officials.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm text-gray-700">
                                        <strong>Why is TDS important?</strong> High TDS levels can affect water taste, quality, and suitability for different uses. Regular monitoring helps ensure safe water access for your community.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Report Button */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
                        <Button
                            onClick={() => navigate('/reports')}
                            className="w-full sm:flex-1"
                        >
                            View My Reports
                        </Button>
                        <Button
                            onClick={() => navigate('/reports/add')}
                            variant="default"
                            className="w-full sm:flex-1"
                        >
                            Submit Water Issue Report
                        </Button>
                    </div>
                </div>

            </div>
        </Layout>
    )
}

export default ResidentDashboard
