import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, Send, Mail, MapPin, Archive as ArchiveIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useAuth } from '@/context/AuthContext'
import API from '@/services/api'
import { toast } from 'sonner'

const ConcernDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [concern, setConcern] = useState(null)
    const [loading, setLoading] = useState(true)
    const [replyMessage, setReplyMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [replyConfirmOpen, setReplyConfirmOpen] = useState(false)

    useEffect(() => {
        fetchConcern()
    }, [id])

    const fetchConcern = async () => {
        try {
            const res = await API.get(`/concerns/${id}`)
            setConcern(res.data)
        } catch (error) {
            console.log('Error fetching concern:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleReply = (e) => {
        e.preventDefault()
        if (!replyMessage.trim()) {
            toast.error('Please write a reply before sending')
            return
        }

        setReplyConfirmOpen(true)
    }

    const sendReply = async () => {
        setSending(true)
        try {
            const res = await API.put(`/concerns/${id}/reply`, { reply_message: replyMessage })
            if (res.data.emailSent) {
                toast.success(res.data.message)
            } else {
                toast.warning(res.data.message)
            }
            fetchConcern()
            setReplyMessage('')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send reply')
        } finally {
            setSending(false)
        }
    }

    const handleArchive = async () => {
        try {
            await API.put(`/concerns/${id}/archive`)
            toast.success('Concern archived successfully')
            navigate('/admin?tab=concerns')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to archive concern')
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading concern...</p>
                </div>
            </Layout>
        )
    }

    if (!concern) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Concern not found.</p>
                    <Button className="mt-4" onClick={() => navigate(-1)}>
                        Back
                    </Button>
                </div>
            </Layout>
        )
    }

    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(concern.contact_info || '')

    return (
        <Layout>
            <div className="mx-auto w-full">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <Button

                        size="sm"
                        className="flex items-center gap-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={14} />
                        Back
                    </Button>
                    {user?.role === 'admin' && (
                        <ConfirmDialog
                            title="Archive this concern?"
                            description="It will be removed from active concerns and can be restored from the Archive page."
                            actionText="Archive Concern"
                            actionVariant="destructive"
                            onConfirm={handleArchive}
                        >
                            <Button size="sm" className="flex items-center gap-1 border-red-600 bg-red-600 text-white hover:bg-red-700 hover:text-white">
                                <ArchiveIcon size={14} />
                                Archive
                            </Button>
                        </ConfirmDialog>
                    )}
                </div>

                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {concern.name || 'Anonymous submission'}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {new Date(concern.created_at).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric',
                                    })}
                                </p>
                            </div>
                            <span className={`inline-block px-3 py-1 text-sm font-semibold capitalize ${concern.status === 'new' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {concern.status}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-gray-400" />
                                {concern.zone ? `Zone ${concern.zone}` : 'Zone not specified'}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Mail size={14} className="text-gray-400" />
                                {concern.contact_info || 'No contact info provided'}
                                {concern.contact_info && !hasEmail && (
                                    <span className="text-yellow-600 text-xs">(not an email — reply can't be sent automatically)</span>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Concern</p>
                            <p className="text-gray-900">{concern.message}</p>
                        </div>
                    </CardContent>
                </Card>
                {concern.reply_message && (
                    <div className="grid sm:grid-cols-2 gap-6">
                        {concern.reply_message && (
                            <Card className="mb-6 border-l-4 border-blue-400 h-min">
                                <CardContent className="pt-2">
                                    <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                                        Replied by {concern.replied_by} · {new Date(concern.replied_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </p>
                                    <p className="text-gray-900">{concern.reply_message}</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <MessageSquare size={18} className="text-blue-600" />
                                    {concern.reply_message ? 'Send another reply' : 'Reply to this concern'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleReply} className="space-y-4">
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Write your response..."
                                        rows={5}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={sending}
                                            className="border-blue-900 bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2"
                                        >
                                            <Send size={16} />
                                            {sending ? 'Sending...' : 'Send Reply'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {!concern.reply_message && (
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare size={18} className="text-blue-600" />
                                {concern.reply_message ? 'Send another reply' : 'Reply to this concern'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleReply} className="space-y-4">
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Write your response..."
                                    rows={5}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={sending}
                                        className="border-blue-900 bg-blue-900 hover:bg-blue-800 text-white flex items-center gap-2"
                                    >
                                        <Send size={16} />
                                        {sending ? 'Sending...' : 'Send Reply'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
                <ConfirmDialog
                    open={replyConfirmOpen}
                    onOpenChange={setReplyConfirmOpen}
                    title="Send reply?"
                    description="This will send your reply to the person who submitted this concern."
                    actionText="Send reply"
                    actionVariant="default"
                    isLoading={sending}
                    onConfirm={sendReply}
                />
            </div>
        </Layout>
    )
}

export default ConcernDetail