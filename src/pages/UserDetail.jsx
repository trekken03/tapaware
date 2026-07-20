import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Pencil, Trash2, Home, FileText, Droplets, ClipboardList, Mail, MapPin } from 'lucide-react'
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

const getTdsStatus = (value) => {
    if (value <= 500) return { label: 'Safe', color: 'text-green-700', bg: 'bg-green-100' }
    if (value <= 1000) return { label: 'Moderate', color: 'text-yellow-700', bg: 'bg-yellow-100' }
    return { label: 'High', color: 'text-red-700', bg: 'bg-red-100' }
}

const roleBadgeStyle = {
    admin: 'bg-purple-100 text-purple-700',
    staff: 'bg-blue-100 text-blue-700',
    resident: 'bg-green-100 text-green-700',
}

const UserDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUser()
    }, [id])

    const fetchUser = async () => {
        try {
            const res = await API.get(`/admin/users/${id}`)
            setUser(res.data)
        } catch (error) {
            console.log('Error fetching user:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return
        try {
            await API.delete(`/admin/users/${id}`)
            toast.success('User deleted successfully')
            navigate('/admin')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user')
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading user...</p>
                </div>
            </Layout>
        )
    }

    if (!user) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">User not found.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => navigate(-1)}>
                        <ArrowLeft size={14} />
                        Back
                    </Button>
                    {user.role !== 'admin' && (<div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => navigate(`/admin/edit-user/${id}`, { state: user })}
                        >
                            <Pencil size={14} />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={handleDelete}
                        >
                            <Trash2 size={14} />
                            Delete
                        </Button>
                    </div>
                    )}


                </div>

                {/* Header */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <User size={28} className="text-blue-700" />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadgeStyle[user.role] || 'bg-gray-100 text-gray-700'}`}>
                                        {user.role}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={14} className="text-gray-400" />
                                        {user.email}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ClipboardList size={14} className="text-gray-400" />
                                        Joined {new Date(user.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {user.role === 'resident' && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                {user.household_id ? (
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                                        <div className="flex items-center gap-1.5">
                                            <Home size={14} className="text-gray-400" />
                                            Household #{user.household_number}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-gray-400" />
                                            Purok {user.purok}
                                        </div>
                                        {user.address && (
                                            <div className="text-gray-500">{user.address}</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-yellow-700">⚠️ No household linked to this account.</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Resident: report history */}
                {user.role === 'resident' && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText size={18} className="text-blue-600" />
                                Report History ({user.reports.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.reports.length === 0 ? (
                                <p className="text-gray-500 text-sm">No reports submitted by this household.</p>
                            ) : (
                                <div className="space-y-2">
                                    {user.reports.map((r) => {
                                        const s = getReportStatusStyle(r.status)
                                        return (
                                            <div
                                                key={r.id}
                                                onClick={() => navigate(`/reports/${r.id}`)}
                                                className="flex items-center justify-between gap-3 rounded-lg bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-semibold text-gray-900 capitalize">{r.issue_type}</p>
                                                    <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
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
                )}

                {/* Staff/Admin: TDS readings recorded */}
                {(user.role === 'staff' || user.role === 'admin') && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Droplets size={18} className="text-blue-600" />
                                Recent TDS Readings Recorded ({user.tds_readings.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {user.tds_readings.length === 0 ? (
                                <p className="text-gray-500 text-sm">No TDS readings recorded by this user yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {user.tds_readings.map((t) => {
                                        const s = getTdsStatus(t.tds_value)
                                        return (
                                            <div
                                                key={t.id}
                                                onClick={() => navigate(`/tds/${t.id}`)}
                                                className="flex items-center justify-between gap-3 rounded-lg bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        Household #{t.household_number} — {t.tds_value} ppm
                                                    </p>
                                                    <p className="text-xs text-gray-500">{new Date(t.recorded_at).toLocaleDateString()}</p>
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
                )}

                {/* Recent activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ClipboardList size={18} className="text-blue-600" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {user.recent_activity.length === 0 ? (
                            <p className="text-gray-500 text-sm">No recorded activity for this user yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {user.recent_activity.map((a) => (
                                    <div key={a.id} className="border-l-2 border-blue-200 pl-3 py-1">
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

export default UserDetail