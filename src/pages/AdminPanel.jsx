import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { Users, Flag, Plus, Search, Pencil, MessageSquare, UserStar, Trash2, ChevronDown, UserPlus, Inbox } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { adminRequestTypeLabel } from '@/constants/adminRequests'
import { toast } from 'sonner'

const PAGE_SIZE = 10

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
})

const REQUEST_FILTERS = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
]

const requestStatusClass = (status) => ({
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
}[status] || 'bg-gray-100 text-gray-700')

const USER_REQUEST_FILTERS = [
    { key: 'pending', label: 'Pending' },
    { key: 'done', label: 'Done' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
]

const userRequestStatusClass = (status) => ({
    pending: 'bg-amber-100 text-amber-800',
    done: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
}[status] || 'bg-gray-100 text-gray-700')

const AdminPanel = () => {
    const [accountRequests, setAccountRequests] = useState([])
    const [pendingRequestCount, setPendingRequestCount] = useState(0)
    const [requestFilter, setRequestFilter] = useState('pending')
    const [userRequests, setUserRequests] = useState([])
    const [pendingUserRequestCount, setPendingUserRequestCount] = useState(0)
    const [userRequestFilter, setUserRequestFilter] = useState('pending')
    const [userRequestsError, setUserRequestsError] = useState('')
    const [reviewTarget, setReviewTarget] = useState(null)
    const [reviewNote, setReviewNote] = useState('')
    const [reviewing, setReviewing] = useState(false)
    const [users, setUsers] = useState([])
    const [flagged, setFlagged] = useState([])
    const [concerns, setConcerns] = useState([])
    const [loading, setLoading] = useState(true)
    const [resendingUserId, setResendingUserId] = useState(null)
    const [pendingAction, setPendingAction] = useState(null)
    const [actionConfirmOpen, setActionConfirmOpen] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') || 'users'
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    useEffect(() => {
        fetchData()
        fetchAccountRequests()
        fetchUserRequests()
    }, [])

    // Kept apart from fetchData so a failure here never breaks the other tabs.
    const fetchAccountRequests = async () => {
        try {
            const res = await API.get('/account-requests')
            setAccountRequests(res.data.requests || [])
            setPendingRequestCount(Number(res.data.pending_count) || 0)
        } catch (error) {
            console.log('Error fetching account requests:', error)
        }
    }

    // Also kept apart: this tab needs the admin_requests table, which may not exist yet.
    const fetchUserRequests = async () => {
        try {
            const res = await API.get('/admin-requests')
            setUserRequests(res.data.requests || [])
            setPendingUserRequestCount(Number(res.data.pending_count) || 0)
            setUserRequestsError('')
        } catch (error) {
            console.log('Error fetching user requests:', error)
            setUserRequestsError(error.response?.data?.message || 'Failed to load user requests')
        }
    }

    const openReview = (request, status) => {
        setReviewTarget({ request, status })
        setReviewNote('')
    }

    const submitReview = async () => {
        if (!reviewTarget) return
        setReviewing(true)
        try {
            const res = await API.patch(`/admin-requests/${reviewTarget.request.id}`, {
                status: reviewTarget.status,
                admin_note: reviewNote,
            })
            toast.success(res.data.message)
            setReviewTarget(null)
            fetchUserRequests()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update the request')
        } finally {
            setReviewing(false)
        }
    }

    const fetchData = async () => {
        try {
            const [usersRes, flaggedRes, concernsRes] = await Promise.all([
                API.get('/admin/users'),
                API.get('/visualization/flagged'),
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

    const requestActionConfirmation = (action) => {
        setPendingAction(action)
        setActionConfirmOpen(true)
    }

    const confirmPendingAction = async () => {
        if (!pendingAction) return

        if (pendingAction.type === 'role') {
            await handleRoleUpdate(pendingAction.userId, pendingAction.value)
        } else if (pendingAction.type === 'flag-status') {
            await handleFlagStatusUpdate(pendingAction.flagId, pendingAction.value)
        } else if (pendingAction.type === 'resend-verification') {
            await handleResendVerification(pendingAction.user)
        }
    }

    const actionConfirmationDetails = pendingAction?.type === 'role'
        ? {
            title: 'Change user role?',
            description: `This will change the selected user's role to ${pendingAction.value}.`,
            actionText: 'Change role',
        }
        : pendingAction?.type === 'flag-status'
            ? {
                title: 'Change flag status?',
                description: `This will change the flagged household status to ${pendingAction.value}.`,
                actionText: 'Update status',
            }
            : {
                title: 'Resend verification?',
                description: `This will send a verification email to ${pendingAction?.user?.email || 'the user'}.`,
                actionText: 'Resend verification',
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
    const handleResendVerification = async (user) => {
        setResendingUserId(user.id)
        try {
            const response = await API.post(`/admin/users/${user.id}/resend-verification`)
            if (response.data.emailSent === false) {
                toast.warning(response.data.message || 'The verification email could not be sent.')
            } else {
                toast.success(`Verification email sent to ${user.email}`)
            }
            await fetchData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend verification email')
        } finally {
            setResendingUserId(null)
        }
    }

    const emailCell = (u) => (
        <div className="flex flex-wrap items-center gap-2">
            <span className="break-all">{u.email}</span>
            {Number(u.email_verified) === 0 && (
                <span className="inline-block rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                    Unverified
                </span>
            )}
        </div>
    )

    const resendVerificationButton = (u) => Number(u.email_verified) === 0 && (
        <Button
            variant="outline"
            size="sm"
            className="whitespace-nowrap text-amber-700 border-amber-300 hover:bg-amber-50"
            onClick={() => requestActionConfirmation({ type: 'resend-verification', user: u })}
            disabled={resendingUserId === u.id}
        >
            {resendingUserId === u.id ? 'Sending...' : 'Resend verification'}
        </Button>
    )

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
    const filteredRequests = requestFilter === 'all'
        ? accountRequests
        : accountRequests.filter(r => r.status === requestFilter)
    const filteredUserRequests = userRequestFilter === 'all'
        ? userRequests
        : userRequests.filter(r => r.status === userRequestFilter)

    // One page state serves every tab, since only one table is on screen at a time.
    const rowsForTab = {
        users: filteredResidents,
        staff: filteredStaff,
        admin: filteredAdmin,
        flagged,
        concerns,
        requests: filteredRequests,
        'user-requests': filteredUserRequests,
    }[activeTab] || []

    const totalPages = Math.max(1, Math.ceil(rowsForTab.length / PAGE_SIZE))
    const pageStart = (currentPage - 1) * PAGE_SIZE
    const paginatedRows = rowsForTab.slice(pageStart, pageStart + PAGE_SIZE)
    const rowNumber = (index) => pageStart + index + 1

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, activeTab])

    useEffect(() => {
        setCurrentPage(1)
    }, [requestFilter, userRequestFilter])

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
            <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:gap-2">
                {resendVerificationButton(u)}

                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 sm:h-9 sm:px-3 sm:text-sm"
                    onClick={() => navigate(`/admin/edit-user/${u.id}`, { state: u })}
                >
                    <Pencil size={12} className="mr-1 sm:h-[14px] sm:w-[14px]" />
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
                        className="h-7 gap-1 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 sm:h-9 sm:px-3 sm:text-sm"
                    >
                        <Trash2 size={12} className="sm:h-[14px] sm:w-[14px]" />
                        Archive
                    </Button>
                </ConfirmDialog>
            </div>
        ) : null
    );

    return (
        <Layout>
            <div>

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="text-gray-500 mt-1">Manage users, Flagged households, and Concerns.</p>
                    </div>

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
                                { key: 'requests', label: pendingRequestCount > 0 ? `Account Requests (${pendingRequestCount})` : 'Account Requests' },
                            { key: 'user-requests', label: pendingUserRequestCount > 0 ? `User Requests (${pendingUserRequestCount})` : 'User Requests' },

                            ].map(tab => (
                                <option key={tab.key} value={tab.key}>{tab.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Desktop: existing tab row */}
                    <div className="hidden sm:flex min-w-0 overflow-x-auto rounded-xl border border-blue-200 bg-blue-50 p-1">
                        {[
                            { key: 'users', label: 'User Management', icon: Users },
                            { key: 'staff', label: 'Staff Management', icon: Pencil },
                            { key: 'admin', label: 'Admin Management', icon: UserStar },
                            { key: 'flagged', label: 'Flagged Households', icon: Flag },
                            { key: 'concerns', label: 'Concerns', icon: MessageSquare },
                            { key: 'requests', label: 'Account Requests', icon: UserPlus },
                            { key: 'user-requests', label: 'User Requests', icon: Inbox },

                        ].map(tab => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setSearchParams({ tab: tab.key })}
                                    className={`flex-none flex items-center justify-center gap-2 rounded-lg border px-4 sm:px-6 py-3 text-sm font-medium hover:cursor-pointer transition-colors whitespace-nowrap ${activeTab === tab.key
                                        ? 'border-blue-900 bg-blue-900 text-white shadow-sm'
                                        : 'border-transparent text-gray-700 hover:bg-white hover:text-blue-900'
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                    {tab.key === 'requests' && pendingRequestCount > 0 && (
                                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
                                            {pendingRequestCount}
                                        </span>
                                    )}
                                    {tab.key === 'user-requests' && pendingUserRequestCount > 0 && (
                                        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
                                            {pendingUserRequestCount}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {(activeTab === 'users' || activeTab === 'staff' || activeTab === 'admin') && (
                    <Button
                        className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 border mb-2 ml-auto  border-black  shadow text-white flex items-center gap-2"
                        onClick={() => navigate('/admin/add-user')}
                    >
                        <Plus size={16} />
                        Add user
                    </Button>
                )}

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
                                                <TableHead>Zone</TableHead>
                                                <TableHead>Date Joined</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((u, index) => (
                                                <TableRow
                                                    key={u.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => navigate(`/admin/users/${u.id}`, { state: { from: 'admin' } })}
                                                >
                                                    <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                    <TableCell label="Name" className="font-semibold">{u.name}</TableCell>
                                                    <TableCell label="Email">{emailCell(u)}</TableCell>
                                                    <TableCell label="Household">{u.household_number || '—'}</TableCell>
                                                    <TableCell label="Zone">{u.zone || '—'}</TableCell>
                                                    <TableCell label="Date Joined" className="whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                                                    <TableCell
                                                        label="Actions"
                                                        className="max-w-[180px] sm:max-w-none"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
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
                                                        <TableCell label="Email">{emailCell(u)}</TableCell>
                                                        <TableCell label="Role" onClick={(e) => e.stopPropagation()}>
                                                            {u.id === currentUser.id ? (
                                                                <span className={`${roleStyle.bg} ${roleStyle.color} inline-block px-2 py-1 text-xs font-semibold capitalize`}>
                                                                    {u.role}
                                                                </span>
                                                            ) : (
                                                                <select
                                                                    value={pendingAction?.type === 'role' && pendingAction.userId === u.id ? pendingAction.value : u.role}
                                                                    onChange={(e) => requestActionConfirmation({ type: 'role', userId: u.id, value: e.target.value })}
                                                                    className={`${roleStyle.bg} ${roleStyle.color} border-0 px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}
                                                                >
                                                                    <option value="resident">Resident</option>
                                                                    <option value="staff">Staff</option>
                                                                    <option value="admin">Admin</option>
                                                                </select>
                                                            )}
                                                        </TableCell>
                                                        <TableCell label="Date Joined" className="whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                                                        <TableCell label="Actions" onClick={(e) => e.stopPropagation()}>
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
                                                        <TableCell label="Email">{emailCell(u)}</TableCell>
                                                        <TableCell label="Role">
                                                            <span className={`${roleStyle.bg} ${roleStyle.color} inline-block px-2 py-1 text-xs font-semibold capitalize`}>
                                                                {u.role}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell label="Date Joined" className="whitespace-nowrap">{formatDate(u.created_at)}</TableCell>
                                                        <TableCell label="Actions" onClick={(e) => e.stopPropagation()}>
                                                            {resendVerificationButton(u)}
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
                                                <TableHead>Zone</TableHead>
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
                                                    onClick={() => navigate(`/admin/flags/${f.id}`, { state: { from: 'flags' } })}
                                                >
                                                    <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                    <TableCell label="Household">#{f.household_number}</TableCell>
                                                    <TableCell label="Owner" className="font-semibold">{f.owner_name}</TableCell>
                                                    <TableCell label="Zone">Zone {f.zone}</TableCell>
                                                    <TableCell label="Issue Type" className="capitalize">{f.issue_type}</TableCell>
                                                    <TableCell label="Times Reported">
                                                        <span className="bg-red-100 text-red-700 inline-block px-2 py-1 text-xs font-semibold">
                                                            {f.times_reported}x
                                                        </span>
                                                    </TableCell>
                                                    <TableCell label="Status" onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={pendingAction?.type === 'flag-status' && pendingAction.flagId === f.id ? pendingAction.value : f.status}
                                                            onChange={(e) => requestActionConfirmation({ type: 'flag-status', flagId: f.id, value: e.target.value })}
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
                                                <TableHead>Zone</TableHead>
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
                                                    <TableCell label="Zone">{c.zone ? `Zone ${c.zone}` : '—'}</TableCell>
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

                {/* Account Requests tab */}
                {activeTab === 'requests' && (
                    <Card className="bg-white/80">
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <UserPlus size={20} className="text-blue-600" />
                                    Account Requests ({filteredRequests.length})
                                </CardTitle>
                                <div className="flex flex-wrap gap-2">
                                    {REQUEST_FILTERS.map(f => (
                                        <button
                                            key={f.key}
                                            type="button"
                                            onClick={() => setRequestFilter(f.key)}
                                            className={`min-h-9 rounded-lg border px-3 py-1.5 text-sm font-medium hover:cursor-pointer transition-colors ${requestFilter === f.key
                                                ? 'border-blue-900 bg-blue-900 text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <UserPlus size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No requests.</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="md:min-w-[760px]">
                                        <TableHeader className="bg-blue-800">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Household</TableHead>
                                                <TableHead>Zone</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Submitted</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((r, index) => (
                                                <TableRow
                                                    key={r.id}
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => navigate(`/admin/account-requests/${r.id}`)}
                                                >
                                                    <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                    <TableCell label="Name" className="font-semibold break-words">{r.full_name}</TableCell>
                                                    <TableCell label="Household">#{r.household_number}</TableCell>
                                                    <TableCell label="Zone">Zone {r.zone}</TableCell>
                                                    <TableCell label="Status">
                                                        <span className={`inline-block px-2 py-1 text-xs font-semibold capitalize ${requestStatusClass(r.status)}`}>
                                                            {r.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell label="Submitted" className="whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
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

                {/* User Requests tab ("Contact an admin" from Profile) */}
                {activeTab === 'user-requests' && (
                    <Card className="bg-white/80">
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Inbox size={20} className="text-blue-600" />
                                    User Requests ({filteredUserRequests.length})
                                </CardTitle>
                                <div className="flex flex-wrap gap-2">
                                    {USER_REQUEST_FILTERS.map(f => (
                                        <button
                                            key={f.key}
                                            type="button"
                                            onClick={() => setUserRequestFilter(f.key)}
                                            className={`min-h-9 rounded-lg border px-3 py-1.5 text-sm font-medium hover:cursor-pointer transition-colors ${userRequestFilter === f.key
                                                ? 'border-blue-900 bg-blue-900 text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {userRequestsError ? (
                                <div className="text-center py-12">
                                    <Inbox size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">{userRequestsError}</p>
                                </div>
                            ) : filteredUserRequests.length === 0 ? (
                                <div className="text-center py-12">
                                    <Inbox size={48} className="text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No requests.</p>
                                </div>
                            ) : (
                                <>
                                    <Table className="md:min-w-[960px]">
                                        <TableHeader className="bg-blue-800">
                                            <TableRow>
                                                <TableHead>No.</TableHead>
                                                <TableHead>Requester</TableHead>
                                                <TableHead>Household</TableHead>
                                                <TableHead>Request</TableHead>
                                                <TableHead>Reason</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedRows.map((r, index) => (
                                                <TableRow key={r.id}>
                                                    <TableCell label="No.">{rowNumber(index)}</TableCell>
                                                    <TableCell label="Requester">
                                                        <p className="font-semibold break-words">{r.user_name}</p>
                                                        <p className="text-xs text-gray-500 break-all">{r.user_email}</p>
                                                    </TableCell>
                                                    <TableCell label="Household">
                                                        {r.household_number ? `#${r.household_number}, Zone ${r.zone}` : '—'}
                                                    </TableCell>
                                                    <TableCell label="Request">
                                                        <p className="font-medium">{adminRequestTypeLabel(r.request_type)}</p>
                                                        {r.requested_value && (
                                                            <p className="text-xs text-gray-500 break-words">To: {r.requested_value}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell label="Reason" className="max-w-[280px] whitespace-normal break-words">{r.reason}</TableCell>
                                                    <TableCell label="Status">
                                                        <span className={`inline-block px-2 py-1 text-xs font-semibold capitalize ${userRequestStatusClass(r.status)}`}>
                                                            {r.status}
                                                        </span>
                                                        {r.admin_note && (
                                                            <p className="mt-1 text-xs text-gray-500 break-words">Note: {r.admin_note}</p>
                                                        )}
                                                    </TableCell>
                                                    <TableCell label="Submitted" className="whitespace-nowrap">{formatDate(r.created_at)}</TableCell>
                                                    <TableCell label="Actions">
                                                        {r.status === 'pending' ? (
                                                            <div className="flex flex-wrap items-center gap-1 sm:flex-nowrap sm:gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50 sm:h-9 sm:px-3 sm:text-sm"
                                                                    onClick={() => openReview(r, 'done')}
                                                                >
                                                                    Done
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 sm:h-9 sm:px-3 sm:text-sm"
                                                                    onClick={() => openReview(r, 'rejected')}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-500">
                                                                {r.reviewed_by_name ? `By ${r.reviewed_by_name}` : '—'}
                                                            </span>
                                                        )}
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

            </div>
            <Dialog open={reviewTarget !== null} onOpenChange={(open) => !open && !reviewing && setReviewTarget(null)}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="font-semibold">
                            {reviewTarget?.status === 'done' ? 'Mark request as done?' : 'Reject request?'}
                        </DialogTitle>
                        <DialogDescription>
                            {reviewTarget?.status === 'done'
                                ? 'This only records the decision. Make the actual change to the account through Edit User.'
                                : 'The account will not be changed.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="review_note">Note (optional)</Label>
                        <Textarea
                            id="review_note"
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            rows={3}
                            maxLength={500}
                        />
                    </div>
                    <DialogFooter className="bg-white">
                        <Button type="button" variant="outline" disabled={reviewing} onClick={() => setReviewTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant={reviewTarget?.status === 'done' ? 'default' : 'destructive'}
                            disabled={reviewing}
                            onClick={submitReview}
                        >
                            {reviewing ? 'Saving...' : reviewTarget?.status === 'done' ? 'Mark as done' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={actionConfirmOpen}
                onOpenChange={(open) => {
                    setActionConfirmOpen(open)
                    if (!open) setPendingAction(null)
                }}
                title={actionConfirmationDetails.title}
                description={actionConfirmationDetails.description}
                actionText={actionConfirmationDetails.actionText}
                actionVariant="default"
                isLoading={resendingUserId !== null}
                onConfirm={confirmPendingAction}
            />
        </Layout>
    )
}

export default AdminPanel;
