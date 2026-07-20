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

const AddUser = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'resident',
        household_number: '',
        purok: '',
        adress: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "name") {
            if (!/^[a-zA-Z\s]*$/.test(value)) {
                return;
            }

        }
        setForm({ ...form, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setLoading(true)

        try {

            const submitData = {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                household_number: form.role === 'resident' && form.household_number ? parseInt(form.household_number, 10) : null,
                purok: form.role === 'resident' && form.purok ? parseInt(form.purok, 10) : null,
                address: form.role === 'resident' ? form.address : null
            }

            console.log('Submitting user data:', submitData)
            await API.post('/auth/register', submitData)
            toast.success('User added successfully')
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
                        <CardTitle className="flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            User Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="e.g. juan@gmail.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={form.password}
                                            minLength="6"
                                            maxLength="20"
                                            className="pr-10"
                                            onChange={handleChange}
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
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Juan Dela Cruz"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                    />

                                </div>



                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="resident">Resident</option>
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="household_number">
                                        Household Number (for residents only)
                                    </Label>
                                    <Input
                                        id="household_number"
                                        name="household_number"
                                        placeholder="e.g. 101"
                                        value={form.household_number}
                                        onChange={handleChange}
                                        required={form.role === 'resident'}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purok">
                                        Purok (for residents only)
                                    </Label>
                                    <select
                                        id="purok"
                                        name="purok"
                                        value={form.purok}
                                        onChange={handleChange}
                                        required={form.role === 'resident'}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select purok...</option>
                                        {[1, 2, 3, 4, 5, 6].map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="household_number">
                                        Address (for residents only)
                                    </Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        placeholder="Don jose st."
                                        value={form.address}
                                        onChange={handleChange}
                                        required={form.role === 'resident'}
                                    />
                                </div>

                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save User'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => navigate(-1)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

            </div>
        </Layout>
    )
}

export default AddUser
