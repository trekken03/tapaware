import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/Layout'
import DateRangePicker from '@/components/DateRangePicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3 } from 'lucide-react'
import { Download } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie,
    Cell, Legend, LineChart, Line
} from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

const COLORS = ['#1e40af', '#dc2626', '#16a34a', '#d97706', '#7c3aed']

// Logo lives in public/assets, so it's referenced by URL path (not imported
// as a module). Cached after first load so repeated PDF exports don't
// re-fetch it every time.
const LOGO_SRC = '/assets/logo.webp'
let cachedLogoImage = null

const loadLogoImage = () => {
    if (cachedLogoImage) return Promise.resolve(cachedLogoImage)

    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
            cachedLogoImage = img
            resolve(img)
        }
        img.onerror = reject
        img.src = LOGO_SRC
    })
}

const getDefaultDates = () => {
    const to = new Date().toISOString().split('T')[0]
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 30)
    const from = fromDate.toISOString().split('T')[0]
    return { from, to }
}

const Analytics = () => {
    const [byIssue, setByIssue] = useState([])
    const [byPurok, setByPurok] = useState([])
    const [tdsTrend, setTdsTrend] = useState([])
    const [trendingIssues, setTrendingIssues] = useState([])
    const [trendingByTime, setTrendingByTime] = useState([])
    const [tdsByPurok, setTdsByPurok] = useState([])

    const [loading, setLoading] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [exportError, setExportError] = useState('')
    const [dateRange, setDateRange] = useState(getDefaultDates())
    // Refs to the actual rendered chart cards, so the PDF can screenshot
    // exactly what's on screen instead of redrawing an approximation.
    const purokChartRef = useRef(null)
    const issueChartRef = useRef(null)
    const tdsChartRef = useRef(null)



    // Captures a DOM node and adds it to the PDF as a titled section —
    // checks if the TITLE + IMAGE fit together before drawing either one,
    // so a section never gets split (title stranded on one page with a
    // gap underneath, image alone on the next).
    const addChartSection = async (pdf, title, element, { margin, pageWidth, pageHeight, y }) => {
        const contentWidth = pageWidth - margin * 2
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true
        })
        const imgData = canvas.toDataURL('image/png')
        const imgHeight = (canvas.height / canvas.width) * contentWidth
        const titleHeight = 10
        const topGap = 6
        const neededHeight = topGap + titleHeight + imgHeight + 8

        if (y + neededHeight > pageHeight - margin) {
            pdf.addPage()
            y = margin
        }

        y += topGap

        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(14)
        pdf.setTextColor(17, 24, 39)
        pdf.text(title, margin, y)
        y += titleHeight

        pdf.addImage(imgData, 'PNG', margin, y, contentWidth, imgHeight)
        return y + imgHeight + 8
    }

    const handleDownloadPdf = async () => {
        setExportError('')
        setIsExporting(true)

        try {
            const pdf = new jsPDF('p', 'mm', 'a4')
            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()
            const margin = 10
            const contentWidth = pageWidth - margin * 2
            let y = margin

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



            // --- Header: logo + title centered as one block, date top-right ---
            const logoSize = 16 // mm, square
            const gap = 4
            let logoLoaded = false
            let logoImg = null

            try {
                logoImg = await loadLogoImage()
                logoLoaded = true
            } catch (error) {
                // If the logo can't load, just fall back to a text-only
                // header instead of breaking the whole PDF export.
                console.log('Logo failed to load for PDF, continuing without it:', error)
            }

            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(16)
            const titleWidth = pdf.getTextWidth('TapAware Analytics Report')
            const blockWidth = (logoLoaded ? logoSize + gap : 0) + titleWidth
            const blockStartX = (pageWidth - blockWidth) / 2

            let titleX = blockStartX
            if (logoLoaded) {
                pdf.addImage(logoImg, 'JPEG', blockStartX, y, logoSize, logoSize)
                titleX = blockStartX + logoSize + gap
            }

            pdf.setTextColor(17, 24, 39)
            pdf.text('TapAware Analytics Report', titleX, y + logoSize / 2 - 2)

            y += logoSize + 6

            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(107, 114, 128)
            const periodLabel = `Reporting Period: ${new Date(dateRange.from).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} — ${new Date(dateRange.to).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
            pdf.text(periodLabel, pageWidth / 2, y, { align: 'center' })
            y += 5
            pdf.text(`Generated ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' })
            y += 6
            pdf.setDrawColor(229, 231, 235)
            pdf.line(margin, y, pageWidth - margin, y)
            y += 8

            // --- Summary ---
            addSectionTitle('Summary')
            addRow(['Total reports', totalReports], [45, 40])
            addRow(['Puroks tracked', byPurok.length], [45, 40])
            addRow(['Issue types', byIssue.length], [45, 40])
            addRow(['Latest average TDS', latestTds ? `${Number(latestTds.average || 0).toFixed(2)} ppm` : 'No data'], [45, 40])
            y += 4

            // --- Real charts, screenshotted so the PDF matches the on-screen page exactly ---
            // --- Reports per Purok: chart + detail table together ---
            if (purokChartRef.current) {
                y = await addChartSection(pdf, 'Reports per Purok', purokChartRef.current, { margin, pageWidth, pageHeight, y })
            }

            addTableHeader(['Purok', 'Reports', 'Share'], [35, 30, 120])
            byPurok.forEach((purok) => {
                addPageIfNeeded(9)
                const reportCount = Number(purok.report_count || 0)
                const barWidth = (reportCount / maxReports) * 70
                const sharePct = totalReports > 0 ? ((reportCount / totalReports) * 100).toFixed(1) : '0.0'

                pdf.setFont('helvetica', 'normal')
                pdf.setFontSize(10)
                pdf.setTextColor(55, 65, 81)
                pdf.text(`Purok ${purok.purok}`, margin + 2, y)
                pdf.text(String(reportCount), margin + 37, y)
                pdf.setFillColor(229, 231, 235)
                pdf.rect(margin + 65, y - 4, 70, 4, 'F')
                pdf.setFillColor(37, 99, 235)
                pdf.rect(margin + 65, y - 4, barWidth, 4, 'F')
                pdf.setTextColor(107, 114, 128)
                pdf.setFontSize(8)
                pdf.text(`${sharePct}%`, margin + 138, y)
                y += 8
            })
            y += 4

            // --- Reports by Issue Type: chart + detail table together ---
            if (issueChartRef.current) {
                y = await addChartSection(pdf, 'Reports by Issue Type', issueChartRef.current, { margin, pageWidth, pageHeight, y })
            }

            addTableHeader(['Issue Type', 'Reports', 'Share'], [90, 40, 50])
            byIssue.forEach((issue) => {
                const count = Number(issue.count || 0)
                const sharePct = totalReports > 0 ? ((count / totalReports) * 100).toFixed(1) : '0.0'
                addRow([issue.issue_type || 'Unknown', count, `${sharePct}%`], [90, 40, 50])
            })
            y += 4

            // --- TDS Trend: chart + detail table together ---
            if (tdsTrend.length > 0 && tdsChartRef.current) {
                y = await addChartSection(pdf, 'TDS Trend', tdsChartRef.current, { margin, pageWidth, pageHeight, y })
            }

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
            toast.success('Analytics report exported successfully!')
        } catch (error) {
            console.error('Error generating PDF:', error)
            const errorMsg = `PDF download failed: ${error?.message || 'Unknown error'}`
            setExportError(errorMsg)
            toast.error(errorMsg)
        }
        finally {
            setIsExporting(false)
        }

    }

    const fetchData = async () => {
        setLoading(true)
        try {
            const params = { from: dateRange.from, to: dateRange.to }
            const [issueRes, purokRes, trendRes, trendingRes, timeRes, tdsByPurokRes] = await Promise.all([
                API.get('/analytics/reports-by-issue', { params }),
                API.get('/analytics/reports-by-purok', { params }),
                API.get('/analytics/tds-trend', { params }),
                API.get('/analytics/trending-issues', { params }),
                API.get('/analytics/trending-by-time', { params }),
                API.get('/analytics/tds-by-purok', { params }),

            ])
            setByIssue(issueRes.data)
            setByPurok(purokRes.data)
            setTdsTrend(trendRes.data)
            setTrendingIssues(trendingRes.data)
            setTrendingByTime(timeRes.data)
            setTdsByPurok(tdsByPurokRes.data)

        } catch (error) {
            console.log('Error fetching analytics:', error)
            toast.error('Failed to load analytics data')
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        fetchData()
    }, [dateRange])



    const topIssuePerPurok = trendingIssues.reduce((acc, row) => {
        if (!acc.find(item => item.purok === row.purok)) {
            acc.push(row)
        }
        return acc
    }, [])

    const topIssuePerTimeBucket = trendingByTime.reduce((acc, row) => {
        if (!acc.find(item => item.time_bucket === row.time_bucket)) {
            acc.push(row)
        }
        return acc
    }, [])

    const timeBucketLabels = {
        morning: 'Morning (5am–11am)',
        afternoon: 'Afternoon (11am–5pm)',
        evening: 'Evening (5pm–9pm)',
        night: 'Night (9pm–5am)',
    }

    // Get color based on TDS value
    const getTDSColor = (tdsValue) => {
        const value = Number(tdsValue) || 0
        if (value <= 500) return '#0f6e56' // Green - Safe
        if (value <= 1000) return '#f59e0b' // Amber/Orange - Warning
        return '#dc2626' // Red - Danger
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                        <p className="text-gray-500 mt-1">Visual breakdown of water quality data</p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
                        <Button
                            onClick={handleDownloadPdf}
                            disabled={isExporting}
                            className="bg-blue-900 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            <Download size={16} />
                            {isExporting ? 'Preparing PDF...' : 'Download PDF'}
                        </Button>
                    </div>
                </div>
                {exportError && (
                    <p className="text-sm text-red-600 mb-4">{exportError}</p>
                )}

                <div>
                    {/* Top row - Bar and Pie charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                        {/* Reports per purok */}
                        <Card ref={purokChartRef}>
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
                        <Card ref={issueChartRef}>
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
                    <Card className="mb-6" ref={tdsChartRef}>
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

                    {/* Average TDS by purok */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 size={18} className="text-blue-600" />
                                Average TDS by Purok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tdsByPurok.every(p => p.reading_count == 0) ? (
                                <p className="text-gray-500 text-sm text-center py-12">
                                    No TDS readings recorded yet.
                                </p>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={tdsByPurok}>
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
                                            label={{ value: 'TDS (ppm)', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 12 } }}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`${Number(value).toFixed(2)} ppm`, 'Avg TDS']}
                                            labelFormatter={(label) => `Purok ${label}`}
                                        />
                                        <Bar dataKey="average_tds" radius={[2, 2, 0, 0]}>
                                            {tdsByPurok.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getTDSColor(entry.average_tds)} />
                                            ))}
                                        </Bar>
                                    </BarChart>
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
                                        <tr key={index} className="bg-white">
                                            <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                            <td className="py-3 px-4 text-sm font-semibold">Purok {p.purok}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 bg-gray-100 h-2 max-w-32">
                                                        <div
                                                            className="bg-blue-600 h-2"
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
            {/* Trending issue per purok */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 size={18} className="text-blue-600" />
                        Trending Issue per Purok
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {topIssuePerPurok.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-12">
                            No reports recorded yet.
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    {['#', 'Purok', 'Top Issue', 'Times Reported'].map(h => (
                                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topIssuePerPurok.map((row, index) => (
                                    <tr key={row.purok} className="bg-white">
                                        <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                        <td className="py-3 px-4 text-sm font-semibold">Purok {row.purok}</td>
                                        <td className="py-3 px-4">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1  text-xs font-semibold capitalize">
                                                {row.issue_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-semibold text-blue-600">
                                            {row.count}x
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* Trending issue per time of day */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 size={18} className="text-blue-600" />
                        Trending Issue per Time of Day
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {topIssuePerTimeBucket.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-12">
                            No reports recorded yet.
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    {['#', 'Time of Day', 'Top Issue', 'Times Reported'].map(h => (
                                        <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {topIssuePerTimeBucket.map((row, index) => (
                                    <tr key={row.time_bucket} className="bg-white">
                                        <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                                        <td className="py-3 px-4 text-sm font-semibold">
                                            {timeBucketLabels[row.time_bucket]}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 text-xs font-semibold capitalize">
                                                {row.issue_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm font-semibold text-blue-600">
                                            {row.count}x
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </Layout>
    )
}
export default Analytics;