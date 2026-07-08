import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'

const getStatusStyle = (status) => {
    switch (status) {
        case 'pending':
            return { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-400' }
        case 'investigating':
            return { label: 'Investigating', color: 'text-violet-700', bg: 'bg-violet-100', border: 'border-violet-400' }
        case 'resolved':
            return { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-400' }
        default:
            return { label: status, color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-400' }
    }
}

const ReportDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReport()
    }, [id])

    const fetchReport = async () => {
        try {
            const res = await API.get(`/reports/${id}`)
            setReport(res.data)
        } catch (error) {
            console.log('Error fetching report:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (newStatus) => {
        try {
            await API.put(`/reports/${id}/status`, { status: newStatus })
            fetchReport()
        } catch (error) {
            console.log('Error updating status:', error)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading report...</p>
                </div>
            </Layout>
        )
    }

    if (!report) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Report not found.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/reports')}>
                        Back to Reports
                    </Button>
                </div>
            </Layout>
        )
    }

    const status = getStatusStyle(report.status)
    const isResident = user?.role === 'resident'

    return (
        <Layout>
            <div>
                <Button
                    variant="outline"
                    size="sm"
                    className="mb-4 flex items-center gap-1"
                    onClick={() => navigate('/reports')}
                >
                    <ArrowLeft size={14} />
                    Back to Reports
                </Button>

                <Card className={`border-l-4 ${status.border} mb-6`}>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{report.owner_name}</h1>
                                <p className="text-gray-500">
                                    Household #{report.household_number} - Purok {report.purok}
                                </p>
                            </div>
                            <span className={`${status.bg} ${status.color} px-3 py-1 rounded-full text-sm font-semibold`}>
                                {status.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Issue Type</p>
                                <p className="font-semibold text-gray-900 capitalize">{report.issue_type}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Reported By</p>
                                <p className="font-semibold text-gray-900">{report.reported_by}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Address</p>
                                <p className="font-semibold text-gray-900">{report.address}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date Reported</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(report.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-gray-500">Description</p>
                                <p className="font-semibold text-gray-900">{report.description || '-'}</p>
                            </div>
                        </div>

                        {!isResident && (
                            <div className="mt-6">
                                <p className="text-gray-500 text-sm mb-2">Update Status</p>
                                <select
                                    value={report.status}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    className={`${status.bg} ${status.color} border-0 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="investigating">Investigating</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Other Reports from this Household
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {report.household_reports.length === 0 ? (
                            <p className="text-gray-500 text-sm">No other reports from this household.</p>
                        ) : (
                            <div className="space-y-2">
                                {report.household_reports.map((r) => {
                                    const s = getStatusStyle(r.status)
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => navigate(`/reports/${r.id}`)}
                                            className={`flex items-center justify-between gap-3 rounded-lg border-l-4 ${s.border} bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-all duration-200`}
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900 capitalize">{r.issue_type}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(r.created_at).toLocaleDateString()}
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

export default ReportDetail