import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ArchiveRestore, Archive as ArchiveIcon, Trash2 } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'

const TABS = [
    {
        value: 'households',
        label: 'Households',
        endpoint: '/households/archived',
        restore: (id) => `/households/${id}/restore`,
        remove: (id) => `/households/${id}/permanent`,
        deleteWarning: 'This household and every report and TDS reading attached to it will be erased from the database. Residents linked to it keep their accounts but lose the household link. This cannot be undone.',
    },
    {
        value: 'reports',
        label: 'Reports',
        endpoint: '/reports/archived',
        restore: (id) => `/reports/${id}/restore`,
        remove: (id) => `/reports/${id}/permanent`,
        deleteWarning: 'This report will be erased from the database. This cannot be undone.',
    },
    {
        value: 'tds',
        label: 'TDS Readings',
        endpoint: '/tds/archived',
        restore: (id) => `/tds/${id}/restore`,
        remove: (id) => `/tds/${id}/permanent`,
        deleteWarning: 'This reading will be erased from the database and will no longer count towards any TDS average. This cannot be undone.',
    },
    {
        value: 'users',
        label: 'Users',
        endpoint: '/admin/users/archived',
        restore: (id) => `/admin/users/${id}/restore`,
        remove: (id) => `/admin/users/${id}/permanent`,
        deleteWarning: 'This account will be erased from the database. Accounts that still have reports or TDS readings on record cannot be deleted and stay archived. This cannot be undone.',
    },
]

const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date.replace(' ', 'T')).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

const Archive = () => {

    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = TABS.some(t => t.value === searchParams.get('tab')) ? searchParams.get('tab') : 'households'
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [restoringId, setRestoringId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    const tab = TABS.find(t => t.value === activeTab)

    const fetchRows = useCallback(async () => {
        setLoading(true)
        try {
            const res = await API.get(tab.endpoint)
            setRows(res.data)
        } catch (error) {
            console.log('Error fetching archived records:', error)
            toast.error(`Failed to load archived ${tab.label.toLowerCase()}`)
        } finally {
            setLoading(false)
        }
    }, [tab])

    useEffect(() => {
        fetchRows()
    }, [fetchRows])

    const handleRestore = async (id) => {
        setRestoringId(id)
        try {
            await API.put(tab.restore(id))
            toast.success('Restored successfully')
            setRows(prev => prev.filter(r => r.id !== id))
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to restore')
        } finally {
            setRestoringId(null)
        }
    }

    const handlePermanentDelete = async (id) => {
        setDeletingId(id)
        try {
            await API.delete(tab.remove(id))
            toast.success('Permanently deleted')
            setRows(prev => prev.filter(r => r.id !== id))
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Layout>
            <div>
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <ArchiveIcon size={26} className="text-blue-600" />
                        Archive
                    </h1>
                    <p className="text-gray-500 mt-1">Archived records can be restored at any time, or deleted permanently.</p>
                </div>

                <Card className="bg-white/80">
                    <CardHeader>
                        <div className="flex flex-col gap-4">
                            <CardTitle>Archived Records</CardTitle>
                            <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })}>
                                <TabsList variant="line">
                                    {TABS.map(t => (
                                        <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading...</div>
                        ) : rows.length === 0 ? (
                            <div className="text-center py-12">
                                <ArchiveIcon size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No archived {tab.label.toLowerCase()}.</p>
                            </div>
                        ) : (
                            <Table className="md:min-w-[900px]">
                                <TableHeader className="bg-blue-800">
                                    <TableRow>
                                        {activeTab === 'households' && (
                                            <>
                                                <TableHead>Household</TableHead>
                                                <TableHead>Owner</TableHead>
                                                <TableHead>Purok</TableHead>
                                                <TableHead>Address</TableHead>
                                            </>
                                        )}
                                        {activeTab === 'reports' && (
                                            <>
                                                <TableHead>Household</TableHead>
                                                <TableHead>Purok</TableHead>
                                                <TableHead>Issue Type</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Reported By</TableHead>
                                            </>
                                        )}
                                        {activeTab === 'tds' && (
                                            <>
                                                <TableHead>Household</TableHead>
                                                <TableHead>Purok</TableHead>
                                                <TableHead>TDS Value</TableHead>
                                                <TableHead>Recorded By</TableHead>
                                            </>
                                        )}
                                        {activeTab === 'users' && (
                                            <>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Role</TableHead>
                                            </>
                                        )}
                                        <TableHead>Archived At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow
                                            key={row.id}

                                        >
                                            {activeTab === 'households' && (
                                                <>
                                                    <TableCell label="Household">#{row.household_number}</TableCell>
                                                    <TableCell label="Owner" className="font-semibold">{row.owner_name}</TableCell>
                                                    <TableCell label="Purok">Purok {row.purok}</TableCell>
                                                    <TableCell label="Address" className="max-w-[200px] truncate">{row.address}</TableCell>
                                                </>
                                            )}
                                            {activeTab === 'reports' && (
                                                <>
                                                    <TableCell label="Household">#{row.household_number} — {row.owner_name}</TableCell>
                                                    <TableCell label="Purok">Purok {row.purok}</TableCell>
                                                    <TableCell label="Issue Type" className="capitalize">{row.issue_type}</TableCell>
                                                    <TableCell label="Status" className="capitalize">{row.status}</TableCell>
                                                    <TableCell label="Reported By">{row.reported_by}</TableCell>
                                                </>
                                            )}
                                            {activeTab === 'tds' && (
                                                <>
                                                    <TableCell label="Household">#{row.household_number} — {row.owner_name}</TableCell>
                                                    <TableCell label="Purok">Purok {row.purok}</TableCell>
                                                    <TableCell label="TDS Value">{row.tds_value} ppm</TableCell>
                                                    <TableCell label="Recorded By">{row.staff_name}</TableCell>
                                                </>
                                            )}
                                            {activeTab === 'users' && (
                                                <>
                                                    <TableCell label="Name" className="font-semibold">{row.name}</TableCell>
                                                    <TableCell label="Email">{row.email}</TableCell>
                                                    <TableCell label="Role" className="capitalize">{row.role}</TableCell>
                                                </>
                                            )}
                                            <TableCell label="Archived At">{formatDate(row.deleted_at)}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <ConfirmDialog
                                                        title="Restore this record?"
                                                        description="It will reappear in the active views."
                                                        actionText="Restore"
                                                        actionVariant="default"
                                                        onConfirm={() => handleRestore(row.id)}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={restoringId === row.id || deletingId === row.id}
                                                            className="flex items-center gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                        >
                                                            <ArchiveRestore size={14} />
                                                            Restore
                                                        </Button>
                                                    </ConfirmDialog>

                                                    <ConfirmDialog
                                                        title="Delete this record permanently?"
                                                        description={tab.deleteWarning}
                                                        actionText="Delete Permanently"
                                                        actionVariant="destructive"
                                                        onConfirm={() => handlePermanentDelete(row.id)}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={restoringId === row.id || deletingId === row.id}
                                                            className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                                                        >
                                                            <Trash2 size={14} />
                                                            Delete Permanently
                                                        </Button>
                                                    </ConfirmDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}

export default Archive
