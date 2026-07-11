import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, Send, Mail, MapPin, User } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'

const ConcernDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [concern, setConcern] = useState(null)
    const [loading, setLoading] = useState(true)
    const [replyMessage, setReplyMessage] = useState('')
    const [sending, setSending] = useState(false)

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

    const handleReply = async (e) => {
        e.preventDefault()
        if (!replyMessage.trim()) {
            toast.error('Please write a reply before sending')
            return
        }

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
                    <Button variant="outline" className="mt-4" onClick={() => navigate('/admin')}>
                        Back to Admin Panel
                    </Button>
                </div>
            </Layout>
        )
    }

    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(concern.contact_info || '')

    return (
        <Layout>
            <div className="max-w-2xl mx-auto">
                <Button
                    variant="outline"
                    size="sm"
                    className="mb-4 flex items-center gap-1"
                    onClick={() => navigate('/admin')}
                >
                    <ArrowLeft size={14} />
                    Back to Admin Panel
                </Button>

                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    {concern.name || 'Anonymous submission'}
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    {new Date(concern.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'long', day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${concern.status === 'new' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                }`}>
                                {concern.status}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-gray-400" />
                                {concern.purok ? `Purok ${concern.purok}` : 'Purok not specified'}
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
                    <Card className="mb-6 border-l-4 border-blue-400">
                        <CardContent className="pt-6">
                            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">
                                Replied by {concern.replied_by} · {new Date(concern.replied_at).toLocaleDateString()}
                            </p>
                            <p className="text-gray-900">{concern.reply_message}</p>
                        </CardContent>
                    </Card>
                )}

                <Card>
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
                                    className="bg-blue-900 hover:bg-blue-700 text-white flex items-center gap-2"
                                >
                                    <Send size={16} />
                                    {sending ? 'Sending...' : 'Send Reply'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}

export default ConcernDetail