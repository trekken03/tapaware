import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserPlus, CheckCircle2, XCircle, AlertTriangle, ListChecks, Lightbulb, Info, ExternalLink } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import API from '@/services/api'
import { toast } from 'sonner'

// Must match REJECT_SENTENCES in backend/controllers/accountRequest.controller.js.
const REJECT_OPTIONS = [
    {
        code: 'household_mismatch',
        label: 'Household not matched',
        sentence: "We couldn't match your household number and zone with the barangay's records. Please check them and send a new request.",
    },
    {
        code: 'visit_barangay',
        label: 'Verify in person at the barangay hall',
        sentence: "We couldn't verify your request online. Please visit the barangay hall.",
    },
    {
        code: 'not_approved',
        label: 'Not approved',
        sentence: 'We could not approve your request at this time.',
    },
]

const statusClass = (status) => ({
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
}[status] || 'bg-gray-100 text-gray-700')

const formatDateTime = (date) => new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
})

const CHECK_STYLES = {
    ok: { Icon: CheckCircle2, className: 'text-green-600' },
    bad: { Icon: XCircle, className: 'text-red-600' },
    warn: { Icon: AlertTriangle, className: 'text-amber-600' },
    info: { Icon: Info, className: 'text-amber-600' },
}

const CheckLine = ({ tone, children }) => {
    const { Icon, className } = CHECK_STYLES[tone]
    return (
        <li className="flex items-start gap-3">
            <Icon size={18} className={`mt-0.5 shrink-0 ${className}`} aria-hidden="true" />
            <div className="min-w-0 text-sm text-gray-800 break-words">{children}</div>
        </li>
    )
}

const DetailRow = ({ label, children }) => (
    <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-gray-900 break-words">{children}</dd>
    </div>
)

const buildChecks = (request, checks, householdCreated) => {
    const lines = []
    const { household } = checks
    const where = `Household #${request.household_number}, Zone ${request.zone}`

    if (household.state === 'vacant') {
        lines.push({
            tone: 'ok',
            text: <>{where} is on file and has no resident account. Owner on file: <strong>{household.owner_name}</strong>, {household.address}.</>,
        })
    } else if (household.state === 'occupied') {
        lines.push({
            tone: 'bad',
            text: <>{where} already has a resident account{household.resident_name ? <> (<strong>{household.resident_name}</strong>)</> : null}.</>,
        })
    } else if (household.state === 'archived') {
        lines.push({ tone: 'bad', text: <>{where} is archived. Restore it from the Archive first.</> })
    } else if (householdCreated) {
        lines.push({ tone: 'info', text: 'This household was not in the system. It was created when this request was approved.' })
    } else {
        lines.push({
            tone: 'warn',
            text: <>{where} isn't in the system yet. Approving will create it, with the owner name and address from this request.</>,
        })
    }

    if (checks.name_matches_owner === true) {
        lines.push({ tone: 'ok', text: 'The name matches the owner on file.' })
    } else if (checks.name_matches_owner === false) {
        lines.push({
            tone: 'warn',
            text: <>The name differs from the owner on file (<strong>{household.owner_name}</strong>). This is informational; approving sets the owner name to the requester's name.</>,
        })
    }

    if (checks.email.state === 'available') {
        lines.push({ tone: 'ok', text: 'The email is not registered yet.' })
    } else if (checks.email.state === 'taken') {
        lines.push({ tone: 'bad', text: 'The email is already registered.' })
    } else {
        lines.push({ tone: 'bad', text: 'The email belongs to an archived account. Restore it from the Archive instead.' })
    }

    const others = checks.other_pending_for_household
    lines.push(others > 0
        ? { tone: 'warn', text: `${others} other pending request${others === 1 ? '' : 's'} for this household.` }
        : { tone: 'ok', text: 'No other pending requests for this household.' })

    return lines
}

const AccountRequestDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reasonCode, setReasonCode] = useState('')
    const [note, setNote] = useState('')
    const [working, setWorking] = useState(false)

    useEffect(() => {
        fetchRequest()
    }, [id])

    const fetchRequest = async () => {
        try {
            const res = await API.get(`/account-requests/${id}`)
            setData(res.data)
        } catch (error) {
            console.log('Error fetching account request:', error)
            setData(null)
        } finally {
            setLoading(false)
        }
    }

    const showResult = (resData) => {
        if (resData.emailSent === false) {
            toast.warning(resData.message)
        } else {
            toast.success(resData.message)
        }
    }

    const handleApprove = async () => {
        setWorking(true)
        try {
            const res = await API.post(
                `/account-requests/${id}/approve`,
                data?.checks?.needs_household_creation ? { create_household: true } : undefined
            )
            showResult(res.data)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve the request')
        } finally {
            setWorking(false)
            fetchRequest()
        }
    }

    const handleReject = async () => {
        setWorking(true)
        try {
            const res = await API.post(`/account-requests/${id}/reject`, { reason_code: reasonCode, note })
            showResult(res.data)
            setReasonCode('')
            setNote('')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject the request')
        } finally {
            setWorking(false)
            fetchRequest()
        }
    }

    const backButton = (
        <Button

            size="sm"
            className="flex items-center gap-1 border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-100 hover:cursor-pointer"
            onClick={() => navigate(-1)}
        >
            <ArrowLeft size={14} />
            Back
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
                    <p className="text-gray-500">Request not found.</p>
                    <div className="mt-4 flex justify-center">{backButton}</div>
                </div>
            </Layout>
        )
    }

    const { request, checks, checks_source: checksSource, checks_as_of: checksAsOf, household_created: householdCreated } = data
    const isPending = request.status === 'pending'
    const isSnapshot = checksSource === 'snapshot'
    const needsHousehold = isPending && checks?.needs_household_creation === true
    const checkLines = checks ? buildChecks(request, checks, householdCreated === true) : []
    const rejectOption = REJECT_OPTIONS.find(o => o.code === request.reject_code)
    const selectedReject = REJECT_OPTIONS.find(o => o.code === reasonCode)

    return (
        <Layout>
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-4">{backButton}</div>

                <div className="grid gap-6 lg:grid-cols-2 ">
                    {/* Request */}
                    <Card >
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3 ">
                                <CardTitle className="flex min-w-0 items-center gap-2 text-lg font-bold text-gray-900">
                                    <UserPlus size={20} className="shrink-0 text-blue-600" />
                                    <span className="break-words">{request.full_name}</span>
                                </CardTitle>
                                <span className={`inline-block shrink-0 px-3 py-1 text-sm font-semibold capitalize ${statusClass(request.status)}`}>
                                    {request.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2">
                                <DetailRow label="Email"><span className="break-all">{request.email}</span></DetailRow>
                                <DetailRow label="Submitted">{formatDateTime(request.created_at)}</DetailRow>
                                <DetailRow label="Household number">#{request.household_number}</DetailRow>
                                <DetailRow label="Zone">Zone {request.zone}</DetailRow>
                                <div className="sm:col-span-2">
                                    <DetailRow label="Street address">{request.address}</DetailRow>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Checks: live while pending, saved with the decision afterwards */}
                    {checks ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <ListChecks size={18} className="text-blue-600" />
                                    Review Summary
                                </CardTitle>
                                {isSnapshot && (
                                    <div className="space-y-0.5 text-xs text-gray-500">
                                        {checksAsOf && <p>As of {formatDateTime(checksAsOf)}</p>}
                                        <p>Recorded when this request was reviewed. Current records may have changed since.</p>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    {checkLines.map((line, index) => (
                                        <CheckLine key={index} tone={line.tone}>{line.text}</CheckLine>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="pt-2">
                                <p className="text-sm text-gray-500">
                                    A review summary was not recorded for this request (it was reviewed before this record-keeping was added).
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Possible matches */}
                {checks && checks.possible_matches.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Lightbulb size={18} className="text-amber-500" />
                                Possible matches (hints only)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {checks.needs_household_creation && (
                                <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                                    <p className="min-w-0">Check these before approving. Approving will create a new household if none of them is the right one.</p>
                                </div>
                            )}
                            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                                {checks.possible_matches.map(match => (
                                    <li key={match.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 text-sm">
                                            <p className="font-semibold text-gray-900 break-words">
                                                #{match.household_number}, Zone {match.zone} · {match.owner_name}
                                            </p>
                                            <p className="text-gray-500 break-words">{match.address}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold capitalize ${match.state === 'vacant' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                                {match.state}
                                            </span>
                                            <Link
                                                to={`/households/${match.id}`}
                                                className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-blue-700 underline-offset-4 hover:underline hover:cursor-pointer"
                                            >
                                                View household
                                                <ExternalLink size={14} aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <p className="mt-3 text-xs text-gray-500">
                                These are hints only. Approval requires the exact household number and zone in the request.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Decision */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">
                            {isPending ? 'Review' : 'Decision'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isPending ? (
                            <div className="space-y-6">
                                <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                                    <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                                    {needsHousehold ? (
                                        <p className="min-w-0 break-words">
                                            Approving creates a new household (#{request.household_number}, Zone {request.zone}, owner <strong>{request.full_name}</strong>, address {request.address}), a resident account linked to it, and emails a temporary password and a verification link to <strong className="break-all">{request.email}</strong>.
                                        </p>
                                    ) : (
                                        <p className="min-w-0 break-words">
                                            Approving creates a resident account linked to this household, sets the household's owner name to <strong>{request.full_name}</strong>, and emails a temporary password and a verification link to <strong className="break-all">{request.email}</strong>.
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <ConfirmDialog
                                        title="Approve this request?"
                                        description={needsHousehold
                                            ? `This household is not in the system. Approving will create Household #${request.household_number}, Zone ${request.zone} and a resident account for ${request.full_name}, and email a temporary password and a verification link to ${request.email}.`
                                            : `This creates an unverified resident account for ${request.full_name}, links it to household #${request.household_number}, Zone ${request.zone}, and emails a temporary password and a verification link to ${request.email}.`}
                                        actionText={needsHousehold ? 'Approve' : 'Approve'}
                                        actionVariant="default"
                                        isLoading={working}
                                        onConfirm={handleApprove}
                                    >
                                        <Button
                                            className="h-11 w-full sm:w-auto bg-blue-900 hover:bg-blue-700 text-white hover:cursor-pointer"
                                            disabled={!checks.can_approve || working}
                                        >
                                            {needsHousehold ? 'Approve' : 'Approve'}
                                        </Button>
                                    </ConfirmDialog>
                                    {!checks.can_approve && (
                                        <ul className="space-y-1 text-sm text-red-700">
                                            {checks.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}
                                        </ul>
                                    )}
                                </div>

                                <fieldset className="space-y-3 border-t border-gray-100 pt-5">
                                    <legend className="text-sm font-semibold text-gray-900">Reject with reason</legend>
                                    {REJECT_OPTIONS.map(option => (
                                        <label
                                            key={option.code}
                                            className={`flex min-h-11 items-start gap-3 rounded-lg border p-3 hover:cursor-pointer ${reasonCode === option.code ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="reject-reason"
                                                value={option.code}
                                                checked={reasonCode === option.code}
                                                onChange={() => setReasonCode(option.code)}
                                                className="mt-1 h-4 w-4 shrink-0 accent-red-600 hover:cursor-pointer"
                                                required
                                            />
                                            <span className="min-w-0 text-sm">
                                                <span className="block font-medium text-gray-900">{option.label}</span>
                                                <span className="block text-gray-600">The requester will read: "{option.sentence}"</span>
                                            </span>
                                        </label>
                                    ))}

                                    <div className="space-y-2">
                                        <label htmlFor="internal-note" className="text-sm font-medium text-gray-900">
                                            Internal note (never emailed)
                                        </label>
                                        <textarea
                                            id="internal-note"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            maxLength={500}
                                            rows={3}
                                            placeholder="Optional"
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                                        />
                                    </div>

                                    <ConfirmDialog
                                        title="Reject this request?"
                                        description={`The request will be marked rejected and ${request.email} will get a short email: "${selectedReject?.sentence || ''}"`}
                                        actionText="Reject"
                                        actionVariant="destructive"
                                        isLoading={working}
                                        onConfirm={handleReject}
                                    >
                                        <Button
                                            className="h-11 w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white hover:cursor-pointer"
                                            disabled={!reasonCode || working}
                                        >
                                            Reject
                                        </Button>
                                    </ConfirmDialog>
                                </fieldset>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm text-gray-800">
                                <p>
                                    <span className="capitalize font-semibold">{request.status}</span> by {request.reviewed_by || 'Unknown'}
                                    {request.reviewed_at ? ` on ${formatDateTime(request.reviewed_at)}` : ''}.
                                </p>
                                {request.status === 'approved' && (
                                    request.created_user_id ? (
                                        <Link
                                            to={`/admin/users/${request.created_user_id}`}
                                            className="inline-flex min-h-11 items-center gap-1 font-medium text-blue-700 underline-offset-4 hover:underline hover:cursor-pointer"
                                        >
                                            View the created account
                                            <ExternalLink size={14} aria-hidden="true" />
                                        </Link>
                                    ) : (
                                        <p className="text-gray-500">The created account no longer exists.</p>
                                    )
                                )}
                                {request.status === 'rejected' && (
                                    <>
                                        <p>Reason: <strong>{rejectOption?.label || request.reject_code}</strong></p>
                                        {request.reject_reason && (
                                            <p className="break-words text-gray-600">Internal note: {request.reject_reason}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}

export default AccountRequestDetail
