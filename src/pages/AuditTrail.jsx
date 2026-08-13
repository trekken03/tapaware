import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { ScrollText, Search } from 'lucide-react'
import { InputGroupAddon, InputGroup, InputGroupInput } from '@/components/ui/input-group'
import API from '@/services/api'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

const AuditTrail = () => {
    const [auditTrails, setAuditTrails] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)


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

    const totalPages = Math.max(1, Math.ceil(filteredAuditTrails.length / pageSize))
    const paginatedAuditTrails = filteredAuditTrails.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

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


                <Card className="bg-white/80">
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex flex-wrap items-center gap-2">
                                <ScrollText size={20} className="text-blue-600" />
                                Audit Trail
                                <span className="text-sm font-normal text-gray-500">
                                    {searchTerm
                                        ? `Showing ${filteredAuditTrails.length} of ${auditTrails.length}`
                                        : `(${auditTrails.length})`}
                                </span>
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
                                <ScrollText size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No audit trails found.</p>
                            </div>
                        ) : (
                            <>
                                <Table className="md:min-w-[860px]">
                                    <TableHeader className="bg-blue-800">
                                        <TableRow>
                                            <TableHead>No.</TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Table</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Timestamp</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedAuditTrails.map((trail, index) => {
                                            const rowNum = filteredAuditTrails.length - ((currentPage - 1) * pageSize + index)

                                            return (
                                                <TableRow
                                                    key={trail.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => navigate(`/audit-trail/${trail.id}`)}
                                                >
                                                    <TableCell label="No.">{rowNum}</TableCell>
                                                    <TableCell label="User" className="font-semibold">{trail.user_name}</TableCell>
                                                    <TableCell label="Action">{trail.action}</TableCell>
                                                    <TableCell label="Table">{trail.table_affected}</TableCell>
                                                    <TableCell label="Description" className="max-w-[280px] truncate">{trail.details}</TableCell>
                                                    <TableCell label="Timestamp" className="whitespace-nowrap">
                                                        {new Date(trail.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                        })}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                                <div className="mt-4 flex justify-end">
                                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
