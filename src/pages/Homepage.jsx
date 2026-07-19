import { useState, useEffect } from 'react'
import LandingNavbar from '@/components/NavBar'
import WaterGauge, { getGaugeStatus } from '@/components/WaterGauge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Droplets, ShieldCheck, Info, MapPin, Send, Mail, Phone,
    AlertTriangle, Beaker, Users, ArrowDown
} from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';



const Homepage = () => {
    const [purokData, setPurokData] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ name: '', contact_info: '', purok: '', message: '' })
    const [submitting, setSubmitting] = useState(false)
    const location = useLocation();
    const { user } = useAuth();
    const isResident = user?.role === 'resident';
    const navigate = useNavigate();

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [purokRes, summaryRes] = await Promise.all([
                API.get('/analytics/tds-by-purok'),
                API.get('/analytics/summary'),
            ])
            setPurokData(purokRes.data.filter(p => p.reading_count > 0))
            setSummary(summaryRes.data)
        } catch (error) {
            console.log('Error loading public water data:', error)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (location.state?.scrollTo) {
            const id = location.state.scrollTo;

            // Wait until the page has rendered
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });

                // Clear the navigation state
                window.history.replaceState({}, document.title);
            }, 300);
        }
    }, [location]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await API.post('/concerns', form)
            toast.success('Your concern has been submitted. Thank you!')
            setForm({ name: '', contact_info: '', purok: '', message: '' })
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const overallStatus = summary ? getGaugeStatus(summary.average_tds) : null

    return (
        <div className="bg-white">
            <LandingNavbar />

            {/* HERO */}
            <section
                id="home"
                className="relative min-h-screen overflow-hidden flex items-center text-white"
            >
                {/* Background Video */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="/videos/tap-water.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#081426]/90 via-[#081426]/70 to-[#081426]/40"></div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-28 grid md:grid-cols-2 gap-12 items-center">

                    {/* Left Side */}
                    <div>
                        <span className="inline-flex items-center gap-2 text-cyan-300 text-xs font-semibold uppercase tracking-widest mb-4">
                            <MapPin size={14} />
                            Barangay Cabalantian, Bacolor, Pampanga
                        </span>

                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-5">
                            Know what's
                            <br />
                            in your water.
                        </h1>

                        <p className="text-blue-100 text-base sm:text-lg mb-8 max-w-md">
                            TapAware tracks water quality across every purok in the
                            barangay, so residents always know where things stand,
                            and can speak up when something's wrong.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() =>
                                    document
                                        .getElementById('quality')
                                        ?.scrollIntoView({ behavior: 'smooth' })
                                }
                                className="bg-white hover:bg-gray-200 text-black font-semibold hover:cursor-pointer"
                            >
                                View Water Quality
                                <ArrowDown size={16} className="ml-1" />
                            </Button>

                            {user ? (
                                isResident && (
                                    <Button
                                        onClick={() => navigate('/reports/add')}
                                        variant="outline"
                                        className="border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:text-white hover:cursor-pointer"
                                    >
                                        Submit Report
                                    </Button>
                                )
                            ) : (
                                <Button
                                    onClick={() =>
                                        document
                                            .getElementById('contact')
                                            ?.scrollIntoView({ behavior: 'smooth' })
                                    }
                                    variant="outline"
                                    className="border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:text-white hover:cursor-pointer"
                                >
                                    Report a Concern
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex justify-center items-center">
                        {loading ? (
                            <div className="w-[220px] h-[220px] rounded-full border-4 border-white/20 animate-pulse" />
                        ) : summary && overallStatus ? (
                            <div className="bg-white backdrop-blur-xl border border-white rounded-2xl p-8 shadow-2xl">
                                <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/70 mb-4">
                                    Barangay-wide Average
                                </p>

                                <WaterGauge
                                    value={summary.average_tds}
                                    label="Total Dissolved Solids"
                                    size={190}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section id="about" className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="max-w-2xl mb-14">
                        <span className="text-1xl font-semibold uppercase tracking-widest text-cyan-600">About the system</span>
                        <h2 className="text-3xl font-black tracking-tight text-[#0a1a33] mt-2 mb-4">
                            What TDS means for your water
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            TDS, or Total Dissolved Solids, measures the minerals and salts dissolved in drinking water,
                            measured in parts per million (ppm). It's one of the clearest early signs of a water quality
                            problem, a sudden change usually means something in the system needs attention.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                        <Card className="border-t-4 border-t-green-500">
                            <CardContent className="pt-6">
                                <ShieldCheck className="text-green-600 mb-3" size={28} />
                                <p className="font-bold text-gray-900 mb-1">0–500 ppm</p>
                                <p className="text-sm text-gray-500">Safe for everyday drinking and household use.</p>
                            </CardContent>
                        </Card>
                        <Card className="border-t-4 border-t-yellow-500">
                            <CardContent className="pt-6">
                                <Beaker className="text-yellow-600 mb-3" size={28} />
                                <p className="font-bold text-gray-900 mb-1">501–1000 ppm</p>
                                <p className="text-sm text-gray-500">Still usable, but worth monitoring closely.</p>
                            </CardContent>
                        </Card>
                        <Card className="border-t-4 border-t-red-500">
                            <CardContent className="pt-6">
                                <AlertTriangle className="text-red-600 mb-3" size={28} />
                                <p className="font-bold text-gray-900 mb-1">1000+ ppm</p>
                                <p className="text-sm text-gray-500">May need attention, this is when reports matter most.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* PUROK GAUGES */}
            <section id="quality" className="py-20 bg-[#f0f9ff]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Droplets className="text-cyan-600" size={18} />
                        <span className="text-1xl font-semibold uppercase tracking-widest text-cyan-600">Live readings</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-[#0a1a33] mb-10">
                        Water quality by purok
                    </h2>

                    {loading ? (
                        <p className="text-gray-500">Loading readings...</p>
                    ) : purokData.length === 0 ? (
                        <p className="text-gray-500">No readings recorded yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                            {purokData.map((p) => (
                                <div key={p.purok} className="bg-white p-5 shadow-sm flex justify-center">
                                    <WaterGauge
                                        value={p.average_tds}
                                        label={`Purok ${p.purok}`}
                                        sublabel={`${p.reading_count} reading${p.reading_count === 1 ? '' : 's'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* CONTACT / CONCERN FORM */}
            {!user && (
                <section id="contact" className="py-20 bg-white">

                    <div className={`${user ? 'max-w-3xl mx-auto px-4 sm:px-6 text-center' : 'max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12'}`}>

                        <div className="flex flex-col items-center text-center">
                            <span className="text-1xl font-semibold uppercase tracking-widest text-cyan-600">
                                Contact
                            </span>

                            <h2 className="text-3xl font-black tracking-tight text-[#0a1a33] mt-2 mb-4">
                                Noticed something off?
                            </h2>

                            <p className="text-gray-600 leading-relaxed mb-8 max-w-lg">
                                Any resident of Barangay Cabalantian can raise a water quality concern here,
                                you don't need an account. Barangay staff review every submission.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-center  gap-3 text-gray-700">
                                    <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                                        <Mail size={16} className="text-cyan-600" />
                                    </div>
                                    <span className="text-sm">cabalantian.tapaware@gmail.com</span>
                                </div>

                                <div className="flex items-center justify-center gap-3 text-gray-700">
                                    <div className="w-9 h-9 rounded-full bg-cyan-50 flex items-center justify-center shrink-0">
                                        <Users size={16} className="text-cyan-600" />
                                    </div>
                                    <span className="text-sm">Barangay Cabalantian Hall, Bacolor, Pampanga</span>
                                </div>
                            </div>
                        </div>

                        <Card className="shadow-md">
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name (optional)</Label>
                                            <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Juan Dela Cruz" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="purok">Purok</Label>
                                            <select
                                                id="purok" name="purok" value={form.purok} onChange={handleChange}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-10 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="">Select purok...</option>
                                                {[1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_info">Contact number or email (optional)</Label>
                                        <Input id="contact_info" name="contact_info" value={form.contact_info} onChange={handleChange} minLength="11" placeholder="09xx xxx xxxx or juandelacruz@gmail.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Your concern</Label>
                                        <textarea
                                            id="message" name="message" value={form.message} onChange={handleChange}
                                            required rows={4} placeholder="Describe what you noticed..."
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-vertical"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-[#0a1a33] hover:bg-gray-700 text-white gap-2 hover:cursor-pointer"
                                    >
                                        <Send size={16} />
                                        {submitting ? 'Sending...' : 'Submit Concern'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>



                    </div>
                </section>
            )}

            {/* FOOTER */}
            <footer className="bg-[#0a1a33] text-blue-200 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Droplets size={16} className="text-cyan-400" />
                        <span className="text-sm">TapAware — Barangay Cabalantian Water Quality System</span>
                    </div>
                    <p className="text-xs text-blue-300">© {new Date().getFullYear()} Barangay Cabalantian, Bacolor, Pampanga</p>
                </div>
            </footer>
        </div>
    )
}

export default Homepage