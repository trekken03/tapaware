import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Flag, FileText, Home, MapPin } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'

const getReportStatusStyle = (status) => {
    switch (status) {
        case 'pending': return { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' }
        case 'investigating': return { label: 'Investigating', color: 'text-blue-700', bg: 'bg-blue-100' }
        case 'resolved': return { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100' }
        default: return { label: status, color: 'text-gray-700', bg: 'bg-gray-100' }
    }
}

const FlagDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [flag, setFlag] = useState(null)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        fetchFlag()
    }, [id])

    const fetchFlag = async () => {
        try {
            const res = await API.get(`/admin/flags/${id}`)
            setFlag(res.data)
        } catch (error) {
            console.log('Error fetching flag:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (newStatus) => {
        try {
            await API.put(`/admin/flags/${id}/status`, { status: newStatus })
            toast.success('Flag status updated successfully')
            fetchFlag()
        } catch (error) {
            toast.error('Error updating flag status:', error.response?.data?.message || error.message)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading flag...</p>
                </div>
            </Layout>
        )
    }

    if (!flag) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Flag not found.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="outline"
                    size="sm"
                    className="mb-4 flex items-center gap-1"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={14} />
                    Back
                </Button>

                <Card className="mb-6 border-l-4 border-red-400">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 capitalize">{flag.issue_type} Flag</h1>
                                <p className="text-gray-500 text-sm">
                                    Household #{flag.household_number} — {flag.owner_name}
                                </p>
                            </div>
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                                {flag.times_reported}x reported
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                            <div className="flex items-center gap-2">
                                <MapPin size={15} className="text-gray-400" />
                                <span className="text-gray-700">Purok {flag.purok} — {flag.address}</span>
                            </div>
                            <div>
                                <p className="text-gray-500">Last Reported</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(flag.last_reported_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-gray-500 text-sm mb-2">Flag Status</p>
                            <select
                                value={flag.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                className="bg-red-100 text-red-700 border-0 rounded-full px-3 py-1 text-xs font-semibold capitalize cursor-pointer focus:outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText size={18} className="text-blue-600" />
                            Reports Behind This Flag ({flag.contributing_reports.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {flag.contributing_reports.length === 0 ? (
                            <p className="text-gray-500 text-sm">No matching reports found.</p>
                        ) : (
                            <div className="space-y-2">
                                {flag.contributing_reports.map((r) => {
                                    const s = getReportStatusStyle(r.status)
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => navigate(`/reports/${r.id}`)}
                                            className="rounded-lg bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <p className="text-sm font-medium text-gray-900">{r.reported_by}</p>
                                                <span className={`${s.bg} ${s.color} px-2 py-0.5 rounded-full text-xs font-semibold`}>
                                                    {s.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600">{r.description || 'No description provided'}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-4 flex justify-end">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => navigate(`/households/${flag.household_id}`)}
                    >
                        <Home size={16} />
                        View Full Household
                    </Button>
                </div>
            </div>
        </Layout>
    )
}

export default FlagDetail