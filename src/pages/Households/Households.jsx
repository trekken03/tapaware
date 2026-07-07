import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Home, Plus, Eye, Search } from 'lucide-react'
import API from '@/services/api'
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group"

const Households = () => {
    const [households, setHouseholds] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPurok, setSelectedPurok] = useState('all');
    const navigate = useNavigate()

    useEffect(() => {
        fetchHouseholds()
    }, [])

    const fetchHouseholds = async () => {
        try {
            const res = await API.get('/households')
            setHouseholds(res.data)
        } catch (error) {
            console.log('Error fetching households:', error)
        } finally {
            setLoading(false)
        }
    }

    const purokOptions = [...new Set(households.map(h => h.purok).filter(Boolean))]
        .sort((a, b) => a.toString().localeCompare(b.toString(), undefined, { numeric: true }))



    const filteredHouseholds = households.filter(h => {
        if (selectedPurok !== 'all' && h.purok?.toString() !== selectedPurok) {
            return false
        }
        const searchLower = searchTerm.toLowerCase()
        return (
            h.household_number?.toString().includes(searchLower) ||
            h.owner_name?.toLowerCase().includes(searchLower) ||
            h.purok?.toString().includes(searchLower) ||
            h.address?.toLowerCase().includes(searchLower)
        )
    })

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading households...</p>

                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div>

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Households</h1>
                        <p className="text-gray-500 mt-1">Manage barangay household records</p>

                    </div>
                    <Button
                        className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                        onClick={() => navigate('/households/add')}
                    >
                        <Plus size={16} />
                        Add Household
                    </Button>
                </div>



                {/* Table */}
                <Card className="bg-white/80">
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Home size={20} className="text-blue-600" />
                                All Households ({filteredHouseholds.length})
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                {/* Purok spinner */}
                                <select
                                    value={selectedPurok}
                                    onChange={(e) => setSelectedPurok(e.target.value)}
                                    className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Puroks</option>
                                    {purokOptions.map(purok => (
                                        <option key={purok} value={purok}>
                                            Purok {purok}
                                        </option>
                                    ))}
                                </select>

                                <InputGroup className="max-w-xs">
                                    <InputGroupInput
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <InputGroupAddon>
                                        <Search size={16} />
                                    </InputGroupAddon>
                                </InputGroup>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredHouseholds.length === 0 ? (
                            <div className="text-center py-12">
                                <Home size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">{searchTerm ? 'No households found.' : 'No households found.'}</p>

                            </div>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,290px))] gap-4  ">
                                {filteredHouseholds.map((h) => (
                                    <div
                                        key={h.id}
                                        onClick={() => navigate(`/households/${h.id}`)}
                                        className="flex gap-4 rounded-lg border-l-4 border-blue-400 p-4 shadow-lg h-full cursor-pointer hover:shadow-md hover:bg-gray-200 transition-all duration-200">
                                        <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 shrink-0" >
                                            <Home size={24} className="text-blue-700" />
                                        </div>

                                        <div className="flex-1 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-2xl">{h.owner_name}</span>
                                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                    #{h.household_number}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-1 text-sm text-gray-700">
                                                <p className="font-semibold text-gray-900">Purok: {h.purok}</p>
                                                <p className="font-semibold text-gray-900">Address: {h.address}</p>
                                                <p className="font-semibold text-gray-900">Date Added: {new Date(h.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </Layout>
    )
}

export default Households