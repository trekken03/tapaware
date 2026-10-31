import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ArrowLeft, FileText, Home, Calendar as CalendarIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'
import { ESTIMATED_PROCESSING_TEXT } from '@/constants/reports'

const MAX_BACKDATE_DAYS = 30

// Dates and times are built from local fields, never toISOString() (UTC),
// so a Philippine morning doesn't turn into yesterday.
const toLocalDateString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const toLocalTimeString = (date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

const parseLocalDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
}

const formatTime12 = (time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    })
}

const SubmitReport = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [dateOpen, setDateOpen] = useState(false)
    const [openReportId, setOpenReportId] = useState(null)

    const [householdInfo, setHouseholdInfo] = useState(null)
    const [form, setForm] = useState(() => {
        const now = new Date()
        return {
            household_id: user?.household_id || '',
            user_id: user?.id,
            issue_type: '',
            other_issue: '',
            description: '',
            occurred_date: toLocalDateString(now),
            occurred_time: toLocalTimeString(now)
        }
    })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const earliestDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - MAX_BACKDATE_DAYS)
    const selectedDate = parseLocalDate(form.occurred_date)

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

    const handleDateSelect = (date) => {
        if (!date) return
        const picked = toLocalDateString(date)
        setForm(prev => {
            if (picked === prev.occurred_date) return prev
            // A past day needs its own time; switching back to today refills the current time.
            const isToday = picked === toLocalDateString(new Date())
            return { ...prev, occurred_date: picked, occurred_time: isToday ? toLocalTimeString(new Date()) : '' }
        })
        setDateOpen(false)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!form.household_id) {
            toast.error('Your account is not linked to a household. Please linked a household in your profile')
            return
        }

        const submitNow = new Date()
        if (form.occurred_date === toLocalDateString(submitNow) && form.occurred_time > toLocalTimeString(submitNow)) {
            toast.error('The time cannot be in the future.')
            return
        }

        setConfirmOpen(true)
    }

    const submitReport = async () => {
        setLoading(true)
        setOpenReportId(null)

        try {
            await API.post('/reports', form)
            toast.success("Report submitted successfully")
            setTimeout(() => navigate('/dashboard'), 2000)
        } catch (error) {
            if (error.response?.data?.code === 'OPEN_REPORT_EXISTS') {
                setOpenReportId(error.response.data.existingReportId)
                setLoading(false)
                return
            }
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
                                                Zone {householdInfo.zone} — {householdInfo.address}
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
                                        <option value="other">Other</option>
                                    </select>
                                    {form.issue_type === 'other' && (
                                        <div className="space-y-2 mt-3">
                                            <Label htmlFor="other_issue">
                                                Please specify
                                            </Label>

                                            <Input
                                                id="other_issue"
                                                name="other_issue"
                                                type="text"
                                                value={form.other_issue}
                                                onChange={handleChange}
                                                placeholder="What is the issue?"
                                                required
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>


                                <div className="space-y-2">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="occurred_date">Date it happened</Label>
                                            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="occurred_date"
                                                        type="button"
                                                        variant="outline"
                                                        className="h-11 w-full justify-start text-left text-base font-normal text-gray-900 bg-white hover:bg-gray-100 hover:cursor-pointer"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                                        {format(selectedDate, 'MMM d, yyyy')}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        required
                                                        selected={selectedDate}
                                                        onSelect={handleDateSelect}
                                                        disabled={{ before: earliestDate, after: today }}
                                                        startMonth={earliestDate}
                                                        endMonth={today}
                                                        defaultMonth={selectedDate}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="occurred_time">Time it happened</Label>
                                            <Input
                                                id="occurred_time"
                                                name="occurred_time"
                                                type="time"
                                                value={form.occurred_time}
                                                onChange={handleChange}
                                                required
                                                className="h-11 w-full text-base md:text-base"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400">Pick the date and time the problem happened.</p>
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
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500">{ESTIMATED_PROCESSING_TEXT}</p>
                                {openReportId && (
                                    <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                        You already have an open report for this issue. You can submit again once it is resolved.{' '}
                                        <Link to={`/reports/${openReportId}`} className="font-semibold underline">
                                            View that report
                                        </Link>
                                    </div>
                                )}
                            </form>
                        </>

                    </CardContent>
                </Card>

            </div>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Submit report?"
                description={`This will submit your water quality concern to the barangay. It happened on ${format(selectedDate, 'MMM d, yyyy')}${form.occurred_time ? ` at ${formatTime12(form.occurred_time)}` : ''}.`}
                actionText="Submit report"
                actionVariant="default"
                isLoading={loading}
                onConfirm={submitReport}
            />
        </Layout>
    )
}

export default SubmitReport