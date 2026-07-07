import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Users, Flag, Plus, Search, Pencil } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

const AdminPanel = () => {
    const [users, setUsers] = useState([])
    const [flagged, setFlagged] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('users')
    const [searchTerm, setSearchTerm] = useState('')
    const navigate = useNavigate()
    const { user: currentUser } = useAuth()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [usersRes, flaggedRes] = await Promise.all([
                API.get('/admin/users'),
                API.get('/analytics/flagged')
            ])
            setUsers(usersRes.data)
            setFlagged(flaggedRes.data)
        } catch (error) {
            console.log('Error fetching admin data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await API.put(`/admin/users/${userId}/role`, { role: newRole })
            fetchData()
        } catch (error) {
            console.log('Error updating role:', error)
        }
    }

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return
        try {
            await API.delete(`/admin/users/${userId}`)
            fetchData()
        } catch (error) {
            console.log('Error deleting user:', error)
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
            (u.role === "staff" || u.role === "admin") &&
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
                        <p className="text-gray-500 mt-1">Manage users and monitor flagged households</p>
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
                        { key: 'flagged', label: 'Flagged Households', icon: Flag },

                    ].map(tab => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
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
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px]">
                                    <thead>
                                        <tr className="border-b">
                                            {['#', 'Name', 'Email', 'Role', 'Household', 'Purok', 'Date Joined', 'Actions'].map(h => (
                                                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-black uppercase">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredResidents.map((u, index) => {
                                            const roleStyle = getRoleStyle(u.role)
                                            return (
                                                <tr key={u.id} className={' bg-white'}>
                                                    <td className="py-3 px-4 text-sm text-black">{index + 1}</td>
                                                    <td className="py-3 px-4 text-sm font-semibold">{u.name}</td>
                                                    <td className="py-3 px-4 text-sm text-black break-all">{u.email}</td>
                                                    <td className="py-3 px-4">
                                                        {u.id === currentUser.id ? (
                                                            <span className={`${roleStyle.bg} ${roleStyle.color} px-2 py-1 rounded-full text-xs font-semibold capitalize`}>
                                                                {u.role}
                                                            </span>
                                                        ) : (
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                                className={`${roleStyle.bg} ${roleStyle.color} border-0 rounded-full px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}
                                                            >
                                                                <option value="resident">Resident</option>
                                                                <option value="staff">Staff</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-black">
                                                        {u.household_number}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-black">
                                                        {u.purok}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-black">
                                                        {new Date(u.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {u.id !== currentUser.id && (
                                                            <div className='flex gap-2'>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-blue-600 border-red-200 hover:bg-red-50"
                                                                    onClick={() => handleDeleteUser(u.id, u.name)}
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
                            <div className="overflow-x-auto">
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
                                                <tr key={u.id} className={' bg-white'}>
                                                    < td className="py-3 px-4 text-sm text-gray-500" > {index + 1
                                                    }</td>
                                                    <td className="py-3 px-4 text-sm font-semibold">{u.name}</td>
                                                    <td className="py-3 px-4 text-sm text-black break-all">{u.email}</td>
                                                    <td className="py-3 px-4">
                                                        {u.id === currentUser.id ? (
                                                            <span className={`${roleStyle.bg} ${roleStyle.color} px-2 py-1 rounded-full text-xs font-semibold capitalize`}>
                                                                {u.role}
                                                            </span>
                                                        ) : (
                                                            <select
                                                                value={u.role}
                                                                onChange={(e) => handleRoleUpdate(u.id, e.target.value)}
                                                                className={`${roleStyle.bg} ${roleStyle.color} border-0 rounded-full px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none`}
                                                            >
                                                                <option value="resident">Resident</option>
                                                                <option value="staff">Staff</option>
                                                                <option value="admin">Admin</option>
                                                            </select>
                                                        )}
                                                    </td>

                                                    <td className="py-3 px-4 text-sm text-black">
                                                        {new Date(u.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {u.id !== currentUser.id && (
                                                            <div className='flex gap-2'>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="text-blue-600 border-red-200 hover:bg-red-50"
                                                                    onClick={() => handleDeleteUser(u.id, u.name)}
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
                                                            <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {flagged.map((f, index) => (
                                                        <tr key={f.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                            <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                                            <td className="py-3 px-4 text-sm font-semibold">#{f.household_number}</td>
                                                            <td className="py-3 px-4 text-sm">{f.owner_name}</td>
                                                            <td className="py-3 px-4 text-sm">Purok {f.purok}</td>
                                                            <td className="py-3 px-4 text-sm capitalize">{f.issue_type}</td>
                                                            <td className="py-3 px-4">
                                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                                    {f.times_reported}x
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold capitalize">
                                                                    {f.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="space-y-3 md:hidden">
                                            {flagged.map((f, index) => (
                                                <div key={f.id} className="rounded-lg border border-red-100 bg-red-50 p-4 shadow-sm">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">#{index + 1}</span>
                                                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                                            {f.times_reported}x
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2 text-sm text-gray-700">
                                                        <div><span className="font-semibold text-gray-900">Household:</span> #{f.household_number}</div>
                                                        <div><span className="font-semibold text-gray-900">Owner:</span> {f.owner_name}</div>
                                                        <div><span className="font-semibold text-gray-900">Purok:</span> {f.purok}</div>
                                                        <div><span className="font-semibold text-gray-900">Issue:</span> {f.issue_type}</div>
                                                        <div><span className="font-semibold text-gray-900">Status:</span> {f.status}</div>
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