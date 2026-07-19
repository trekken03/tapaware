import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardList, User, Globe, Database, Clock } from 'lucide-react'
import API from '@/services/api'

const AuditDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [log, setLog] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLog()
    }, [id])

    const fetchLog = async () => {
        try {
            const res = await API.get(`/admin/audit-trail/${id}`)
            setLog(res.data)
        } catch (error) {
            console.log('Error fetching audit log:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading log entry...</p>
                </div>
            </Layout>
        )
    }

    if (!log) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Audit log entry not found.</p>
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

                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">{log.action.replace(/_/g, ' ')}</h1>
                                <p className="text-gray-500 text-sm">{log.details}</p>
                            </div>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold shrink-0">
                                {log.table_affected}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start gap-2">
                                <User size={15} className="text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-gray-500">User</p>
                                    <p className="font-semibold text-gray-900">
                                        {log.user_name}
                                        {!log.user_id && <span className="text-gray-400 font-normal"> (account deleted)</span>}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">{log.user_role}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Clock size={15} className="text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-gray-500">Timestamp</p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(log.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Globe size={15} className="text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-gray-500">IP Address</p>
                                    <p className="font-semibold text-gray-900">{log.ip_address || '—'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Database size={15} className="text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-gray-500">Record ID</p>
                                    <p className="font-semibold text-gray-900">{log.record_id ?? '—'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ClipboardList size={18} className="text-blue-600" />
                            Other Recent Activity by This User
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {log.other_activity.length === 0 ? (
                            <p className="text-gray-500 text-sm">No other recorded activity.</p>
                        ) : (
                            <div className="space-y-2">
                                {log.other_activity.map((a) => (
                                    <div
                                        key={a.id}
                                        onClick={() => navigate(`/audit-trail/${a.id}`)}
                                        className="rounded-lg bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                                    >
                                        <p className="text-sm font-medium text-gray-900">{a.action.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-gray-500">{a.details}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {new Date(a.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}

export default AuditDetail