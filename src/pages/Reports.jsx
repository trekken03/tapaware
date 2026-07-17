import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Plus, Search, Hourglass, ClockFading, CircleCheck } from 'lucide-react'
import { InputGroupAddon, InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'

const Reports = () => {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const navigate = useNavigate()
    const { user } = useAuth()
    const [searchParams] = useSearchParams()
    const [selectedPurok, setSelectedPurok] = useState('all');
    const statusFilter = searchParams.get('status')

    useEffect(() => {
        fetchReports()
    }, [user?.id])

    const fetchReports = async () => {
        try {
            let res;
            if (user?.role === 'resident') {
                // Residents see only their own reports
                res = await API.get(`/reports/household/${user?.household_id}`)
            } else {
                // Admin and Staff see all reports
                res = await API.get('/reports')
            }
            setReports(res.data || [])
        } catch (error) {
            console.log('Error fetching reports:', error)
            toast.error('Failed to fetch reports')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (reportId, newStatus) => {
        try {
            await API.put(`/reports/${reportId}/status`, { status: newStatus });
            toast.success('Report status updated successfully')
            fetchReports();
        }
        catch (error) {
            console.log('Error updating status:', error)
            toast.error('Failed to update report status')
        }
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending':
                return {
                    color: 'text-yellow-700',
                    bg: 'bg-yellow-100',
                    border: 'border-yellow-400',
                    icon: ClockFading,
                };

            case 'investigating':
                return {
                    color: 'text-violet-700',
                    bg: 'bg-violet-100',
                    border: 'border-violet-400',
                    icon: Hourglass,
                };

            case 'resolved':
                return {
                    color: 'text-green-700',
                    bg: 'bg-green-100',
                    border: 'border-green-400',
                    icon: CircleCheck,
                };

            default:
                return {
                    color: 'text-gray-700',
                    bg: 'bg-gray-100',
                    border: 'border-gray-400',
                };
        }
    };
    const purokOptions = [...new Set(reports.map(r => r.purok).filter(Boolean))]
        .sort((a, b) => a.toString().localeCompare(b.toString(), undefined, { numeric: true }))

    const filteredReports = reports.filter(r => {
        if (selectedPurok !== 'all' && r.purok?.toString() !== selectedPurok) {
            return false
        }
        const matchesStatus = !statusFilter || r.status === statusFilter

        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = (
            r.issue_type.toLowerCase().includes(searchLower) ||
            r.household_number?.toString().includes(searchLower) ||
            r.owner_name?.toLowerCase().includes(searchLower) ||
            r.description?.toLowerCase().includes(searchLower) ||
            r.purok?.toString().includes(searchLower)
        )

        return matchesStatus && matchesSearch
    })

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading { }...</p>
                </div>
            </Layout>
        )
    }

    const isResident = user?.role === 'resident'

    const statusLabel = statusFilter
        ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
        : null

    return (
        <Layout>
            <div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                    <div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-500 mt-1">
                            {isResident
                                ? (statusLabel ? `Your ${statusLabel} reports` : 'Your submitted reports')
                                : (statusLabel ? `Manage all ${statusLabel} reports` : 'Manage all reports')}
                        </p>
                    </div>
                    {isResident && (
                        <Button
                            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                            onClick={() => navigate('/reports/add')}
                        >
                            <Plus size={16} />
                            Submit Report
                        </Button>
                    )}
                </div>

                <Card className="bg-white/80">
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Home size={20} className="text-blue-600" />
                                {isResident
                                    ? 'My Reports'
                                    : statusLabel
                                        ? `All ${statusLabel}`
                                        : 'All Reports'}
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                {/* Purok spinner */}
                                {!isResident && (

                                    < select
                                        value={selectedPurok}
                                        onChange={(e) => setSelectedPurok(e.target.value)}
                                        className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Puroks</option>
                                        {purokOptions.map(purok => (
                                            <option key={purok} value={purok}>
                                                Purok {purok}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                <InputGroup className="max-w-xs">
                                    <InputGroupInput
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <InputGroupAddon>
                                        <Search size={16} />
                                    </InputGroupAddon>
                                </InputGroup>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredReports.length === 0 ? (
                            <div className="text-center py-12">
                                <Home size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    {isResident ? 'You haven\'t submitted any reports yet.' : 'No reports found.'}
                                </p>
                                {isResident && (
                                    <Button
                                        onClick={() => navigate('/reports/add')}
                                        className="mt-4 w-full sm:w-auto bg-blue-900 hover:bg-blue-700"
                                    >
                                        Submit Your First Report
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className={`grid grid-cols-${isResident ? '[repeat(auto-fit,minmax(220px,290px))]' : '[repeat(auto-fit,minmax(220px,290px))] '} justify-center gap-4`}>
                                {filteredReports.map((r) => {
                                    const statusStyle = getStatusStyle(r.status)
                                    const Icon = statusStyle.icon
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => navigate(`/reports/${r.id}`)}
                                            className={`flex gap-4 rounded-lg border-l-3 ${statusStyle.border} shadow-lg bg-gray-50 p-4 h-full cursor-pointer hover:bg-gray-200 transition-all duration-200`}>
                                            <div className={`hidden sm:flex items-center justify-center w-14 h-14 rounded-full ${statusStyle.bg} shrink-0`}>
                                                <Icon size={24} className={`${statusStyle.color}`} />
                                            </div>

                                            <div className="flex-1 flex flex-col h-full">
                                                <div className="flex items-center justify-between mb-2 font-semibold">
                                                    <span className={`text-black-600 ${isResident ? 'text-1xl' : 'text-2xl'} capitalize`}>{r.issue_type}</span>

                                                </div>


                                                <div className="flex flex-col gap-1 text-sm text-gray-700">
                                                    {!isResident && (
                                                        <>
                                                            <p className="font-semibold text-gray-900">Household: #{r.household_number} - Purok {r.purok}</p>
                                                            <p className="font-semibold text-gray-900">Description: {r.description || '-'}</p>
                                                        </>
                                                    )}
                                                    <p className="font-semibold text-gray-900">Date: {new Date(r.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}</p>
                                                </div>

                                                {!isResident && (
                                                    <div className="mt-auto pt-3" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={r.status}
                                                            onChange={(e) => handleStatusUpdate(r.id, e.target.value)}
                                                            className={`${statusStyle.bg} ${statusStyle.color} border-0  px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="investigating">Investigating</option>
                                                            <option value="resolved">Resolved</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </Layout >
    )
}

export default Reports;