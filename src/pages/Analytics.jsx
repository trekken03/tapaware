import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'
import { Download } from 'lucide-react'
import API from '@/services/api'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie,
    Cell, Legend, LineChart, Line
} from 'recharts'
import jsPDF from 'jspdf'

const COLORS = ['#1e40af', '#dc2626', '#16a34a', '#d97706', '#7c3aed']

const Analytics = () => {
    const [byIssue, setByIssue] = useState([])
    const [byPurok, setByPurok] = useState([])
    const [tdsTrend, setTdsTrend] = useState([])
    const [loading, setLoading] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [exportError, setExportError] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const handleDownloadPdf = async () => {
        setExportError('')
        setIsExporting(true)

        try {
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 10
            const contentWidth = pageWidth - margin * 2
            let y = 16

            const addPageIfNeeded = (neededHeight = 12) => {
                if (y + neededHeight > pageHeight - margin) {
                    pdf.addPage()
                    y = margin
                }
            }

            const addSectionTitle = (title) => {
                addPageIfNeeded(14)
                pdf.setFont('helvetica', 'bold')
                pdf.setFontSize(12)
                pdf.setTextColor(17, 24, 39)
                pdf.text(title, margin, y)
                y += 8
            }

            const addRow = (columns, widths) => {
                addPageIfNeeded(8)
                pdf.setFont('helvetica', 'normal')
                pdf.setFontSize(10)
                pdf.setTextColor(55, 65, 81)

                let x = margin
                columns.forEach((column, index) => {
                    pdf.text(String(column), x, y)
                    x += widths[index]
                })
                y += 7
            }

            const addTableHeader = (columns, widths) => {
                addPageIfNeeded(10)
                pdf.setFillColor(243, 244, 246)
                pdf.rect(margin, y - 5, contentWidth, 8, 'F')
                pdf.setFont('helvetica', 'bold')
                pdf.setFontSize(9)
                pdf.setTextColor(75, 85, 99)

                let x = margin
                columns.forEach((column, index) => {
                    pdf.text(column, x + 2, y)
                    x += widths[index]
                })
                y += 8
            }

            const totalReports = byPurok.reduce((sum, purok) => sum + Number(purok.report_count || 0), 0)
            const maxReports = Math.max(...byPurok.map((purok) => Number(purok.report_count || 0)), 1)
            const latestTds = tdsTrend.length > 0 ? tdsTrend[0] : null

            pdf.setTextColor(17, 24, 39)
            pdf.setFontSize(16)
            pdf.setFont('helvetica', 'bold')
            pdf.text('TapAware Analytics Report', margin, y)
            y += 7

            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(107, 114, 128)
            pdf.text(`Generated ${new Date().toLocaleString()}`, margin, y)
            y += 12

            addSectionTitle('Summary')
            addRow(['Total reports', totalReports], [45, 40])
            addRow(['Puroks tracked', byPurok.length], [45, 40])
            addRow(['Issue types', byIssue.length], [45, 40])
            addRow(['Latest average TDS', latestTds ? `${Number(latestTds.average || 0).toFixed(2)} ppm` : 'No data'], [45, 40])
            y += 4

            addSectionTitle('Reports per Purok')
            addTableHeader(['Purok', 'Reports', 'Visual'], [35, 30, 120])
            byPurok.forEach((purok) => {
                addPageIfNeeded(9)
                const reportCount = Number(purok.report_count || 0)
                const barWidth = (reportCount / maxReports) * 70

                pdf.setFont('helvetica', 'normal')
                pdf.setFontSize(10)
                pdf.setTextColor(55, 65, 81)
                pdf.text(`Purok ${purok.purok}`, margin + 2, y)
                pdf.text(String(reportCount), margin + 37, y)
                pdf.setFillColor(229, 231, 235)
                pdf.rect(margin + 65, y - 4, 70, 4, 'F')
                pdf.setFillColor(37, 99, 235)
                pdf.rect(margin + 65, y - 4, barWidth, 4, 'F')
                y += 8
            })
            y += 4

            addSectionTitle('Reports by Issue Type')
            addTableHeader(['Issue Type', 'Reports'], [120, 60])
            byIssue.forEach((issue) => {
                addRow([issue.issue_type || 'Unknown', issue.count || 0], [120, 60])
            })
            y += 4

            addSectionTitle('TDS Trend')
            addTableHeader(['Date', 'Average TDS', 'Readings'], [65, 60, 55])
            tdsTrend.forEach((reading) => {
                const date = new Date(reading.date).toLocaleDateString()
                addRow([
                    date,
                    `${Number(reading.average || 0).toFixed(2)} ppm`,
                    reading.reading_count || 0
                ], [65, 60, 55])
            })

            pdf.save('tapaware-analytics.pdf')
        } catch (error) {
            console.error('Error generating PDF:', error)
            setExportError('PDF download failed. Please try again.')
        }
        finally {
            setIsExporting(false)
        }

    }

    const fetchData = async () => {
        try {
            const [issueRes, purokRes, trendRes] = await Promise.all([
                API.get('/analytics/reports-by-issue'),
                API.get('/analytics/reports-by-purok'),
                API.get('/analytics/tds-trend')
            ])
            setByIssue(issueRes.data)
            setByPurok(purokRes.data)
            setTdsTrend(trendRes.data)
        } catch (error) {
            console.log('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500">Loading analytics...</p>
                </div>
            </Layout>
        )
    }

    return (
        <Layout>
            <div>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                        <p className="text-gray-500 mt-1">Visual breakdown of water quality data</p>
                    </div>
                    <Button
                        onClick={handleDownloadPdf}
                        disabled={isExporting}
                        className="bg-blue-900 hover:bg-blue-700 text-white flex items-center gap-2"

                    >
                        <Download size={16} />
                        {isExporting ? 'preparing PDF...' : 'Download PDF'}
                    </Button>
                </div>
                {exportError && (
                    <p className="text-sm text-red-600 mb-4">{exportError}</p>
                )}

                <div>
                    {/* Top row - Bar and Pie charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                        {/* Reports per purok */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Reports per Purok</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={byPurok}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="purok"
                                            fontSize={12}
                                            tick={{ fill: '#6b7280' }}
                                            tickFormatter={(v) => `Purok ${v}`}
                                        />
                                        <YAxis
                                            fontSize={12}
                                            tick={{ fill: '#6b7280' }}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            formatter={(value) => [value, 'Reports']}
                                            labelFormatter={(label) => `Purok ${label}`}
                                        />
                                        <Bar dataKey="report_count" fill="#1e40af" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Reports by issue type */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Reports by Issue Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={byIssue}
                                            dataKey="count"
                                            nameKey="issue_type"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            label={({ issue_type, percent }) =>
                                                `${issue_type} ${(percent * 100).toFixed(0)}%`
                                            }
                                        >
                                            {byIssue.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [value, 'Reports']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                    </div>

                    {/* TDS Trend */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-base">TDS Trend (Last 30 Days)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tdsTrend.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-12">
                                    No TDS data available yet.
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={tdsTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            fontSize={12}
                                            tick={{ fill: '#6b7280' }}
                                            tickFormatter={(date) => new Date(date).toLocaleDateString()}
                                        />
                                        <YAxis
                                            fontSize={12}
                                            tick={{ fill: '#6b7280' }}
                                            label={{
                                                value: 'TDS (ppm)',
                                                angle: -90,
                                                position: 'insideLeft',
                                                style: { fill: '#6b7280', fontSize: 12 }
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`${value} ppm`, 'Avg TDS']}
                                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="average"
                                            stroke="#1e40af"
                                            strokeWidth={2}
                                            dot={{ fill: '#1e40af', r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Report count table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 size={18} className="text-blue-600" />
                                Report Count per Purok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        {['#', 'Purok', 'Total Reports'].map(h => (
                                            <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {byPurok.map((p, index) => (
                                        <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                            <td className="py-3 px-4 text-sm font-semibold">Purok {p.purok}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-32">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{
                                                                width: `${Math.min((p.report_count / Math.max(...byPurok.map(x => x.report_count || 1))) * 100, 100)}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        {p.report_count}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </Layout>
    )
}

export default Analytics;
