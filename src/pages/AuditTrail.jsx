import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Plus, Eye, Search } from 'lucide-react'
import { InputGroupAddon, InputGroup, InputGroupInput } from '@/components/ui/input-group'
import API from '@/services/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const AuditTrail = () => {
    const [auditTrails, setAuditTrails] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')


    useEffect(() => {
        fetchAuditTrails()
    }, [])

    const fetchAuditTrails = async () => {
        try {
            const res = await API.get('/admin/audit-trail')
            setAuditTrails(res.data)
        } catch (error) {
            console.log('Error fetching audit trails:', error)
            toast.error('Failed to fetch audit trails')
        } finally {
            setLoading(false)
        }
    }

    const filteredAuditTrails = auditTrails.filter(trail => {
        const searchLower = searchTerm.toLowerCase()
        return (
            trail.user_name?.toLowerCase().includes(searchLower) ||
            trail.action?.toLowerCase().includes(searchLower) ||
            trail.details?.toLowerCase().includes(searchLower) ||
            trail.table_affected?.toLowerCase().includes(searchLower)
        )
    })

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading audit trails...</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div>


                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Audit Trail</h1>
                        <p className="text-gray-500 mt-1">View system audit logs</p>
                    </div>
                </div>


                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Home size={20} className="text-blue-600" />
                                Audit Trail
                            </CardTitle>
                            <InputGroup className="w-full sm:max-w-xs">
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
                    </CardHeader>
                    <CardContent>
                        {filteredAuditTrails.length === 0 ? (
                            <div className="text-center py-12">
                                <Home size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No audit trails found.</p>
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full min-w-[760px]">
                                        <thead>
                                            <tr className="border-b">
                                                {['#', 'User', 'Action', 'Table', 'Description', 'Timestamp'].map(h => (
                                                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-black uppercase">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAuditTrails.map((trail, index) => (
                                                <tr
                                                    key={trail.id}
                                                    onClick={() => navigate(`/audit-trail/${trail.id}`)}
                                                    className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-sm">{index + 1}</td>
                                                    <td className="py-3 px-4 text-sm">{trail.user_name}</td>
                                                    <td className="py-3 px-4 text-sm">{trail.action}</td>
                                                    <td className="py-3 px-4 text-sm ">{trail.table_affected}</td>
                                                    <td className="py-3 px-4 text-sm">{trail.details}</td>
                                                    <td className="py-3 px-4 text-sm ">
                                                        {new Date(trail.created_at).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="space-y-3 md:hidden">
                                    {filteredAuditTrails.map((trail, index) => (
                                        <div
                                            key={trail.id}
                                            onClick={() => navigate(`/audit-trail/${trail.id}`)}
                                            className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">#{index + 1}</span>
                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                                    {trail.action}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-700">
                                                <div>
                                                    <span className="font-semibold text-gray-900">User:</span> {trail.user_name}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">Table:</span> {trail.table_affected}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">Description:</span> {trail.details}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900">Timestamp:</span> {new Date(trail.created_at).toLocaleString()}
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

export default AuditTrail;
