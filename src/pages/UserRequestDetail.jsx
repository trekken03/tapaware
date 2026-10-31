import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Inbox, Info, ArrowRight } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'
import { PUROKS } from '@/constants/puroks'
import { adminRequestTypeLabel } from '@/constants/adminRequests'

// Types the admin can apply from this page, through the same endpoint Edit User uses.
const APPLICABLE_TYPES = ['change_email', 'change_household', 'correct_name']

// Same rules as the Edit User form (src/pages/EditUser.jsx).
const NAME_PATTERN = /^[a-zA-Z\s]*$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const HOUSEHOLD_PATTERN = /^\d{1,3}$/

const statusClass = (status) => ({
    pending: 'bg-amber-100 text-amber-800',
    done: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
}[status] || 'bg-gray-100 text-gray-700')

const formatDateTime = (date) => new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
})

const DetailRow = ({ label, children }) => (
    <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-gray-900 break-words">{children}</dd>
    </div>
)

const householdText = (number, zone) => (number ? `#${number}, Purok ${zone}` : 'No household linked')

// Best guess at "household number, purok" from the free-text requested value; the admin can edit both.
const parseHousehold = (text) => {
    const value = String(text || '')
    const zoneMatch = /(?:zone|purok)\s*#?\s*(\d+)/i.exec(value)
    const withoutZone = zoneMatch ? value.replace(zoneMatch[0], ' ') : value
    const numberMatch = /\d{1,3}/.exec(withoutZone)
    const zone = zoneMatch && PUROKS.map(String).includes(String(parseInt(zoneMatch[1], 10)))
        ? String(parseInt(zoneMatch[1], 10))
        : ''
    return { household_number: numberMatch ? numberMatch[0] : '', zone }
}

const UserRequestDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loadError, setLoadError] = useState('')
    const [loading, setLoading] = useState(true)
    const [working, setWorking] = useState(false)

    // 'apply' | 'done' | 'reject'
    const [dialogMode, setDialogMode] = useState(null)
    const [note, setNote] = useState('')
    const [newValue, setNewValue] = useState('')
    const [newHousehold, setNewHousehold] = useState({ household_number: '', zone: '' })
    const [transferChoice, setTransferChoice] = useState('moved')
    const [applyError, setApplyError] = useState('')

    useEffect(() => {
        fetchRequest()
    }, [id])

    const fetchRequest = async () => {
        try {
            const res = await API.get(`/admin-requests/${id}`)
            setData(res.data)
            setLoadError('')
        } catch (error) {
            console.log('Error fetching user request:', error)
            setData(null)
            setLoadError(error.response?.data?.message || 'Request not found.')
        } finally {
            setLoading(false)
        }
    }

    const backButton = (
        <Button
            size="sm"
            className="flex items-center gap-1 border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100 hover:cursor-pointer"
            onClick={() => navigate('/admin?tab=user-requests')}
        >
            <ArrowLeft size={14} />
            Back to User Requests
        </Button>
    )

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading request...</p>
                </div>
            </Layout>
        )
    }

    if (!data) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">{loadError}</p>
                    <div className="mt-4 flex justify-center">{backButton}</div>
                </div>
            </Layout>
        )
    }

    const { request, user } = data
    const isPending = request.status === 'pending'
    const canApply = APPLICABLE_TYPES.includes(request.request_type)

    const currentValue = {
        change_email: user.email,
        change_household: householdText(user.household_number, user.zone),
        correct_name: user.name,
    }[request.request_type]

    // ----- Apply: validation and the Edit User payload -----
    const trimmedValue = newValue.trim()
    const householdChanged = Boolean(user.household_number) && (
        newHousehold.household_number !== String(user.household_number) ||
        newHousehold.zone !== String(user.zone)
    )

    let applyProblem = ''
    if (request.request_type === 'change_email') {
        if (!EMAIL_PATTERN.test(trimmedValue)) applyProblem = 'Enter a valid email address.'
        else if (trimmedValue.toLowerCase() === String(user.email).toLowerCase()) applyProblem = 'This is already the current email.'
    } else if (request.request_type === 'correct_name') {
        if (trimmedValue === '' || !NAME_PATTERN.test(trimmedValue)) applyProblem = 'Use letters and spaces only.'
        else if (trimmedValue === user.name) applyProblem = 'This is already the current name.'
    } else if (request.request_type === 'change_household') {
        if (!HOUSEHOLD_PATTERN.test(newHousehold.household_number)) applyProblem = 'Enter a household number of 1 to 3 digits.'
        else if (!PUROKS.map(String).includes(newHousehold.zone)) applyProblem = 'Select a purok.'
        else if (user.household_number && !householdChanged) applyProblem = 'This is already the current household.'
    }

    // Same shape Edit User sends: every field, current values for the ones not changing.
    const buildPayload = () => {
        const payload = {
            name: user.name,
            email: user.email,
            household_number: user.household_number || '',
            zone: user.zone || '',
            address: user.address || '',
        }
        if (request.request_type === 'change_email') payload.email = trimmedValue
        if (request.request_type === 'correct_name') payload.name = trimmedValue
        if (request.request_type === 'change_household') {
            payload.household_number = newHousehold.household_number
            payload.zone = newHousehold.zone
            if (householdChanged) {
                payload.transfer_data = transferChoice === 'correction'
            }
        }
        return payload
    }

    const applySummary = (() => {
        if (request.request_type === 'change_email') {
            return `Email will change from ${user.email} to ${trimmedValue || '…'}. The account becomes unverified and a verification email is sent.`
        }
        if (request.request_type === 'correct_name') {
            return `Name will change from ${user.name} to ${trimmedValue || '…'}.${user.role === 'resident' && user.household_number ? ' The household owner name is updated to match.' : ''}`
        }
        if (request.request_type === 'change_household') {
            const to = newHousehold.household_number && newHousehold.zone
                ? householdText(newHousehold.household_number, newHousehold.zone)
                : '…'
            const how = !householdChanged
                ? ''
                : transferChoice === 'correction'
                    ? ' This is a data entry correction: the existing household history is kept.'
                    : ' The resident moved: the previous household and its history stay separate.'
            return `Household will change from ${householdText(user.household_number, user.zone)} to ${to}.${how}`
        }
        return ''
    })()

    const openDialog = (mode) => {
        setDialogMode(mode)
        setNote('')
        setApplyError('')
        if (mode === 'apply') {
            setNewValue(request.request_type === 'change_household' ? '' : (request.requested_value || ''))
            setNewHousehold(parseHousehold(request.requested_value))
            setTransferChoice('moved')
        }
    }

    const markRequest = (status, applied) => API.patch(`/admin-requests/${request.id}`, {
        status,
        admin_note: note,
        ...(applied ? { applied: true } : {}),
    })

    const handleApply = async () => {
        if (applyProblem) return
        setWorking(true)
        setApplyError('')

        let updateResponse
        try {
            updateResponse = await API.put(`/admin/users/${user.id}`, buildPayload())
        } catch (error) {
            // The account was not changed, so the request stays pending.
            const message = error.response?.data?.message || 'Failed to update user'
            setApplyError(message)
            toast.error(message)
            setWorking(false)
            return
        }

        if (updateResponse.data.emailSent === false) {
            toast.warning(updateResponse.data.emailMessage || updateResponse.data.message || 'The verification email could not be sent. Use Resend verification from the Admin Panel.')
        }

        try {
            await markRequest('done', true)
            toast.success('Change applied and request marked as done.')
            setDialogMode(null)
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to update the request'
            setApplyError(`The account was updated, but the request could not be marked done: ${message} Use "Mark Done (no change)" to close it.`)
            toast.error(message)
        } finally {
            setWorking(false)
            fetchRequest()
        }
    }

    const handleDecision = async () => {
        const status = dialogMode === 'reject' ? 'rejected' : 'done'
        if (status === 'rejected' && note.trim() === '') return
        setWorking(true)
        try {
            const res = await markRequest(status, false)
            toast.success(res.data.message)
            setDialogMode(null)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update the request')
        } finally {
            setWorking(false)
            fetchRequest()
        }
    }

    const confirmDisabled = working || (
        dialogMode === 'apply' ? Boolean(applyProblem)
            : dialogMode === 'reject' ? note.trim() === ''
                : false
    )

    return (
        <Layout>
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-4">{backButton}</div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Requester */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <CardTitle className="flex min-w-0 items-center gap-2 text-lg font-bold text-gray-900">
                                    <Inbox size={20} className="shrink-0 text-blue-600" />
                                    <span className="break-words">{user.name}</span>
                                </CardTitle>
                                <span className={`inline-block shrink-0 px-3 py-1 text-sm font-semibold capitalize ${statusClass(request.status)}`}>
                                    {request.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <DetailRow label="Email">
                                    <span className="break-all">{user.email}</span>{' '}
                                    <span className={`ml-1 inline-block px-2 py-0.5 text-xs font-semibold ${user.email_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                                        {user.email_verified ? 'Verified' : 'Unverified'}
                                    </span>
                                </DetailRow>
                                <DetailRow label="Role"><span className="capitalize">{user.role}</span></DetailRow>
                                <DetailRow label="Household number">{user.household_number ? `#${user.household_number}` : '—'}</DetailRow>
                                <DetailRow label="Purok">{user.zone || '—'}</DetailRow>
                                <DetailRow label="Submitted">{formatDateTime(request.created_at)}</DetailRow>
                            </dl>
                            {user.archived && (
                                <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                    This account is archived. Restore it from the Archive before applying any change.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Request */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                {adminRequestTypeLabel(request.request_type)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {canApply ? (
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                    <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <p className="text-xs font-semibold uppercase text-gray-500">Current</p>
                                        <p className="mt-0.5 text-sm text-gray-900 break-words">{currentValue}</p>
                                    </div>
                                    <ArrowRight size={18} className="hidden shrink-0 self-center text-gray-400 sm:block" aria-hidden="true" />
                                    <div className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-blue-50 p-3">
                                        <p className="text-xs font-semibold uppercase text-blue-700">Requested</p>
                                        <p className="mt-0.5 text-sm text-gray-900 break-words">{request.requested_value || '—'}</p>
                                    </div>
                                </div>
                            ) : request.requested_value ? (
                                <DetailRow label="Requested">{request.requested_value}</DetailRow>
                            ) : null}
                            <dl>
                                <DetailRow label="Reason">{request.reason}</DetailRow>
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {/* Decision */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {isPending ? 'Review' : 'Decision'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isPending ? (
                            <div className="space-y-4">
                                {canApply && (
                                    <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                                        <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                                        <p className="min-w-0">
                                            "Apply change" updates the account exactly like Edit User does, then marks this request done. If the update fails, the request stays pending.
                                        </p>
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                    {canApply && (
                                        <Button
                                            className="h-11 w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white hover:cursor-pointer"
                                            disabled={working || user.archived}
                                            onClick={() => openDialog('apply')}
                                        >
                                            Apply change and mark Done
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="h-11 w-full sm:w-auto text-green-700 border-green-300 hover:bg-green-50 hover:cursor-pointer"
                                        disabled={working}
                                        onClick={() => openDialog('done')}
                                    >
                                        Mark Done (no change)
                                    </Button>
                                    <Button
                                        className="h-11 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white hover:cursor-pointer"
                                        disabled={working}
                                        onClick={() => openDialog('reject')}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm text-gray-800">
                                <p>
                                    <span className="capitalize font-semibold">{request.status}</span>
                                    {request.reviewed_by_name ? ` by ${request.reviewed_by_name}` : ''}
                                    {request.reviewed_at ? ` on ${formatDateTime(request.reviewed_at)}` : ''}.
                                </p>
                                {request.admin_note && (
                                    <p className="break-words text-gray-600">Note: {request.admin_note}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && !working && setDialogMode(null)}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="font-semibold">
                            {dialogMode === 'apply' ? 'Apply change and mark Done?'
                                : dialogMode === 'reject' ? 'Reject request?'
                                    : 'Mark request as done?'}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogMode === 'apply' ? applySummary
                                : dialogMode === 'reject' ? 'The account will not be changed.'
                                    : 'The account will not be changed. Use this for requests handled outside the system.'}
                        </DialogDescription>
                    </DialogHeader>

                    {dialogMode === 'apply' && (
                        <div className="space-y-4">
                            {request.request_type === 'change_household' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="apply_household_number">Household No.</Label>
                                            <Input
                                                id="apply_household_number"
                                                inputMode="numeric"
                                                maxLength={3}
                                                value={newHousehold.household_number}
                                                onChange={(e) => /^\d{0,3}$/.test(e.target.value) && setNewHousehold({ ...newHousehold, household_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="apply_zone">Purok</Label>
                                            <select
                                                id="apply_zone"
                                                value={newHousehold.zone}
                                                onChange={(e) => setNewHousehold({ ...newHousehold, zone: e.target.value })}
                                                className="h-9 w-full border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select purok...</option>
                                                {PUROKS.map(p => (
                                                    <option key={p} value={p}>{p}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {householdChanged && (
                                        <div className="rounded-lg border border-blue-400 bg-blue-200 p-4 space-y-3">
                                            <p className="text-sm font-semibold text-gray-700">What does this change represent?</p>
                                            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="applyTransferChoice"
                                                    value="moved"
                                                    checked={transferChoice === 'moved'}
                                                    onChange={(e) => setTransferChoice(e.target.value)}
                                                    className="mt-1"
                                                />
                                                <span>
                                                    <strong>The resident moved to a new address.</strong>
                                                    <span className="block text-xs text-gray-600">
                                                        Keep the previous household and its history separate from the new household.
                                                    </span>
                                                </span>
                                            </label>
                                            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="applyTransferChoice"
                                                    value="correction"
                                                    checked={transferChoice === 'correction'}
                                                    onChange={(e) => setTransferChoice(e.target.value)}
                                                    className="mt-1"
                                                />
                                                <span>
                                                    <strong>This is a data entry correction.</strong>
                                                    <span className="block text-xs text-gray-600">
                                                        Correct the household number or zone and retain the existing household history.
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="apply_value">
                                        {request.request_type === 'change_email' ? 'New email' : 'New name'}
                                    </Label>
                                    <Input
                                        id="apply_value"
                                        type={request.request_type === 'change_email' ? 'email' : 'text'}
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                    />
                                </div>
                            )}
                            {applyProblem && <p className="text-xs text-red-600">{applyProblem}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="decision_note">
                            {dialogMode === 'reject' ? 'Note (required)' : 'Note (optional)'}
                        </Label>
                        <Textarea
                            id="decision_note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    {applyError && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{applyError}</p>
                    )}

                    <DialogFooter className="bg-white">
                        <Button type="button" variant="outline" disabled={working} onClick={() => setDialogMode(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant={dialogMode === 'reject' ? 'destructive' : 'default'}
                            disabled={confirmDisabled}
                            onClick={dialogMode === 'apply' ? handleApply : handleDecision}
                        >
                            {working ? 'Saving...'
                                : dialogMode === 'apply' ? 'Apply and mark Done'
                                    : dialogMode === 'reject' ? 'Reject'
                                        : 'Mark as done'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    )
}

export default UserRequestDetail
