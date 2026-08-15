import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Home, Plus, Search, Hourglass, ClockFading, CircleCheck, FileText } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { InputGroupAddon, InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'


const Reports = () => {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)
    const navigate = useNavigate()
    const { user } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
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

    const handleStatusFilterChange = (value) => {
        if (value === 'all') {
            setSearchParams({})
        } else {
            setSearchParams({ status: value })
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

    const statusPurokFiltered = reports.filter(r => {
        if (selectedPurok !== 'all' && r.purok?.toString() !== selectedPurok) {
            return false
        }
        const matchesStatus = !statusFilter || r.status === statusFilter
        return matchesStatus
    })

    const filteredReports = statusPurokFiltered.filter(r => {
        const searchLower = searchTerm.toLowerCase()
        return (
            r.issue_type.toLowerCase().includes(searchLower) ||
            r.household_number?.toString().includes(searchLower) ||
            r.owner_name?.toLowerCase().includes(searchLower) ||
            r.purok?.toString().includes(searchLower)
        )
    })



    const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize))

    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, selectedPurok, statusFilter])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

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
        : 'All'

    return (
        <Layout>
            <div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                    <div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-500 mt-1">
                            {isResident
                                ? (statusLabel ? `Your ${statusLabel} reports` : 'Your submitted reports')
                                : (statusLabel ? `Manage ${statusLabel.toLowerCase()} reports` : 'Manage all reports')}
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
                        <div className="flex flex-col gap-4">
                            <CardTitle className="flex flex-wrap items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                {!isResident ? `${statusLabel} Reports` : 'My Reports'}
                                <span className="text-sm font-normal text-gray-500">
                                    {searchTerm
                                        ? `Showing ${filteredReports.length} of ${statusPurokFiltered.length}`
                                        : `(${statusPurokFiltered.length})`}
                                </span>
                            </CardTitle>

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <Tabs value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
                                    <TabsList variant="line">
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="pending">Pending</TabsTrigger>
                                        <TabsTrigger value="investigating">Investigating</TabsTrigger>
                                        <TabsTrigger value="resolved">Resolved</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <div className="flex items-center gap-3">
                                    {!isResident && (
                                        <Select value={selectedPurok} onValueChange={setSelectedPurok}>
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue placeholder="All Puroks" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Puroks</SelectItem>
                                                {purokOptions.map(purok => (
                                                    <SelectItem key={purok} value={purok}>
                                                        Purok {purok}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                            <>
                                <Table className="md:min-w-[640px]">
                                    <TableHeader className="bg-blue-800">
                                        <TableRow >
                                            <TableHead>No.</TableHead>
                                            <TableHead>Issue</TableHead>
                                            {!isResident && <TableHead>Household</TableHead>}
                                            <TableHead>Purok</TableHead>

                                            <TableHead>Reported</TableHead>
                                            {!isResident && <TableHead className="text-center">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedReports.map((r, index) => {
                                            const statusStyle = getStatusStyle(r.status)
                                            const rowNum = (currentPage - 1) * pageSize + index + 1

                                            return (

                                                <TableRow
                                                    key={r.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => navigate(`/reports/${r.id}`)}
                                                >
                                                    <TableCell label="No.">
                                                        {rowNum}
                                                    </TableCell>

                                                    <TableCell label="Issue" className="font-semibold capitalize">
                                                        {r.issue_type}
                                                    </TableCell>

                                                    {!isResident && (
                                                        <TableCell label="Household">
                                                            #{r.household_number}
                                                        </TableCell>
                                                    )}

                                                    <TableCell label="Purok">
                                                        Purok {r.purok || '—'}
                                                    </TableCell>

                                                    <TableCell label="Reported">
                                                        {new Date(r.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </TableCell>

                                                    {!isResident && (
                                                        <TableCell label="Status" className="text-center">
                                                            {r.status !== 'resolved' ? (
                                                                <select
                                                                    value={r.status}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    onChange={(e) =>
                                                                        handleStatusUpdate(r.id, e.target.value)
                                                                    }
                                                                    className={`${statusStyle.bg} ${statusStyle.color} text-center w-[133px] border border-transparent px-2 py-1 text-xs font-medium focus:outline-none`}
                                                                >
                                                                    {r.status === 'pending' && (
                                                                        <>
                                                                            <option value="pending">
                                                                                Pending
                                                                            </option>
                                                                            <option value="investigating">
                                                                                Investigating
                                                                            </option>
                                                                            <option value="resolved">
                                                                                Resolved
                                                                            </option>
                                                                        </>
                                                                    )}

                                                                    {r.status === 'investigating' && (
                                                                        <>
                                                                            <option value="investigating">
                                                                                Investigating
                                                                            </option>
                                                                            <option value="resolved">
                                                                                Resolved
                                                                            </option>
                                                                        </>
                                                                    )}
                                                                </select>
                                                            ) : (
                                                                <span
                                                                    className={`${statusStyle.bg} ${statusStyle.color} inline-block w-[133px] px-2 py-1 text-xs font-semibold`}
                                                                >
                                                                    Resolved
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    )}
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
        </Layout >
    )
}

export default Reports;