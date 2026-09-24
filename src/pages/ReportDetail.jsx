import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ArrowLeft, Home, FileText } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

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
    const location = useLocation()
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
            toast.error('Failed to fetch report')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (newStatus) => {
        try {
            await API.put(`/reports/${id}/status`, { status: newStatus })
            toast.success('Report status updated successfully')
            fetchReport()
        } catch (error) {
            console.log('Error updating status:', error)
            toast.error('Failed to update report status')
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
                    <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </Layout>
        )
    }


    const status = getStatusStyle(report.status)
    const isResident = user?.role === 'resident'
    const handleDelete = async () => {
        try {
            await API.delete(`/reports/${id}`)
            toast.success('Report archived successfully')
            navigate(-1)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to archive report')
        }
    }

    const handleBack = () => {
        console.log('location.state:', location.state)

        if (location.state?.from === 'flags') {
            navigate(`/admin/flags/${location.state.flagId}`)
        } else {
            navigate(`/households/${report.household_id}`)
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
                        onClick={handleBack}
                    >
                        <ArrowLeft size={14} />
                        Back
                    </Button>
                    {(user?.role === 'admin' || (user?.role === 'resident' && report.user_id === user.id && report.status === 'pending'))
                        &&
                        (
                            <ConfirmDialog title="Archive this report?" description={report.active_flag ? `This report is part of an active ${report.issue_type} flag for this household, currently reported ${report.active_flag.times_reported}x. Archiving it will reduce that count.` : 'It can be restored later from the Archive.'} actionText="Archive Report" actionVariant="destructive" onConfirm={handleDelete} >
                                <Button className="flex items-center gap-1 text-white bg-red-600 hover:bg-red-500 hover:cursor-pointer" >
                                    <Trash2 size={14} /> Archive Report
                                </Button>
                            </ConfirmDialog>)}
                </div>

                <Card className={`border-l-4 ${status.border} mb-6`}>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{report.reported_by}</h1>
                                <p className="text-gray-500">
                                    Household #{report.household_number} - Purok {report.purok}
                                </p>
                            </div>

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
                                        month: 'short', day: 'numeric', year: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-gray-500">Description</p>
                                <p className="font-semibold text-gray-900">{report.description || '-'}</p>
                            </div>
                        </div>

                        {!isResident && (
                            <div className="mt-6 ">

                                <p className="text-gray-500 text-sm mb-2">Update Status</p>
                                {report.status !== 'resolved' ? (

                                    <select
                                        value={report.status}
                                        onChange={(e) => handleStatusUpdate(e.target.value)}
                                        className={`${status.bg} ${status.color} border-0  px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}
                                    >
                                        {report.status === 'pending' && (
                                            <>

                                                <option value="pending">Pending</option>
                                                <option value="investigating">Investigating</option>
                                                <option value="resolved">Resolved</option>
                                            </>
                                        )}
                                        {report.status === 'investigating' && (
                                            <>
                                                <option value="investigating">Investigating</option>
                                                <option value="resolved">Resolved</option>
                                            </>
                                        )}
                                    </select>
                                ) : (<span className={`${status.bg} ${status.color} border-0  px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}>Resolved</span>)}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Other reports from this household
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
                                                    {new Date(r.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`${s.bg} ${s.color} px-2 py-1 text-xs font-semibold`}>
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