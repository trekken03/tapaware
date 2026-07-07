import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'
import { ArrowLeft, Home } from 'lucide-react'
import API from '@/services/api'

const AddHousehold = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        household_number: '',
        purok: '',
        owner_name: '',
        address: ''
    })

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await API.post('/households', form)
            navigate('/households')
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to add household')
        } finally {
            setLoading(false)
        }
        const purokValue = Number(form.purok);
        if (purokValue < 1 || purokValue > 6) {
            setError('Invalid purok number');
            return
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
                        onClick={() => navigate('/households')}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add Household</h1>
                        <p className="text-gray-500 mt-1">Register a new household record</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Home size={20} className="text-blue-600" />
                            Household Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="household_number">Household Number</Label>
                                    <Input
                                        id="household_number"
                                        name="household_number"
                                        type="number"
                                        placeholder="e.g. 21"
                                        value={form.household_number}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="purok">Purok</Label>
                                    <Input
                                        id="purok"
                                        type="number"
                                        name="purok"
                                        placeholder="e.g. 3"
                                        min={1}
                                        max={6}
                                        value={form.purok}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="owner_name">Owner Name</Label>
                                <Input
                                    id="owner_name"
                                    name="owner_name"
                                    placeholder="e.g. Juan Dela Cruz"
                                    value={form.owner_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="e.g. Don Jose St"
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 pt-4">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : 'Save Household'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                    onClick={() => navigate('/households')}
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

export default AddHousehold