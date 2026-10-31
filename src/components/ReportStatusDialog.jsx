import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'

// Local calendar day as "YYYY-MM-DD" (toISOString() would give the UTC day).
const todayText = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const STATUS_LABELS = { pending: 'New', investigating: 'Investigating', resolved: 'Resolved' }

// Changes a report's status through PUT /reports/:id/status, asking for what each
// step needs: a schedule for Investigating, resolution notes (and an optional
// location) for Resolved. Used by the report detail page, the Reports list and
// Reports Maintenance. Pass statusOptions to let the user pick the status in the dialog.
const ReportStatusDialog = ({ open, onOpenChange, report, targetStatus, onUpdated, statusOptions }) => {
    const [chosenStatus, setChosenStatus] = useState(targetStatus)
    const status = statusOptions ? chosenStatus : targetStatus
    const [scheduledDate, setScheduledDate] = useState('')
    const [scheduledFrom, setScheduledFrom] = useState('')
    const [scheduledTo, setScheduledTo] = useState('')
    const [notes, setNotes] = useState('')
    const [location, setLocation] = useState(null)
    const [locationState, setLocationState] = useState('idle')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open || !report) return
        setScheduledDate(report.scheduled_date_text || '')
        setScheduledFrom(report.scheduled_from ? String(report.scheduled_from).slice(0, 5) : '')
        setScheduledTo(report.scheduled_to ? String(report.scheduled_to).slice(0, 5) : '')
        setNotes('')
        setLocation(null)
        setLocationState('idle')
        setChosenStatus(targetStatus)
    }, [open, report?.id, targetStatus])

    // Location is a bonus: ask once, never wait for it and never require it.
    useEffect(() => {
        if (!open || status !== 'resolved' || locationState !== 'idle') return
        if (!navigator.geolocation) {
            setLocationState('unavailable')
            return
        }
        setLocationState('asking')
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
                setLocationState('saved')
            },
            () => setLocationState('unavailable'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        )
    }, [open, status, locationState])

    if (!report) return null

    let problem = ''
    if (status === 'investigating') {
        if (!scheduledDate) problem = 'Choose the scheduled day.'
        else if (scheduledDate < todayText()) problem = 'The scheduled day cannot be in the past.'
        else if (!scheduledFrom || !scheduledTo) problem = 'Enter the time window.'
        else if (scheduledTo <= scheduledFrom) problem = 'The end time must be after the start time.'
    } else if (status === 'resolved') {
        if (notes.trim().length < 10) problem = 'Describe how it was resolved (at least 10 characters).'
    }

    const handleSave = async () => {
        if (problem) return
        setSaving(true)
        const body = { status }
        if (status === 'investigating') {
            Object.assign(body, { scheduled_date: scheduledDate, scheduled_from: scheduledFrom, scheduled_to: scheduledTo })
        }
        if (status === 'resolved') {
            body.resolution_notes = notes.trim()
            if (location) {
                body.resolution_lat = location.lat
                body.resolution_lng = location.lng
            }
        }

        try {
            const res = await API.put(`/reports/${report.id}/status`, body)
            if (res.data.emailSent === false) {
                toast.warning(res.data.message)
            } else {
                toast.success(res.data.message?.trim() || 'Report status updated successfully')
            }
            onOpenChange(false)
            onUpdated?.()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update report status')
        } finally {
            setSaving(false)
        }
    }

    const isReschedule = status === 'investigating' && report.status === 'investigating'

    return (
        <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
            <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle className="font-semibold">
                        {statusOptions ? 'Edit report' : isReschedule ? 'Change the schedule?' : `Mark as ${STATUS_LABELS[status] || status}?`}
                    </DialogTitle>
                    <DialogDescription>
                        {status === 'investigating'
                            ? 'Set when the barangay will check this issue. The resident is emailed this schedule. Other open reports for the same household and issue get the same schedule.'
                            : status === 'resolved'
                                ? 'Other open reports for the same household and issue are resolved with the same notes.'
                                : 'This will change the report status to New.'}
                    </DialogDescription>
                </DialogHeader>

                {statusOptions && (
                    <div className="space-y-2">
                        <Label htmlFor="edit_status">Status</Label>
                        <select
                            id="edit_status"
                            value={status || ''}
                            onChange={(e) => setChosenStatus(e.target.value)}
                            className="h-11 w-full border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {statusOptions.map(option => (
                                <option key={option} value={option}>{STATUS_LABELS[option] || option}</option>
                            ))}
                        </select>
                    </div>
                )}

                {status === 'investigating' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="scheduled_date">Scheduled day</Label>
                            <Input
                                id="scheduled_date"
                                type="date"
                                min={todayText()}
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="h-11 text-base md:text-base"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scheduled_from">From</Label>
                                <Input
                                    id="scheduled_from"
                                    type="time"
                                    value={scheduledFrom}
                                    onChange={(e) => setScheduledFrom(e.target.value)}
                                    className="h-11 text-base md:text-base"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scheduled_to">To</Label>
                                <Input
                                    id="scheduled_to"
                                    type="time"
                                    value={scheduledTo}
                                    onChange={(e) => setScheduledTo(e.target.value)}
                                    className="h-11 text-base md:text-base"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {status === 'resolved' && (
                    <div className="space-y-2">
                        <Label htmlFor="resolution_notes">Resolution notes</Label>
                        <Textarea
                            id="resolution_notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            maxLength={2000}
                            placeholder="What was found and what was done"
                        />
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} aria-hidden="true" />
                            {locationState === 'saved' ? 'Your current location will be saved with this resolution.'
                                : locationState === 'asking' ? 'Checking your location (optional)...'
                                    : 'Location not available. The resolution will be saved without it.'}
                        </p>
                    </div>
                )}

                {problem && status !== 'pending' && <p className="text-xs text-red-600">{problem}</p>}

                <DialogFooter className="bg-white">
                    <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" disabled={saving || Boolean(problem)} onClick={handleSave}>
                        {saving ? 'Saving...' : isReschedule ? 'Save schedule' : 'Update status'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ReportStatusDialog
