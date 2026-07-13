import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Save, KeyRound, ArrowLeft, Home, MapPin, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'

const Profile = () => {
    const navigate = useNavigate()
    const { user, login, token } = useAuth()
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const [loading, setLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)

    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
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
        setLoading(true)

        try {
            await API.put('/auth/profile', form)
            const updatedUser = { ...user, ...form }
            login(token, updatedUser)
            toast.success('Profile updated successfully!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setPasswordLoading(true)

        try {
            await API.put('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })
            toast.success('Password changed successfully!')
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password')
        } finally {
            setPasswordLoading(false)
        }
    }

    const roleBadgeStyle = {
        admin: 'bg-purple-100 text-purple-700',
        staff: 'bg-blue-100 text-blue-700',
        resident: 'bg-green-100 text-green-700',
    }[user?.role] || 'bg-gray-100 text-gray-700'

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

                {/* Header card */}
                <Card className="mb-6 overflow-hidden">

                    <CardContent className="pt-10">
                        <div className="flex items-end gap-4 -mt-10">
                            <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center shrink-0">
                                <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center">
                                    <User size={32} className="text-blue-700" />
                                </div>
                            </div>
                            <div className="pb-1">
                                <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
                                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleBadgeStyle}`}>
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        {user?.role === 'resident' && (
                            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Home size={15} className="text-gray-400" />
                                    {user?.household_number ? `Household #${user.household_number}` : 'No household linked'}
                                </div>
                                {user?.household_number && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={15} className="text-gray-400" />
                                        Purok {user?.purok}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <User size={18} className="text-blue-600" />
                            Personal Information
                        </h2>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
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
                                <p className="text-xs text-gray-400">
                                    Household and purok are managed by barangay staff. Contact an admin to update these.
                                </p>
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
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardContent className="pt-6">
                        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <KeyRound size={18} className="text-blue-600" />
                            Change Password
                        </h2>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type="password"
                                        placeholder="Enter current password"
                                        value={passwordForm.currentPassword}
                                        maxlength="20"
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid sm:grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            name="newPassword"
                                            type="password"
                                            placeholder="At least 6 characters"
                                            value={passwordForm.newPassword}
                                            minlength="6"
                                            maxlength="20"
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword1(!showPassword1)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword1 ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>

                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="Re-enter new password"
                                            minlength="6"
                                            maxlength="20"
                                            value={passwordForm.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword2(!showPassword2)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword2 ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>
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