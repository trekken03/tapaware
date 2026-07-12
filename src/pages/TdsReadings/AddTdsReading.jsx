import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Droplets } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'

const AddTdsReading = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [households, setHouseholds] = useState([])
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const [form, setForm] = useState({
        household_id: '',
        staff_id: user.id,
        tds_value: '',
        notes: ''
    })

    useEffect(() => {
        fetchHouseholds()
    }, [])

    const fetchHouseholds = async () => {
        try {
            const res = await API.get('/households')
            setHouseholds(res.data)
        } catch (error) {
            console.log('Error fetching households:', error)
        }
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setLoading(true)

        try {
            await API.post('/tds', form)
            navigate('/tds')
            toast.success('Tds reading added successfully')
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to add reading'
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
                        onClick={() => navigate('/tds')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add TDS Reading</h1>
                        <p className="text-gray-500 mt-1">Record a new TDS measurement</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Droplets size={20} className="text-blue-600" />
                            TDS Reading Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="space-y-2">
                                <Label htmlFor="household_id">Household</Label>
                                <select
                                    id="household_id"
                                    name="household_id"
                                    value={form.household_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a household...</option>
                                    {households.map(h => (
                                        <option key={h.id} value={h.id}>
                                            Purok {h.purok} #{h.household_number}  — {h.owner_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tds_value">TDS Value (ppm)</Label>
                                <Input
                                    id="tds_value"
                                    name="tds_value"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g. 145.5"
                                    value={form.tds_value}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes (optional)</Label>
                                <Input
                                    id="notes"
                                    name="notes"
                                    placeholder="e.g. water looks clear"
                                    value={form.notes}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* TDS guide */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
                                <p className="font-semibold text-blue-900 mb-2">TDS Level Guide:</p>
                                <div className="space-y-1">
                                    <p className="text-green-700">● 0 - 500 ppm — Safe for drinking</p>
                                    <p className="text-yellow-700">● 501 - 1000 ppm — Moderate, monitor closely</p>
                                    <p className="text-red-700">● 1000+ ppm — High, needs attention</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Reading'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => navigate('/tds')}
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

export default AddTdsReading