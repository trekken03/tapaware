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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

const EditUser = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const location = useLocation()
    const existingUser = location.state
    const [showLeaveDialog, setShowLeaveDialog] = useState(false)
    const [leaveTo, setLeaveTo] = useState(null)



    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [transferChoice, setTransferChoice] = useState('moved')
    const [form, setForm] = useState({
        name: existingUser?.name || '',
        email: existingUser?.email || '',
        household_number: existingUser?.household_number || '',
        purok: existingUser?.purok || ''
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const householdChanged = existingUser?.household_number &&
        (form.household_number?.toString() !== existingUser.household_number?.toString() ||
            form.purok?.toString() !== existingUser.purok?.toString())

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const payload = { ...form }
            if (householdChanged) {
                payload.transfer_data = transferChoice === 'correction'
            }

            await API.put(`/admin/users/${id}`, payload)
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
                    <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </Layout>
        )
    }
    const handleLeave = (destination) => {
        if (hasChanges) {
            setLeaveTo(destination)
            setShowLeaveDialog(true)
        } else {
            navigate(destination)
        }
    }

    const hasChanges =
        form.name !== (existingUser?.name || '') ||
        form.email !== (existingUser?.email || '') ||
        form.household_number?.toString() !== (existingUser?.household_number?.toString() || '') ||
        form.purok?.toString() !== (existingUser?.purok?.toString() || '')

    return (
        <Layout>
            <div className="w-full max-w-2xl mx-auto">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6 sm:mb-8">
                    {(hasChanges && (<ConfirmDialog
                        open={showLeaveDialog}
                        onOpenChange={setShowLeaveDialog}
                        title="Discard changes?"
                        description="You have unsaved changes. If you leave now, your edits won't be saved."
                        actionText="Leave"
                        actionVariant="destructive"
                        onConfirm={() => navigate(leaveTo)}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLeave(-1)}
                            className="flex items-center gap-2 rounded-lg"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                    </ConfirmDialog>) || (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                Back
                            </Button>
                        ))}

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

                                <div className="space-y-2">
                                    <Label htmlFor="household_number">Household No.</Label>
                                    <Input
                                        id="household_number"
                                        name="household_number"
                                        type="number"
                                        value={form.household_number}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purok">Purok</Label>
                                    <Input
                                        id="purok"
                                        name="purok"
                                        type="number"
                                        min="1"
                                        max="6"
                                        step="1"
                                        value={form.purok}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {householdChanged && (
                                <div className="rounded-lg border border-blue-400 bg-blue-200 p-4 space-y-3">
                                    <p className="text-sm font-semibold text-gray-700">
                                        What does this change represent?
                                    </p>
                                    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="transferChoice"
                                            value="moved"
                                            checked={transferChoice === 'moved'}
                                            onChange={(e) => setTransferChoice(e.target.value)}
                                            className="mt-1"
                                        />
                                        <span>
                                            <strong>The resident moved to a new address.</strong>
                                        </span>
                                    </label>
                                    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="transferChoice"
                                            value="correction"
                                            checked={transferChoice === 'correction'}
                                            onChange={(e) => setTransferChoice(e.target.value)}
                                            className="mt-1"
                                        />
                                        <span>
                                            <strong>This is a data entry correction.</strong>
                                        </span>
                                    </label>
                                </div>
                            )}

                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4">
                                <ConfirmDialog
                                    title="Save?"
                                    description="Confirm to save the edit."
                                    actionText="Save"
                                    actionVariant="success"
                                    onConfirm={handleSubmit}
                                >
                                    <Button

                                        className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white rounded-lg"
                                        disabled={loading || !hasChanges}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </ConfirmDialog>

                                {hasChanges && (
                                    <ConfirmDialog
                                        open={showLeaveDialog}
                                        onOpenChange={setShowLeaveDialog}
                                        title="Discard changes?"
                                        description="You have unsaved changes. If you leave now, your edits won't be saved."
                                        actionText="Leave"
                                        actionVariant="destructive"
                                        onConfirm={() => navigate(leaveTo)}
                                    >

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full sm:w-auto rounded-lg"
                                            onClick={() => handleLeave('/admin')}
                                        >
                                            Cancel
                                        </Button>
                                    </ConfirmDialog>

                                ) || (<Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => handleLeave('/admin')}
                                >
                                    Cancel
                                </Button>)}


                            </div>
                        </form>
                    </CardContent>
                </Card>

            </div>
        </Layout>
    )
}

export default EditUser