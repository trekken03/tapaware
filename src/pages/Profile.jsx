import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Save, KeyRound, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'

const Profile = () => {
    const navigate = useNavigate()
    const { user, login, token } = useAuth()

    const [loading, setLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        household_number: user?.household_number || '',
        purok: user?.purok || '',
    })

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            await API.put('/auth/profile', form)
            const updatedUser = { ...user, ...form }
            login(token, updatedUser)
            setSuccess('Profile updated successfully!')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setPasswordError('')
        setPasswordSuccess('')

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Passwords do not match')
            return
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Password must be at least 6 characters')
            return
        }

        setPasswordLoading(true)

        try {
            await API.put('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
            setPasswordSuccess('Password changed successfully!')
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            })
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password')
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mb-4"
                >
                    <ArrowLeft size={16} />
                    Back
                </Button>

                {/* Everything lives inside one card */}
                <Card>
                    <CardContent className="pt-6">

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                <User size={75} className="text-gray-500" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                                <p className="text-gray-500 mt-1">View and update your account information</p>
                            </div>
                        </div>

                        {/* Role badge */}
                        <div className="mb-6">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize
                                ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    user?.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                                        'bg-green-100 text-green-700'}`}>
                                {user?.role}
                            </span>
                        </div>

                        {/* Personal Information */}
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <User size={20} className="text-blue-600" />
                            Personal Information
                        </h2>

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
                                {success}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {user?.role === 'resident' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="household_number">Household Number</Label>
                                        <Input
                                            id="household_number"
                                            name="household_number"
                                            value={form.household_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="purok">Purok</Label>
                                        <Input
                                            id="purok"
                                            name="purok"
                                            value={form.purok}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end">
                                <Button
                                    type="submit"
                                    className="bg-blue-900 hover:bg-blue-700 text-white flex items-center gap-2"
                                    disabled={loading}
                                >
                                    <Save size={16} />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>

                        </form>

                        {/* Divider between the two sections */}
                        <hr className="my-8 border-gray-200" />

                        {/* Change Password */}
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <KeyRound size={20} className="text-blue-600" />
                            Change Password
                        </h2>

                        {passwordSuccess && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
                                {passwordSuccess}
                            </div>
                        )}

                        {passwordError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                                {passwordError}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    placeholder="Enter current password"
                                    value={passwordForm.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    placeholder="At least 6 characters"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter new password"
                                    value={passwordForm.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />
                            </div>
                            <div className="pt-2 flex justify-end">
                                <Button
                                    type="submit"
                                    className="bg-blue-900 hover:bg-blue-700 text-white flex items-center gap-2"
                                    disabled={passwordLoading}
                                >
                                    <KeyRound size={16} />
                                    {passwordLoading ? 'Changing...' : 'Change Password'}
                                </Button>
                            </div>
                        </form>

                    </CardContent>
                </Card>

            </div>
        </Layout>
    )
}

export default Profile