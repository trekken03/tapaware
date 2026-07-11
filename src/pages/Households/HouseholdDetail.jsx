import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, FileText, Droplets, Flag } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Trash2 } from 'lucide-react'

const getHouseholdStatusStyle = (status) => {
    switch (status) {
        case 'flagged':
            return { label: 'Flagged', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-400' }
        case 'pending':
            return { label: 'Pending Reports', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-400' }
        default:
            return { label: 'Safe', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-400' }
    }
}

const getReportStatusStyle = (status) => {
    switch (status) {
        case 'pending': return { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' }
        case 'investigating': return { label: 'Investigating', color: 'text-blue-700', bg: 'bg-blue-100' }
        case 'resolved': return { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100' }
        default: return { label: status, color: 'text-gray-700', bg: 'bg-gray-100' }
    }
}

const getTdsStatus = (value) => {
    if (value <= 500) return { label: 'Safe', color: 'text-green-700', bg: 'bg-green-100' }
    if (value <= 1000) return { label: 'Moderate', color: 'text-yellow-700', bg: 'bg-yellow-100' }
    return { label: 'High', color: 'text-red-700', bg: 'bg-red-100' }
}

const HouseholdDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [household, setHousehold] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        fetchHousehold()
    }, [id])

    const fetchHousehold = async () => {
        try {
            const res = await API.get(`/households/${id}`)
            setHousehold(res.data)
        } catch (error) {
            console.log('Error fetching household:', error)
            toast.error('Failed to fetch household')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading household...</p>
                </div>
            </Layout>
        )
    }

    if (!household) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Household not found.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/households')}>
                        Back to Households
                    </Button>
                </div>
            </Layout>
        )
    }

    const status = getHouseholdStatusStyle(household.computed_status)

    const handleDelete = async () => {
        if (!window.confirm(`Delete household #${household.household_number}? This will permanently remove all its reports and TDS history. This cannot be undone.`)) return

        try {
            await API.delete(`/households/${id}`)
            toast.success('Household deleted successfully')
            navigate('/households')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete household')
        }
    }
    return (
        <Layout>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => navigate('/households')}
                    >
                        <ArrowLeft size={14} />
                        Back
                    </Button>
                    {user?.role === 'admin' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={handleDelete}
                        >
                            <Trash2 size={14} />
                            Delete Household
                        </Button>
                    )}
                </div>
                <Card className={`border-l-4 ${status.border} mb-6`}>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{household.owner_name}</h1>
                                <p className="text-gray-500">
                                    Household #{household.household_number} - Purok {household.purok}
                                </p>
                            </div>
                            <span className={`${status.bg} ${status.color} px-3 py-1 rounded-full text-sm font-semibold`}>
                                {status.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Address</p>
                                <p className="font-semibold text-gray-900">{household.address}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date Added</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(household.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {household.flags.length > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Flag size={20} className="text-red-600" />
                                Recurring Flags
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {household.flags.map((f) => (
                                <div key={f.id} className="flex items-center justify-between rounded-lg bg-red-50 border-l-4 border-red-400 p-3">
                                    <div>
                                        <p className="font-semibold text-gray-900 capitalize">{f.issue_type}</p>
                                        <p className="text-xs text-gray-500">Reported {f.times_reported} times</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${f.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {f.status}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Report History ({household.reports.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {household.reports.length === 0 ? (
                            <p className="text-gray-500 text-sm">No reports submitted for this household.</p>
                        ) : (
                            <div className="space-y-2">
                                {household.reports.map((r) => {
                                    const s = getReportStatusStyle(r.status)
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => navigate(`/reports/${r.id}`)}
                                            className="flex items-center justify-between gap-3 rounded-lg bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-all duration-200"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900 capitalize">{r.issue_type}</p>
                                                <p className="text-xs text-gray-500">
                                                    {r.reported_by} • {new Date(r.created_at).toLocaleDateString()}
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Droplets size={20} className="text-blue-600" />
                            TDS Reading History ({household.tds_readings.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {household.tds_readings.length === 0 ? (
                            <p className="text-gray-500 text-sm">No TDS readings recorded for this household.</p>
                        ) : (
                            <div className="space-y-2">
                                {household.tds_readings.map((t) => {
                                    const s = getTdsStatus(t.tds_value)
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => navigate(`/tds/${t.id}`)}
                                            className="flex items-center justify-between gap-3 rounded-lg bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-all duration-200"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900">{t.tds_value} ppm</p>
                                                <p className="text-xs text-gray-500">
                                                    {t.staff_name} • {new Date(t.recorded_at).toLocaleDateString()}
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
        </Layout>
    )
}

export default HouseholdDetail