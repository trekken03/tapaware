import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Users } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'

const EditUser = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const location = useLocation()
    const existingUser = location.state

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        name: existingUser?.name || '',
        email: existingUser?.email || '',
        household_id: existingUser?.household_id || ''
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await API.put(`/admin/users/${id}`, form)
            toast.success('User updated successfully')
            navigate('/admin')
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update user'
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    if (!existingUser) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">No user data found. Please go back and click Edit again.</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
                        Back to Admin Panel
                    </Button>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div className="w-full max-w-2xl mx-auto">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6 sm:mb-8">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit User</h1>
                        <p className="text-gray-500 mt-1">Update user information</p>
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
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => navigate('/admin')}
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

export default EditUser