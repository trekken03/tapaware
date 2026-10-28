import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Save, KeyRound, ArrowLeft, Home, MapPin, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'

const Profile = () => {
    const navigate = useNavigate()
    const { user, updateUser } = useAuth()
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword1, setShowPassword1] = useState(false);
    const [showPassword2, setShowPassword2] = useState(false);

    const [loading, setLoading] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [profileConfirmOpen, setProfileConfirmOpen] = useState(false)
    const [passwordConfirmOpen, setPasswordConfirmOpen] = useState(false)

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

    const handleUpdateProfile = (e) => {
        e.preventDefault()
        setProfileConfirmOpen(true)
    }

    const saveProfile = async () => {
        setLoading(true)

        try {
            await API.put('/auth/profile', { name: form.name })
            updateUser({ name: form.name })
            toast.success('Profile updated successfully!')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const handleChangePassword = (e) => {
        e.preventDefault()

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (passwordForm.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
            return
        }

        setPasswordConfirmOpen(true)
    }

    const savePassword = async () => {
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
        admin: 'bg-purple-200 text-purple-800',
        staff: 'bg-blue-200 text-blue-800',
        resident: 'bg-green-200 text-green-800',
    }[user?.role] || 'bg-gray-100 text-gray-700'

    return (
        <Layout>
            <div className={user?.role === 'resident' ? 'relative isolate -m-4 min-h-[calc(100svh-8rem)] overflow-hidden bg-gradient-to-b from-sky-100 via-sky-50 to-blue-100 p-4 sm:-m-6 sm:p-6 lg:-m-8 lg:p-8' : ''}>
                {user?.role === 'resident' && (
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                        <img
                            src="/assets/login_clouds.png"
                            alt=""
                            width={367}
                            height={151}
                            className="absolute right-0 top-3 hidden w-72 sm:block"
                        />
                        <img
                            src="/assets/login_clouds.png"
                            alt=""
                            width={367}
                            height={151}
                            className="absolute left-0 top-3.5 hidden w-72 sm:block"
                        />

                        <img
                            src="/assets/login_page_water.png"
                            alt=""
                            width={1303}
                            height={190}
                            loading="lazy"
                            className="absolute inset-x-0 bottom-0 h-auto max-h-[190px] w-full object-fill opacity-80"
                        />
                        <img
                            src="/assets/login_page_houses.png"
                            alt=""
                            width={661}
                            height={338}
                            loading="lazy"
                            className="absolute -bottom-2 -left-10 hidden w-[min(45vw,38rem)] sm:block"
                        />
                    </div>
                )}


                <h1 className="relative z-10 mx-auto mb-6 w-full max-w-5xl text-3xl font-bold text-[#102765]">Account Settings</h1>

                {/* Header card */}

                <div className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-6 md:grid-cols-2">
                    <Card className="contents">

                        <CardContent className="contents">
                            <div className="rounded-2xl bg-white p-6 shadow-xl md:col-start-1 md:row-start-1">
                                <div className="flex items-center gap-5">
                                    <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white bg-blue-100 shadow-md">
                                        <div className="flex size-full items-center justify-center rounded-full bg-blue-100">
                                            <User size={32} className="text-blue-700" />
                                        </div>
                                    </div>
                                    <div className="pb-1">
                                        <h1 className="text-2xl font-bold text-[#102765]">{user?.name}</h1>
                                        <span className={`mt-2 inline-flex min-h-6 items-center rounded-full px-3 py-1 text-xs font-bold capitalize ${roleBadgeStyle}`}>
                                            {user?.role}
                                        </span>
                                    </div>
                                </div>

                                {user?.role === 'resident' && (
                                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Home size={15} className="text-gray-400" />
                                            {user?.household_number ? `Household #${user.household_number}` : 'No household linked'}
                                        </div>
                                        {user?.household_number && (
                                            <div className="flex items-center gap-2">
                                                <MapPin size={15} className="text-gray-400" />
                                                Zone {user?.zone}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Personal Information */}
                            <div className="contents">
                                <Card className="mb-0 h-min min-w-0 rounded-2xl border-0 bg-white shadow-xl md:col-start-1 md:row-start-2">
                                    <CardContent className="p-6">
                                        <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[#102765]">
                                            <User size={18} className="text-[#102765]" />
                                            Personal Information
                                        </h2>

                                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Full Name</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        value={form.name}
                                                        onChange={handleChange}
                                                        required
                                                        className="h-11 rounded-md border-gray-300 bg-gray-50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        value={form.email}
                                                        readOnly
                                                        aria-readonly="true"
                                                        className="h-11 cursor-not-allowed rounded-md border-gray-300 bg-slate-100 text-slate-500"
                                                    />
                                                    <p className="text-xs text-gray-500">Your email can only be changed by an administrator.</p>
                                                </div>
                                            </div>

                                            {user?.role === 'resident' && (
                                                <p className="text-xs text-gray-500">
                                                    Household number and zone are managed by barangay staff.{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate('/', { state: { scrollTo: 'contact' } })}
                                                        className="inline-flex min-h-11 items-center underline hover:text-gray-600 hover:cursor-pointer"
                                                    >
                                                        Contact an admin
                                                    </button>{' '}
                                                    to update these.
                                                </p>
                                            )}



                                            <div className="pt-2">
                                                <Button
                                                    type="submit"
                                                    className="h-11 w-full bg-[#102765] text-white hover:bg-[#1a3a8f]"
                                                    disabled={loading}
                                                >
                                                    <Save size={16} className="mr-2" />
                                                    {loading ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Change Password */}
                                <Card className="mb-0 h-min min-w-0 rounded-2xl border-0 bg-white shadow-xl md:col-start-2 md:row-span-2 md:row-start-1">
                                    <CardContent className="p-6">
                                        <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[#102765]">
                                            <KeyRound size={18} className="text-[#102765]" />
                                            Change Password
                                        </h2>

                                        <form onSubmit={handleChangePassword} className="space-y-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="currentPassword">Current Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="currentPassword"
                                                        name="currentPassword"
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Enter current password"
                                                        value={passwordForm.currentPassword}
                                                        maxLength="20"
                                                        onChange={handlePasswordChange}
                                                        required
                                                        className="h-11 rounded-md border-gray-300 bg-gray-50 pr-12"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword">New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="newPassword"
                                                            name="newPassword"
                                                            type={showPassword1 ? 'text' : 'password'}
                                                            placeholder="At least 8 characters"
                                                            value={passwordForm.newPassword}
                                                            minLength="6"
                                                            maxLength="20"
                                                            onChange={handlePasswordChange}
                                                            required
                                                            className="h-11 rounded-md border-gray-300 bg-gray-50 pr-12"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword1(!showPassword1)}
                                                            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600"
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
                                                            type={showPassword2 ? 'text' : 'password'}
                                                            placeholder="Re-enter new password"
                                                            minLength="6"
                                                            maxLength="20"
                                                            value={passwordForm.confirmPassword}
                                                            onChange={handlePasswordChange}
                                                            required
                                                            className="h-11 rounded-md border-gray-300 bg-gray-50 pr-12"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword2(!showPassword2)}
                                                            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showPassword2 ? <Eye size={18} /> : <EyeOff size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <Button
                                                    type="submit"
                                                    className="h-11 w-full bg-[#102765] text-white hover:bg-[#1a3a8f]"
                                                    disabled={passwordLoading}
                                                >
                                                    <KeyRound size={16} className="mr-2" />
                                                    {passwordLoading ? 'Changing...' : 'Change Password'}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                        </CardContent>
                    </Card>
                </div>

            </div>
            <ConfirmDialog
                open={profileConfirmOpen}
                onOpenChange={setProfileConfirmOpen}
                title="Save changes?"
                description="This will update your account profile."
                actionText="Save"
                actionVariant="default"
                isLoading={loading}
                onConfirm={saveProfile}
            />
            <ConfirmDialog
                open={passwordConfirmOpen}
                onOpenChange={setPasswordConfirmOpen}
                title="Change password?"
                description="This will replace your current account password."
                actionText="Change Password"
                actionVariant="default"
                isLoading={passwordLoading}
                onConfirm={savePassword}
            />
        </Layout>
    )
}

export default Profile