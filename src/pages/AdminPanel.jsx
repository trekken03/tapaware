import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Users, Flag, Plus, Search, Pencil, MessageSquare, UserStar } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toast } from 'sonner'

const AdminPanel = () => {
    const [users, setUsers] = useState([])
    const [flagged, setFlagged] = useState([])
    const [concerns, setConcerns] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get('tab') || 'users'
    const [searchTerm, setSearchTerm] = useState('')
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
        if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return
        try {
            await API.delete(`/admin/users/${userId}`)
            toast.success(`User ${userName} deleted successfully`)
            fetchData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user')
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

    const filteredResidents = users.filter(u => {
        const searchLower = searchTerm.toLowerCase();

        return (
            u.role === "resident" &&
            (
                u.name?.toLowerCase().includes(searchLower) ||
                u.email?.toLowerCase().includes(searchLower) ||
                u.household_number?.toString().includes(searchLower)
            )
        );
    });

    const filteredStaff = users.filter(u => {
        const searchLower = searchTerm.toLowerCase();

        return (
            (u.role === "staff") &&
            (
                u.name?.toLowerCase().includes(searchLower) ||
                u.email?.toLowerCase().includes(searchLower) ||
                u.household_number?.toString().includes(searchLower)
            )
        );
    });

    const filteredAdmin = users.filter(u => {
        const searchLower = searchTerm.toLowerCase();

        return (
            (u.role === "admin") &&
            (
                u.name?.toLowerCase().includes(searchLower) ||
                u.email?.toLowerCase().includes(searchLower) ||
                u.household_number?.toString().includes(searchLower)
            )
        );
    });

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading admin panel...</p>
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
                        <p className="text-gray-500 mt-1">Manage users, Flagged households, and Concerns.</p>
                    </div>
                    {(activeTab === 'users' || activeTab === 'staff') && (
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
                <div className="flex flex-wrap gap-1 border-b mb-6">
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
                                className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
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

                {/* Users tab */}
                {activeTab === 'users' && (

                    <Card>
                        <CardHeader>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Users size={20} className="text-blue-600" />
                                    Registered Users ({filteredResidents.length})
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
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[760px]">
                                    <thead>
                                        <tr className="border-b">
                                            {['#', 'Name', 'Email', 'Household', 'Purok', 'Date Joined', 'Actions'].map(h => (
                                                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-black uppercase">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredResidents.map((u, index) => {

                                            return (
                                                <tr
                                                    key={u.id}
                                                    onClick={() => navigate(`/admin/users/${u.id}`)}
                                                    className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-sm text-black">{index + 1}</td>
                                                    <td className="py-3 px-4 text-sm font-semibold">{u.name}</td>
                                                    <td className="py-3 px-4 text-sm text-black break-all">{u.email}</td>

                                                    <td className="py-3 px-4 text-sm text-black">{u.household_number}</td>
                                                    <td className="py-3 px-4 text-sm text-black">{u.purok}</td>
                                                    <td className="py-3 px-4 text-sm text-black">
                                                        {new Date(u.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric', month: 'long', day: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                        {u.id !== currentUser.id && (
                                                            <div className='flex gap-2'>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                    onClick={() => navigate(`/admin/edit-user/${u.id}`, { state: u })}
                                                                >
                                                                    <Pencil size={14} className='mr-1' />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-3 md:hidden">
                                {filteredResidents.map((u, index) => {

                                    return (
                                        <div key={u.id} className=" border border-gray-200 bg-gray-50 p-4 shadow-sm  cursor-pointer hover:bg-gray-100" onClick={() => navigate(`/admin/users/${u.id}`)}>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">#{index + 1}</span>

                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-700">
                                                <div><span className="font-semibold text-gray-900">Name:</span> {u.name}</div>
                                                <div className="break-all"><span className="font-semibold text-gray-900">Email:</span> {u.email}</div>
                                                <div><span className="font-semibold text-gray-900">Household:</span> {u.household_number || '—'}</div>
                                                <div><span className="font-semibold text-gray-900">Purok:</span> {u.purok || '—'}</div>
                                                <div><span className="font-semibold text-gray-900">Joined:</span> {new Date(u.created_at).toLocaleDateString()}</div>
                                            </div>
                                            {u.id !== currentUser.id && (
                                                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => navigate(`/admin/edit-user/${u.id}`, { state: u })}
                                                    >
                                                        <Pencil size={14} className='mr-1' />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleDeleteUser(u.id, u.name)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
                {activeTab === 'staff' && (

                    <Card>
                        <CardHeader>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Pencil size={20} className="text-blue-600" />
                                    Registered Staffs ({filteredStaff.length})
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
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[760px]">
                                    <thead>
                                        <tr className="border-b">
                                            {['#', 'Name', 'Email', 'Role', 'Date Joined', 'Actions'].map(h => (
                                                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-black uppercase">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStaff.map((u, index) => {
                                            const roleStyle = getRoleStyle(u.role)
                                            return (
                                                <tr
                                                    key={u.id}
                                                    onClick={() => navigate(`/admin/users/${u.id}`)}
                                                    className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                                    <td className="py-3 px-4 text-sm font-semibold">{u.name}</td>
                                                    <td className="py-3 px-4 text-sm text-black break-all">{u.email}</td>
                                                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                        {u.id === currentUser.id ? (
                                                            <span className={`${roleStyle.bg} ${roleStyle.color} px-2 py-1  text-xs font-semibold capitalize`}>
                                                                {u.role}
                                                            </span>
                                                        ) : (



                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                                className={`${roleStyle.bg} ${roleStyle.color} border-0  px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}
                                                            >
                                                                <option value="resident">Resident</option>
                                                                <option value="staff">Staff</option>
                                                                <option value="admin">Admin</option>
                                                            </select>

                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-black">
                                                        {new Date(u.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric', month: 'long', day: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                        {u.id !== currentUser.id && (
                                                            <div className='flex gap-2' onClick={(e) => e.stopPropagation()}>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                    onClick={() => navigate(`/admin/edit-user/${u.id}`, { state: u })}
                                                                >
                                                                    <Pencil size={14} className='mr-1' />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-3 md:hidden">
                                {filteredStaff.map((u, index) => {
                                    const roleStyle = getRoleStyle(u.role)
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => navigate(`/admin/users/${u.id}`)}
                                            className=" border border-gray-200 bg-gray-50 p-4 shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">#{index + 1}</span>
                                                {u.id === currentUser.id ? (
                                                    <span className={`${roleStyle.bg} ${roleStyle.color} px-2 py-1  text-xs font-semibold capitalize`}>
                                                        {u.role}
                                                    </span>
                                                ) : (
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                            className={`${roleStyle.bg} ${roleStyle.color} border-0  px-2 py-1 text-xs font-semibold capitalize cursor-pointer focus:outline-none`}
                                                        >
                                                            <option value="resident">Resident</option>
                                                            <option value="staff">Staff</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-700">
                                                <div><span className="font-semibold text-gray-900">Name:</span> {u.name}</div>
                                                <div className="break-all"><span className="font-semibold text-gray-900">Email:</span> {u.email}</div>
                                                <div><span className="font-semibold text-gray-900">Joined:</span> {new Date(u.created_at).toLocaleDateString()}</div>
                                            </div>
                                            {u.id !== currentUser.id && (
                                                <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => navigate(`/admin/edit-user/${u.id}`, { state: u })}
                                                    >
                                                        <Pencil size={14} className='mr-1' />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleDeleteUser(u.id, u.name)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )
                }
                {activeTab === 'admin' && (

                    <Card>
                        <CardHeader>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <UserStar size={20} className="text-blue-600" />
                                    Registered Admin ({filteredAdmin.length})
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
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[760px]">
                                    <thead>
                                        <tr className="border-b">
                                            {['#', 'Name', 'Email', 'Role', 'Date Joined'].map(h => (
                                                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-black uppercase">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAdmin.map((u, index) => {
                                            const roleStyle = getRoleStyle(u.role)
                                            return (
                                                <tr
                                                    key={u.id}
                                                    onClick={() => navigate(`/admin/users/${u.id}`)}
                                                    className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                                    <td className="py-3 px-4 text-sm font-semibold">{u.name}</td>
                                                    <td className="py-3 px-4 text-sm text-black break-all">{u.email}</td>
                                                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>

                                                        <span className={`${roleStyle.bg} ${roleStyle.color} px-2 py-1  text-xs font-semibold capitalize`}>
                                                            {u.role}
                                                        </span>

                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-black">
                                                        {new Date(u.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric', month: 'long', day: 'numeric',
                                                        })}
                                                    </td>

                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-3 md:hidden">
                                {filteredAdmin.map((u, index) => {
                                    const roleStyle = getRoleStyle(u.role)
                                    return (
                                        <div
                                            key={u.id}
                                            onClick={() => navigate(`/admin/users/${u.id}`)}
                                            className=" border border-gray-200 bg-gray-50 p-4 shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">#{index + 1}</span>

                                                <span className={`${roleStyle.bg} ${roleStyle.color} px-2 py-1  text-xs font-semibold capitalize`}>
                                                    {u.role}
                                                </span>

                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-700">
                                                <div><span className="font-semibold text-gray-900">Name:</span> {u.name}</div>
                                                <div className="break-all"><span className="font-semibold text-gray-900">Email:</span> {u.email}</div>
                                                <div><span className="font-semibold text-gray-900">Joined:</span> {new Date(u.created_at).toLocaleDateString()}</div>
                                            </div>

                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )
                }


                {/* Flagged tab */}
                {
                    activeTab === 'flagged' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Flag size={20} className="text-red-500" />
                                    Flagged Households ({flagged.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {flagged.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-12">
                                        No flagged households at this time.
                                    </p>
                                ) : (
                                    <>
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full min-w-[720px]">
                                                <thead>
                                                    <tr className="border-b">
                                                        {['#', 'Household No.', 'Owner', 'Purok', 'Issue Type', 'Times Reported', 'Status'].map(h => (
                                                            <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-black uppercase">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {flagged.map((f, index) => (
                                                        <tr
                                                            key={f.id}
                                                            onClick={() => navigate(`/admin/flags/${f.id}`)}
                                                            className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                                        >
                                                            <td className="py-3 px-4 text-sm ">{index + 1}</td>
                                                            <td className="py-3 px-4 text-sm ">#{f.household_number}</td>
                                                            <td className="py-3 px-4 text-sm">{f.owner_name}</td>
                                                            <td className="py-3 px-4 text-sm">Purok {f.purok}</td>
                                                            <td className="py-3 px-4 text-sm capitalize">{f.issue_type}</td>
                                                            <td className="py-3 px-4">
                                                                <span className="bg-red-100 text-red-700 px-2 py-1 text-xs font-semibold">
                                                                    {f.times_reported}x
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                                                <select
                                                                    value={f.status}
                                                                    onChange={(e) => handleFlagStatusUpdate(f.id, e.target.value)}
                                                                    className="bg-red-100 text-red-700 border-0  px-2 py-1 text-xs font-semibold capitalize cursor-pointer focus:outline-none"
                                                                >
                                                                    <option value="active" >Active</option>
                                                                    <option value="resolved">Resolved</option>
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="space-y-3 md:hidden">
                                            {flagged.map((f, index) => (
                                                <div
                                                    key={f.id}
                                                    onClick={() => navigate(`/admin/flags/${f.id}`)}
                                                    className=" border border-gray-200 bg-gray-50 p-4 shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">#{index + 1}</span>
                                                        <span className=" bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                                            {f.times_reported}x
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2 text-sm text-gray-700">
                                                        <div><span className="font-semibold text-gray-900">Household:</span> #{f.household_number}</div>
                                                        <div><span className="font-semibold text-gray-900">Owner:</span> {f.owner_name}</div>
                                                        <div><span className="font-semibold text-gray-900">Purok:</span> {f.purok}</div>
                                                        <div><span className="font-semibold text-gray-900">Issue:</span> {f.issue_type}</div>
                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <span className="font-semibold text-gray-900">Status:</span>
                                                            <select
                                                                value={f.status}
                                                                onChange={(e) => handleFlagStatusUpdate(f.id, e.target.value)}
                                                                className="bg-red-100 text-red-700 border-0  px-2 py-1 text-xs font-semibold capitalize cursor-pointer focus:outline-none"
                                                            >
                                                                <option value="active">Active</option>
                                                                <option value="resolved">Resolved</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )
                }
                {/* Concerns tab */}
                {
                    activeTab === 'concerns' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare size={20} className="text-blue-600" />
                                    Public Concerns ({concerns.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {concerns.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-12">
                                        No concerns submitted yet.
                                    </p>
                                ) : (
                                    <>
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full min-w-[720px]">
                                                <thead>
                                                    <tr className="border-b">
                                                        {['#', 'Name', 'Purok', 'Message', 'Status', 'Date'].map(h => (
                                                            <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-black uppercase">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {concerns.map((c, index) => (
                                                        <tr
                                                            key={c.id}
                                                            onClick={() => navigate(`/admin/concerns/${c.id}`)}
                                                            className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                                        >
                                                            <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                                            <td className="py-3 px-4 text-sm font-semibold">{c.name || 'Anonymous'}</td>
                                                            <td className="py-3 px-4 text-sm">{c.purok ? `Purok ${c.purok}` : '—'}</td>
                                                            <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{c.message}</td>
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-1 text-xs font-semibold capitalize ${c.status === 'new' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                                    }`}>
                                                                    {c.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-sm text-gray-500">
                                                                {new Date(c.created_at).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="space-y-3 md:hidden">
                                            {concerns.map((c, index) => (
                                                <div
                                                    key={c.id}
                                                    onClick={() => navigate(`/admin/concerns/${c.id}`)}
                                                    className=" border border-gray-200 bg-gray-50 p-4 shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">#{index + 1}</span>
                                                        <span className={`px-2 py-1 text-xs font-semibold capitalize ${c.status === 'new' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-1.5 text-sm text-gray-700">
                                                        <div><span className="font-semibold text-gray-900">Name:</span> {c.name || 'Anonymous'}</div>
                                                        <div><span className="font-semibold text-gray-900">Purok:</span> {c.purok ? `Purok ${c.purok}` : '—'}</div>
                                                        <div className="line-clamp-2"><span className="font-semibold text-gray-900">Message:</span> {c.message}</div>
                                                        <div><span className="font-semibold text-gray-900">Date:</span> {new Date(c.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )
                }

            </div >
        </Layout >
    )
}

export default AdminPanel;  