import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Users, Eye, EyeOff } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PUROKS } from '@/constants/puroks'

// Shared look for every field: white, thin gray outline, rounded, same height.
const labelClass = 'font-normal text-gray-900'
const fieldClass = 'h-11 rounded-lg border-gray-300 bg-white'
const nativeSelectClass =
    'h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

const AddUser = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false);
    const [passwordMode, setPasswordMode] = useState('generate')
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'resident',
        household_number: '',
        zone: '',
        address: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "name") {
            if (!/^[a-zA-Z\s]*$/.test(value)) {
                return;
            }
        }

        if (name === "household_number") {

            if (!/^\d{0,3}$/.test(value)) {
                return;
            }
        }

        setForm({ ...form, [name]: value });
    }


    const isResident = form.role === 'resident'
    const isFormReady =
        form.email.trim() !== '' &&
        (passwordMode === 'generate' || form.password.trim() !== '') &&
        form.name.trim() !== '' &&
        (!isResident || (form.household_number.trim() !== '' && form.zone.trim() !== '' && form.address.trim() !== ''))

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (passwordMode === 'manual' && form.password.length < 8) {
            toast.error('Password too short! must be at least 8 characters long!')
            return
        }

        setConfirmOpen(true)
    }

    const saveUser = async () => {
        setLoading(true)
        try {
            const submitData = {
                name: form.name,
                email: form.email,
                ...(passwordMode === 'manual' ? { password: form.password } : {}),
                password_mode: passwordMode,
                role: form.role,
                household_number: form.role === 'resident' && form.household_number ? parseInt(form.household_number, 10) : null,
                zone: form.role === 'resident' && form.zone ? parseInt(form.zone, 10) : null,
                address: form.role === 'resident' ? form.address : null
            }

            const response = await API.post('/auth/register', submitData)
            if (response.data.emailSent === false) {
                toast.warning(response.data.message || 'The verification email could not be sent. Use Resend verification from the Admin Panel.')
            } else {
                toast.success(passwordMode === 'generate'
                    ? `Verification email sent to ${form.email}, including a temporary password.`
                    : `Verification email sent to ${form.email}`)
            }
            navigate('/admin')
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to add user'
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout>
            <div className="w-full max-w-2xl mx-auto">

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6 sm:mb-8">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add User</h1>
                        <p className="text-gray-500 mt-1">Create a new system user</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <Users size={20} className="text-blue-600" />
                            User Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className={labelClass}>Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="e.g. juan@gmail.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    required
                                />
                            </div>

                            {/* Row 1: Full Name | Password.
                                In "Generate" mode this row is as tall as a normal field. In "Type manually"
                                mode the password box appears under the dropdown and the rows below move
                                down to make room for it. */}
                            <div className="grid items-start gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className={labelClass}>Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Juan Dela Cruz"
                                        value={form.name}
                                        onChange={handleChange}
                                        className={fieldClass}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password-mode" className={labelClass}>Password</Label>
                                    <select
                                        id="password-mode"
                                        value={passwordMode}
                                        onChange={(e) => setPasswordMode(e.target.value)}
                                        className={nativeSelectClass}
                                    >
                                        <option value="generate">Generate random password</option>
                                        <option value="manual">Type manually</option>
                                    </select>
                                    {passwordMode === 'manual' && (
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter password"
                                                value={form.password}
                                                maxLength="20"
                                                className={`${fieldClass} pr-10`}
                                                onChange={handleChange}
                                                required={passwordMode === 'manual'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Role */}
                            <div className="grid items-start gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="role" className={labelClass}>Role</Label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                        className={nativeSelectClass}
                                    >
                                        <option value="resident">Resident</option>
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid items-start gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="household_number" className={labelClass}>
                                        Household Number (for residents only)
                                    </Label>
                                    <Input
                                        id="household_number"
                                        name="household_number"
                                        type="number"
                                        placeholder="e.g. 101"
                                        value={form.household_number}
                                        onChange={handleChange}
                                        className={fieldClass}
                                        required={form.role === 'resident'}
                                        max="999"
                                        min="1"

                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zone" className={labelClass}>
                                        Zone (for residents only)
                                    </Label>
                                    <select
                                        id="zone"
                                        name="zone"
                                        value={form.zone}
                                        onChange={handleChange}
                                        required={form.role === 'resident'}
                                        className={nativeSelectClass}
                                    >
                                        <option value="">Select zone...</option>
                                        {PUROKS.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className={labelClass}>
                                    Address (for residents only)
                                </Label>
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="Don jose st."
                                    value={form.address}
                                    onChange={handleChange}
                                    className={fieldClass}
                                    required={form.role === 'resident'}
                                />
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white"
                                    disabled={loading || !isFormReady}
                                >
                                    {loading ? 'Saving...' : 'Save User'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto border-gray-300 bg-gray-200 hover:bg-gray-300"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

            </div>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Create account?"
                description={passwordMode === 'generate'
                    ? 'This will create the account and send a verification email with a temporary password.'
                    : 'This will create the account and send a verification email.'}
                actionText="Create account"
                actionVariant="default"
                isLoading={loading}
                onConfirm={saveUser}
            />
        </Layout>
    )
}

export default AddUser