import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Droplets } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { Trash2 } from 'lucide-react'


const getTdsStatus = (value) => {
    if (value <= 500) return { label: 'Safe', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-400' }
    if (value <= 1000) return { label: 'Moderate', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-400' }
    return { label: 'High', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-400' }
}

const TdsDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [reading, setReading] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    const handleDelete = async () => {
        if (!window.confirm('Delete this TDS reading? This cannot be undone.')) return

        try {
            await API.delete(`/tds/${id}`)
            toast.success('Reading deleted successfully')
            navigate('/tds')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete reading')
        }
    }

    useEffect(() => {
        fetchReading()
    }, [id])

    const fetchReading = async () => {
        try {
            const res = await API.get(`/tds/${id}`)
            setReading(res.data)
        } catch (error) {
            console.log('Error fetching reading:', error)
            toast.error('Failed to fetch TDS reading')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading reading...</p>
                </div>
            </Layout>
        )
    }

    if (!reading) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Reading not found.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/tds')}>
                        Back to TDS Readings
                    </Button>
                </div>
            </Layout>
        )
    }

    const status = getTdsStatus(reading.tds_value)

    return (
        <Layout>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => navigate('/tds')}
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
                                <h1 className="text-2xl font-bold text-gray-900">{reading.owner_name}</h1>
                                <p className="text-gray-500">
                                    Household #{reading.household_number} - Purok {reading.purok}
                                </p>
                            </div>
                            <span className={`${status.bg} ${status.color} px-3 py-1 rounded-full text-sm font-semibold`}>
                                {status.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">TDS Value</p>
                                <p className="font-semibold text-gray-900">{reading.tds_value} ppm</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Recorded By</p>
                                <p className="font-semibold text-gray-900">{reading.staff_name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Address</p>
                                <p className="font-semibold text-gray-900">{reading.address}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date Recorded</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(reading.recorded_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-gray-500">Notes</p>
                                <p className="font-semibold text-gray-900">{reading.notes || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Droplets size={20} className="text-blue-600" />
                            Past Readings from this Household
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {reading.household_history.length === 0 ? (
                            <p className="text-gray-500 text-sm">No other readings recorded for this household.</p>
                        ) : (
                            <div className="space-y-2">
                                {reading.household_history.map((h) => {
                                    const s = getTdsStatus(h.tds_value)
                                    return (
                                        <div
                                            key={h.id}
                                            onClick={() => navigate(`/tds/${h.id}`)}
                                            className={`flex items-center justify-between gap-3 rounded-lg border-l-4 ${s.border} bg-gray-100 p-3 cursor-pointer hover:bg-gray-200 transition-all duration-200`}
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900">{h.tds_value} ppm</p>
                                                <p className="text-xs text-gray-500">
                                                    {h.staff_name} • {new Date(h.recorded_at).toLocaleDateString()}
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

export default TdsDetail