import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Droplets, Plus, Search } from 'lucide-react';
import API from '@/services/api';
import { toast } from 'sonner';


const TdsReadings = () => {
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const statusFilter = searchParams.get('status');
    const [selectedPurok, setSelectedPurok] = useState('all');

    useEffect(() => {
        fetchReadings()
    }, [])
    const formatDate = (date) =>
        new Date(date.replace(' ', 'T')).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

    const fetchReadings = async () => {
        try {
            const res = await API.get('/tds')
            setReadings(res.data)
        } catch (error) {
            console.log('Error fetching readings:', error)
            toast.error('Failed to fetch TDS readings')
        } finally {
            setLoading(false)
        }
    }

    const getTdsStatus = (value) => {
        if (value <= 500) {
            return {
                label: 'Safe',
                color: 'text-green-700',
                bg: 'bg-green-100',
                border: 'border-green-400',
            };
        }

        if (value <= 1000) {
            return {
                label: 'Moderate',
                color: 'text-yellow-700',
                bg: 'bg-yellow-100',
                border: 'border-yellow-400',
            };
        }

        return {
            label: 'High',
            color: 'text-red-700',
            bg: 'bg-red-100',
            border: 'border-red-400',
        };
    };

    const purokOptions = [...new Set(readings.map(r => r.purok).filter(Boolean))]
        .sort((a, b) => a.toString().localeCompare(b.toString(), undefined, { numeric: true }))

    const filteredReadings = readings.filter(r => {
        if (selectedPurok !== 'all' && r.purok?.toString() !== selectedPurok) {
            return false
        }

        if (statusFilter) {
            const readingStatus = getTdsStatus(r.tds_value).label.toLowerCase()
            const statusMap = { safe: 'safe', mild: 'moderate', danger: 'high' }
            if (readingStatus !== statusMap[statusFilter]) {
                return false
            }
        }

        const searchLower = searchTerm.toLowerCase()
        return (
            r.household_number?.toString().includes(searchLower) ||
            r.owner_name?.toLowerCase().includes(searchLower) ||
            r.purok?.toString().includes(searchLower) ||
            r.notes?.toLowerCase().includes(searchLower)
        )
    })

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading TDS readings...</p>
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
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">TDS Readings</h1>
                        <p className="text-gray-500 mt-1">Total Dissolved Solids monitoring per household</p>
                    </div>
                    <Button
                        className="w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                        onClick={() => navigate('/tds/add')}
                    >
                        <Plus size={16} />
                        Add Reading
                    </Button>
                </div>


                {/* Table */}
                <Card className="bg-white/80">
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Droplets size={20} className="text-blue-600" />
                                All TDS Readings ({filteredReadings.length})
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
                        {filteredReadings.length === 0 ? (
                            <div className="text-center py-12">
                                <Droplets size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No TDS readings recorded yet.</p>

                            </div>
                        ) : (
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,290px))] gap-4">
                                {filteredReadings.map((r) => {
                                    const status = getTdsStatus(r.tds_value)
                                    return (
                                        <div
                                            key={r.id}
                                            onClick={() => navigate(`/tds/${r.id}`)}
                                            className={`flex gap-4 rounded-lg border-l-4 border ${status.border} p-4 shadow-lg h-full cursor-pointer hover:shadow-md hover:bg-gray-200 transition-all duration-200`}
                                        >
                                            <div className={`hidden sm:flex items-center justify-center w-14 h-14 rounded-full ${status.bg} shrink-0`}>
                                                <Droplets size={24} className={status.color} />
                                            </div>

                                            <div className="flex-1 flex flex-col h-full">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-2xl">{r.owner_name}</span>
                                                    <span className={`${status.bg} ${status.color} px-3 py-1 text-xs font-semibold`}>
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-1 text-sm text-gray-700">
                                                    <p className="font-semibold text-gray-900">Household: #{r.household_number} - Purok {r.purok}</p>
                                                    <p className="font-semibold text-gray-900">TDS: {r.tds_value} ppm</p>
                                                    <p className="font-semibold text-gray-900">Recorded By: {r.staff_name}</p>
                                                    <p className="font-semibold text-gray-900">Notes: {r.notes || '—'}</p>
                                                    <p className="font-semibold text-gray-900">Date: {formatDate(r.recorded_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </Layout>
    )
}

export default TdsReadings;