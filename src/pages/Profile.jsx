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
    const { user, updateUser } = useAuth()
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
            updateUser(form)
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

        if (passwordForm.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters')
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

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className={user?.role === 'resident' ? 'relative z-10 mb-4 flex min-h-11 items-center gap-2' : 'flex items-center gap-2 mb-4'}
                >
                    <ArrowLeft size={16} />
                    Back
                </Button>
                <h1 className={user?.role === 'resident' ? 'relative z-10 mb-6 text-2xl font-bold text-[#173574] sm:text-3xl' : 'text-2xl font-bold text-gray-900 mb-6'}>Account Settings</h1>

                {/* Header card */}

                <div className={user?.role === 'resident' ? 'relative z-10 mx-auto grid w-full grid-cols-1 gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:grid-rows-[auto_auto]' : 'contents'}>
                    <Card className={user?.role === 'resident' ? 'contents' : 'mb-6 overflow-hidden w-full'}>

                        <CardContent className={user?.role === 'resident' ? 'contents' : 'pt-10 bg-white/10'}>
                            <div className={user?.role === 'resident' ? 'rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:col-start-1 sm:row-start-1' : 'contents'}>
                                <div className={user?.role === 'resident' ? 'flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left' : 'gap-4 -mt-10 justify-center items-center flex mb-5'}>
                                    <div className={user?.role === 'resident' ? 'size-20 rounded-full border-4 border-white bg-white shadow-sm flex items-center justify-center shrink-0' : 'w-30 h-30 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center shrink-0'}>
                                        <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center">
                                            <User size={32} className="text-blue-700" />
                                        </div>
                                    </div>
                                    <div className="pb-1">
                                        <h1 className={user?.role === 'resident' ? 'text-2xl font-bold text-[#173574]' : 'text-4xl font-bold text-gray-900'}>{user?.name}</h1>
                                        <span className={user?.role === 'resident' ? `mt-1 inline-flex min-h-6 items-center px-2.5 py-0.5 text-xs font-semibold capitalize ${roleBadgeStyle}` : `inline-block mt-1 px-2.5 py-0.5 text-mn font-semibold capitalize ${roleBadgeStyle}`}>
                                            {user?.role}
                                        </span>
                                    </div>
                                </div>

                                {user?.role === 'resident' && (
                                    <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-4 text-center sm:justify-start sm:text-left">
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
                            </div>

                            {/* Personal Information */}
                            <div className={user?.role === 'resident' ? 'contents' : 'grid sm:grid-cols-2 gap-6'}>
                                <Card className={user?.role === 'resident' ? 'mb-0 h-min rounded-2xl border-0 bg-white shadow-lg sm:col-start-1 sm:row-start-2' : 'mb-6 h-min shadow-sm'}>
                                    <CardContent className="pt-6">
                                        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                            <User size={18} className="text-blue-600" />
                                            Personal Information
                                        </h2>

                                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                                            <div className={user?.role === 'resident' ? 'grid grid-cols-1 gap-4' : 'grid sm:grid-cols-2 gap-4'}>
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Full Name</Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        value={form.name}
                                                        onChange={handleChange}
                                                        required
                                                        className={user?.role === 'resident' ? 'h-11 text-base' : ''}
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
                                                        className={user?.role === 'resident' ? 'h-11 text-base' : ''}
                                                    />
                                                </div>
                                            </div>

                                            {user?.role === 'resident' && (
                                                <p className="text-xs text-black">
                                                    Household number and purok are managed by barangay staff.{' '}
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



                                            <div className={user?.role === 'resident' ? 'pt-2' : 'pt-2 flex justify-end'}>
                                                <Button
                                                    type="submit"
                                                    className={user?.role === 'resident' ? 'h-11 w-full bg-blue-900 text-white hover:bg-blue-700' : 'bg-blue-900 hover:bg-blue-700 text-white flex items-center gap-2'}
                                                    disabled={loading}
                                                >
                                                    <Save size={16} className={user?.role === 'resident' ? 'mr-2' : ''} />
                                                    {loading ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Change Password */}
                                <Card className={user?.role === 'resident' ? 'mb-0 rounded-2xl border-0 bg-white shadow-lg sm:col-start-2 h-min sm:row-span-2 sm:row-start-1' : 'mb-6 h-min shadow-sm'}>
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
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Enter current password"
                                                        value={passwordForm.currentPassword}
                                                        maxLength="20"
                                                        onChange={handlePasswordChange}
                                                        required
                                                        className={user?.role === 'resident' ? 'h-11 pr-12 text-base' : ''}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className={user?.role === 'resident' ? 'absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600' : 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'}
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
                                                            type={showPassword1 ? 'text' : 'password'}
                                                            placeholder="At least 8 characters"
                                                            value={passwordForm.newPassword}
                                                            minLength="6"
                                                            maxLength="20"
                                                            onChange={handlePasswordChange}
                                                            required
                                                            className={user?.role === 'resident' ? 'h-11 pr-12 text-base' : ''}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword1(!showPassword1)}
                                                            className={user?.role === 'resident' ? 'absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600' : 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'}
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
                                                            className={user?.role === 'resident' ? 'h-11 pr-12 text-base' : ''}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword2(!showPassword2)}
                                                            className={user?.role === 'resident' ? 'absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-600' : 'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'}
                                                        >
                                                            {showPassword2 ? <Eye size={18} /> : <EyeOff size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={user?.role === 'resident' ? 'pt-2' : 'pt-2 flex justify-end'}>
                                                <Button
                                                    type="submit"
                                                    className={user?.role === 'resident' ? 'h-11 w-full bg-blue-900 text-white hover:bg-blue-700' : 'bg-blue-900 hover:bg-blue-700 text-white flex items-center gap-2'}
                                                    disabled={passwordLoading}
                                                >
                                                    <KeyRound size={16} className={user?.role === 'resident' ? 'mr-2' : ''} />
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
        </Layout>
    )
}

export default Profile