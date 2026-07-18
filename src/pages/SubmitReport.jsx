import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ArrowLeft, FileText, Home } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'

const SubmitReport = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)

    const [householdInfo, setHouseholdInfo] = useState(null)
    const [form, setForm] = useState({
        household_id: user?.household_id || '',
        user_id: user?.id || '',
        issue_type: '',
        description: '',
        occurred_time: ''
    })

    useEffect(() => {
        findUserHousehold()
    }, [user?.household_id])

    const findUserHousehold = async () => {
        if (!user?.household_id) return
        try {
            const res = await API.get('/households')
            const matched = res.data.find(
                h => h.id === user.household_id
            )
            if (matched) {
                setHouseholdInfo(matched)
                setForm(prev => ({ ...prev, household_id: matched.id }))
            }
        } catch (error) {
            console.log('Error finding household:', error)
        }
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()


        if (!form.household_id) {
            toast.error('Your account is not linked to a household. Please linked a household in your profile')
            return
        }

        setLoading(true)

        try {
            await API.post('/reports', form)
            toast.success("Report submitted successfully")
            setTimeout(() => navigate('/reports'), 2000)
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to submit report'

            toast.error(message)
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Submit Report</h1>
                        <p className="text-gray-500 mt-1">Report a water quality concern</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Report Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>

                        <>


                            {/* Household info display */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                                <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                                    Reporting for household
                                </p>
                                {householdInfo ? (
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                        <Home size={20} className="text-blue-600" />
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                #{householdInfo.household_number} — {householdInfo.owner_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Purok {householdInfo.purok} — {householdInfo.address}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-yellow-700">
                                        ⚠️ No household linked to your account.
                                        Please contact the admin.
                                    </p>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">

                                <div className="space-y-2">
                                    <Label htmlFor="issue_type">Issue Type</Label>
                                    <select
                                        id="issue_type"
                                        name="issue_type"
                                        value={form.issue_type}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select issue type...</option>
                                        <option value="odor">Odor</option>
                                        <option value="discoloration">Discoloration</option>
                                        <option value="low pressure">Low Pressure</option>
                                        <option value="cleanliness">Cleanliness</option>
                                        <option value="broken hardware">Broken Hardware</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="occurred_time">When did this happen?</Label>
                                    <Input
                                        id="occurred_time"
                                        name="occurred_time"
                                        type="time"
                                        value={form.occurred_time}
                                        onChange={handleChange}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-gray-400">Leave blank to use the current time</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        placeholder="Describe the issue in detail..."
                                        rows={4}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical font-sans"
                                    />
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white"
                                        disabled={loading || !householdInfo}
                                    >
                                        {loading ? 'Submitting...' : 'Submit Report'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                        onClick={() => navigate('/reports')}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </>

                    </CardContent>
                </Card>

            </div>
        </Layout>
    )
}

export default SubmitReport