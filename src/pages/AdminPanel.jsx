import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Users, Flag, Plus, Search, Pencil, MessageSquare, UserStar, Trash2, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

const PAGE_SIZE = 10

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
})

const AdminPanel = () => {
    const [users, setUsers] = useState([])
    const [flagged, setFlagged] = useState([])
    const [concerns, setConcerns] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') || 'users'
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [usersRes, flaggedRes, concernsRes] = await Promise.all([
                API.get('/admin/users'),
                API.get('/analytics/flagged'),
                API.get('/concerns')
            ])
            setUsers(usersRes.data)
            setFlagged(flaggedRes.data)
            setConcerns(concernsRes.data)
        } catch (error) {
            console.log('Error fetching admin data:', error)
            toast.error('Failed to load admin data')
        } finally {
            setLoading(false)
        }
    }

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await API.put(`/admin/users/${userId}/role`, { role: newRole })
            fetchData()
            toast.success(`Successfully changed ID no.${userId} role to:${newRole}`)
        } catch (error) {
            console.log('Error updating role:', error)
        }
    }
    const handleFlagStatusUpdate = async (flagId, newStatus) => {
        try {
            await API.put(`/admin/flags/${flagId}/status`, { status: newStatus })
            toast.success('Flag status updated successfully')
            fetchData()
        } catch (error) {
            console.log('Error updating flag status:', error)
            toast.error('Error updating flag status')
        }
    }

    const handleDeleteUser = async (userId, userName) => {
        try {
            await API.delete(`/admin/users/${userId}`)
            toast.success(`User ${userName} archived successfully`)
            fetchData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to archive user')
        }
    }
    const getRoleStyle = (role) => {
        switch (role) {
            case 'admin': return { color: 'text-purple-700', bg: 'bg-purple-100' }
            case 'staff': return { color: 'text-blue-700', bg: 'bg-blue-100' }
            case 'resident': return { color: 'text-green-700', bg: 'bg-green-100' }
            default: return { color: 'text-gray-700', bg: 'bg-gray-100' }
        }
    }

    const matchesSearch = (u) => {
        const searchLower = searchTerm.toLowerCase()
        return (
            u.name?.toLowerCase().includes(searchLower) ||
            u.email?.toLowerCase().includes(searchLower) ||
            u.household_number?.toString().includes(searchLower)
        )
    }

    const filteredResidents = users.filter(u => u.role === 'resident' && matchesSearch(u))
    const filteredStaff = users.filter(u => u.role === 'staff' && matchesSearch(u))
    const filteredAdmin = users.filter(u => u.role === 'admin' && matchesSearch(u))

    // One page state serves every tab, since only one table is on screen at a time.
    const rowsForTab = {
        users: filteredResidents,
        staff: filteredStaff,
        admin: filteredAdmin,
        flagged,
        concerns,
    }[activeTab] || []

    const totalPages = Math.max(1, Math.ceil(rowsForTab.length / PAGE_SIZE))
    const pageStart = (currentPage - 1) * PAGE_SIZE
    const paginatedRows = rowsForTab.slice(pageStart, pageStart + PAGE_SIZE)
    // Row numbers count down so the newest record keeps the highest number,
    // matching the Reports and Households tables.
    const rowNumber = (index) => rowsForTab.length - (pageStart + index)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, activeTab])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading admin panel...</p>
                </div>
            </Layout>
        )
    }

    const searchInput = (
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
    )

    const paginationRow = (
        <div className="mt-4 flex justify-end">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    )

    const userActions = (u) => (
        u.id !== currentUser.id ? (
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => navigate(`/admin/edit-user/${u.id}`, { state: u })}
                >
                    <Pencil size={14} className='mr-1' />
                    Edit
                </Button>
                <ConfirmDialog
                    title={`Archive user ${u.name}?`}
                    description="Their account will be deactivated and can be restored later from the Archive."
                    actionText="Archive User"
                    actionVariant="destructive"
                    onConfirm={() => handleDeleteUser(u.id, u.name)}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50 rounded-lg"
                    >
                        <Trash2 size={14} />
                        Archive
                    </Button>
                </ConfirmDialog>
            </div>
        ) : null
    )

    return (
        <Layout>
            <div>

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="text-gray-500 mt-1">Manage users, Flagged households, and Concerns.</p>
                    </div>
                    {(activeTab === 'users' || activeTab === 'staff' || activeTab === 'admin') && (
                        <Button
                            className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                            onClick={() => navigate('/admin/add-user')}
                        >
                            <Plus size={16} />
                            Add user
                        </Button>
                    )}
                </div>


                {/* Tabs */}
                <div className="mb-6">
                    {/* Mobile: dropdown spinner */}
                    <div className="sm:hidden relative">
                        <select
                            value={activeTab}
                            onChange={(e) => setSearchParams({ tab: e.target.value })}
                            className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[
                                { key: 'users', label: 'User Management' },
                                { key: 'staff', label: 'Staff Management' },
                                { key: 'admin', label: 'Admin Management' },
                                { key: 'flagged', label: 'Flagged Households' },
                                { key: 'concerns', label: 'Concerns' },

                            ].map(tab => (
                                <option key={tab.key} value={tab.key}>{tab.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Desktop: existing tab row */}
                    <div className="hidden sm:flex gap-1 border-b">
                        {[
                            { key: 'users', label: 'User Management', icon: Users },
                            { key: 'staff', label: 'Staff Management', icon: Pencil },
                            { key: 'admin', label: 'Admin Management', icon: UserStar },
                            { key: 'flagged', label: 'Flagged Households', icon: Flag },
                            { key: 'concerns', label: 'Concerns', icon: MessageSquare },

                        ].map(tab => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setSearchParams({ tab: tab.key })}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Users tab */}
                {activeTab === 'users' && (
                    <Card className="bg-white/80">
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users size={20} className="text-blue-600" />
                                    Registered Users ({filteredResidents.length})
                                </CardTitle>
                                {searchInput}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredResidents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No users found.</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="md:min-w-[900px]">
                                        <TableHeader className="bg-blue-800">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Household</TableHead>
                                                <TableHead>Purok</TableHead>
                                                <TableHead>Date Joined</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((u, index) => (
                                                <TableRow
                                                    key={u.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => navigate(`/admin/users/${u.id}`)}
                                                >
                                                    <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                    <TableCell label="Name" className="font-semibold">{u.name}</TableCell>
                                                    <TableCell label="Email" className="break-all">{u.email}</TableCell>
                                                    <TableCell label="Household">{u.household_number || '—'}</TableCell>
                                                    <TableCell label="Purok">{u.purok || '—'}</TableCell>
                                                    <TableCell label="Date Joined" className="whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        {userActions(u)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {paginationRow}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Staff tab */}
                {activeTab === 'staff' && (
                    <Card className="bg-white/80">
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Pencil size={20} className="text-blue-600" />
                                    Registered Staffs ({filteredStaff.length})
                                </CardTitle>
                                {searchInput}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredStaff.length === 0 ? (
                                <div className="text-center py-12">
                                    <Pencil size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No staff found.</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="md:min-w-[860px]">
                                        <TableHeader className="bg-blue-800">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Date Joined</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((u, index) => {
                                                const roleStyle = getRoleStyle(u.role)
                                                return (
                                                    <TableRow
                                                        key={u.id}
                                                        className="cursor-pointer hover:bg-gray-50"
                                                        onClick={() => navigate(`/admin/users/${u.id}`)}
                                                    >
                                                        <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                        <TableCell label="Name" className="font-semibold">{u.name}</TableCell>
                                                        <TableCell label="Email" className="break-all">{u.email}</TableCell>
                                                        <TableCell label="Role" onClick={(e) => e.stopPropagation()}>
                                                            {u.id === currentUser.id ? (
                                                                <span className={`${roleStyle.bg} ${roleStyle.color} inline-block px-2 py-1 text-xs font-semibold capitalize`}>
                                                                    {u.role}
                                                                </span>
                                                            ) : (
                                                                <select
                                                                    value={u.role}
                                                                    onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                                    className={`${roleStyle.bg} ${roleStyle.color} border-0 px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}
                                                                >
                                                                    <option value="resident">Resident</option>
                                                                    <option value="staff">Staff</option>
                                                                    <option value="admin">Admin</option>
                                                                </select>
                                                            )}
                                                        </TableCell>
                                                        <TableCell label="Date Joined" className="whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            {userActions(u)}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                    {paginationRow}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Admin tab */}
                {activeTab === 'admin' && (
                    <Card className="bg-white/80">
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <UserStar size={20} className="text-blue-600" />
                                    Registered Admin ({filteredAdmin.length})
                                </CardTitle>
                                {searchInput}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredAdmin.length === 0 ? (
                                <div className="text-center py-12">
                                    <UserStar size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No admins found.</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="md:min-w-[720px]">
                                        <TableHeader className="bg-blue-800">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Date Joined</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((u, index) => {
                                                const roleStyle = getRoleStyle(u.role)
                                                return (
                                                    <TableRow
                                                        key={u.id}
                                                        className="cursor-pointer hover:bg-gray-50"
                                                        onClick={() => navigate(`/admin/users/${u.id}`)}
                                                    >
                                                        <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                        <TableCell label="Name" className="font-semibold">{u.name}</TableCell>
                                                        <TableCell label="Email" className="break-all">{u.email}</TableCell>
                                                        <TableCell label="Role">
                                                            <span className={`${roleStyle.bg} ${roleStyle.color} inline-block px-2 py-1 text-xs font-semibold capitalize`}>
                                                                {u.role}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell label="Date Joined" className="whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                    {paginationRow}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Flagged tab */}
                {activeTab === 'flagged' && (
                    <Card className="bg-white/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Flag size={20} className="text-red-500" />
                                Flagged Households ({flagged.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {flagged.length === 0 ? (
                                <div className="text-center py-12">
                                    <Flag size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No flagged households at this time.</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="md:min-w-[860px]">
                                        <TableHeader className="bg-blue-800">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Household</TableHead>
                                                <TableHead>Owner</TableHead>
                                                <TableHead>Purok</TableHead>
                                                <TableHead>Issue Type</TableHead>
                                                <TableHead>Times Reported</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((f, index) => (
                                                <TableRow
                                                    key={f.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => navigate(`/admin/flags/${f.id}`)}
                                                >
                                                    <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                    <TableCell label="Household">#{f.household_number}</TableCell>
                                                    <TableCell label="Owner" className="font-semibold">{f.owner_name}</TableCell>
                                                    <TableCell label="Purok">Purok {f.purok}</TableCell>
                                                    <TableCell label="Issue Type" className="capitalize">{f.issue_type}</TableCell>
                                                    <TableCell label="Times Reported">
                                                        <span className="bg-red-100 text-red-700 inline-block px-2 py-1 text-xs font-semibold">
                                                            {f.times_reported}x
                                                        </span>
                                                    </TableCell>
                                                    <TableCell label="Status" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={f.status}
                                                            onChange={(e) => handleFlagStatusUpdate(f.id, e.target.value)}
                                                            className="bg-red-100 text-red-700 border-0 px-2 py-1 text-xs font-semibold capitalize cursor-pointer focus:outline-none"
                                                        >
                                                            <option value="active">Active</option>
                                                            <option value="resolved">Resolved</option>
                                                        </select>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {paginationRow}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Concerns tab */}
                {activeTab === 'concerns' && (
                    <Card className="bg-white/80">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare size={20} className="text-blue-600" />
                                Public Concerns ({concerns.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {concerns.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No concerns submitted yet.</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="md:min-w-[820px]">
                                        <TableHeader className="bg-blue-800">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Purok</TableHead>
                                                <TableHead>Message</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((c, index) => (
                                                <TableRow
                                                    key={c.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => navigate(`/admin/concerns/${c.id}`)}
                                                >
                                                    <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                    <TableCell label="Name" className="font-semibold">{c.name || 'Anonymous'}</TableCell>
                                                    <TableCell label="Purok">{c.purok ? `Purok ${c.purok}` : '—'}</TableCell>
                                                    <TableCell label="Message" className="max-w-[280px] truncate">{c.message}</TableCell>
                                                    <TableCell label="Status">
                                                        <span className={`inline-block px-2 py-1 text-xs font-semibold capitalize ${c.status === 'new' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell label="Date" className="whitespace-nowrap">{formatDate(c.created_at)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {paginationRow}
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

            </div>
        </Layout>
    )
}

export default AdminPanel;
