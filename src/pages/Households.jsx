import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Home, Plus, Search } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"

const Households = () => {
    const [households, setHouseholds] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(10)
    const [selectedPurok, setSelectedPurok] = useState('all');
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const statusFilter = searchParams.get('status')

    useEffect(() => {
        fetchHouseholds()
    }, [])

    const fetchHouseholds = async () => {
        try {
            const res = await API.get('/households')
            setHouseholds(res.data)
        } catch (error) {
            console.log('Error fetching households:', error)
            toast.error('Failed to fetch households')
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

    const getHouseholdStatusStyle = (status) => {
        switch (status) {
            case 'flagged':
                return {
                    label: 'Flagged',
                    color: 'text-red-700',
                    bg: 'bg-red-100',
                    border: 'border-red-400',
                };
            case 'pending':
                return {
                    label: 'Pending Reports',
                    color: 'text-yellow-700',
                    bg: 'bg-yellow-100',
                    border: 'border-yellow-400',
                };
            default:
                return {
                    label: 'Safe',
                    color: 'text-green-700',
                    bg: 'bg-green-100',
                    border: 'border-green-400',
                };
        }
    };

    const purokOptions = [...new Set(households.map(h => h.purok).filter(Boolean))]
        .sort((a, b) => a.toString().localeCompare(b.toString(), undefined, { numeric: true }))

    const statusPurokFiltered = households.filter(h => {
        if (selectedPurok !== 'all' && h.purok?.toString() !== selectedPurok) {
            return false
        }
        if (statusFilter && h.computed_status !== statusFilter) {
            return false
        }
        return true
    })

    const filteredHouseholds = statusPurokFiltered.filter(h => {
        const searchLower = searchTerm.toLowerCase()
        return (
            h.household_number?.toString().includes(searchLower) ||
            h.owner_name?.toLowerCase().includes(searchLower) ||
            h.purok?.toString().includes(searchLower) ||
            h.address?.toLowerCase().includes(searchLower)
        )
    })

    const totalPages = Math.max(1, Math.ceil(filteredHouseholds.length / pageSize))
    const paginatedHouseholds = filteredHouseholds.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
                    <p className="text-gray-500">Loading households...</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div>

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Households</h1>
                        <p className="text-gray-500 mt-1">Manage barangay household records</p>
                    </div>
                    <Button
                        className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                        onClick={() => navigate('/households/add')}
                    >
                        <Plus size={16} />
                        Add Household
                    </Button>
                </div>

                <Card className="bg-white/80">
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <CardTitle className="flex flex-wrap items-center gap-2">
                                <Home size={20} className="text-blue-600" />
                                All Households
                                <span className="text-sm font-normal text-gray-500">
                                    {searchTerm
                                        ? `Showing ${filteredHouseholds.length} of ${statusPurokFiltered.length}`
                                        : `(${statusPurokFiltered.length})`}
                                </span>
                            </CardTitle>

                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <Tabs value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
                                    <TabsList variant="line">
                                        <TabsTrigger value="all">All</TabsTrigger>
                                        <TabsTrigger value="safe">Safe</TabsTrigger>
                                        <TabsTrigger value="pending">Pending Reports</TabsTrigger>
                                        <TabsTrigger value="flagged">Flagged</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                <div className="flex items-center gap-3">
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
                        {filteredHouseholds.length === 0 ? (
                            <div className="text-center py-12">
                                <Home size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No households found.</p>
                            </div>
                        ) : (
                            <>
                                <Table className="md:min-w-[820px]">
                                    <TableHeader className="bg-blue-800">
                                        <TableRow>
                                            <TableHead>No.</TableHead>
                                            <TableHead>Owner</TableHead>
                                            <TableHead>Household</TableHead>
                                            <TableHead>Purok</TableHead>
                                            <TableHead>Address</TableHead>
                                            <TableHead>Date Added</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedHouseholds.map((h, index) => {
                                            const status = getHouseholdStatusStyle(h.computed_status)
                                            const rowNum = (currentPage - 1) * pageSize + index + 1

                                            return (
                                                <TableRow
                                                    key={h.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => navigate(`/households/${h.id}`)}
                                                >
                                                    <TableCell label="No.">{rowNum}</TableCell>
                                                    <TableCell label="Owner" className="font-semibold">{h.owner_name}</TableCell>
                                                    <TableCell label="Household">#{h.household_number}</TableCell>
                                                    <TableCell label="Purok">Purok {h.purok}</TableCell>
                                                    <TableCell label="Address" className="max-w-[200px] truncate">{h.address}</TableCell>
                                                    <TableCell label="Date Added">
                                                        {new Date(h.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </TableCell>
                                                    <TableCell label="Status" className="text-center">
                                                        <span
                                                            className={`${status.bg} ${status.color} inline-block w-[133px] px-2 py-1 text-xs font-semibold whitespace-nowrap`}
                                                        >
                                                            {status.label}
                                                        </span>
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

export default Households