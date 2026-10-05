import { useState, useEffect } from 'react'
import LandingNavbar from '@/components/NavBar'
import FooterLegalLinks from '@/components/legal/FooterLegalLinks'
import WaterGauge, { getGaugeStatus } from '@/components/WaterGauge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Droplets, MapPin, Send, Mail, Users, ArrowDown, ChevronDown } from 'lucide-react'
import API from '@/services/api'
import { toast } from 'sonner'
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';


// MySQL timestamps normally arrive as ISO strings, but a plain "YYYY-MM-DD HH:MM:SS"
// is only parsed reliably once the space is swapped for a "T" — same guard Archive.jsx uses.
const formatRecordedAt = (value) => {
    const parsed = new Date(typeof value === 'string' ? value.replace(' ', 'T') : value)
    if (isNaN(parsed)) return 'unknown date'
    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}
const heroBtn = 'h-10 rounded-full border px-6 text-sm font-semibold hover:cursor-pointer'
const heroBtnSolid = `${heroBtn} border-white bg-white text-[#143472] shadow-lg shadow-blue-950/20 hover:bg-cyan-50`
const heroBtnOutline = `${heroBtn} border-white bg-transparent text-white hover:bg-white/15 hover:text-white`

const fieldBase = 'w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm text-[#14213d] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102765]/40'
const fieldHeight = 'h-10'
const labelClass = 'font-medium text-[#14246b]'
const stickerOutline = {
    filter:
        'drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff)',
}

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

    const [showIntro, setShowIntro] = useState(
        () => localStorage.getItem('tapawareIntroSeen') !== 'true'
    )
    const [introEnded, setIntroEnded] = useState(false)
    const [isIntroExiting, setIsIntroExiting] = useState(false)

    const enterWebsite = () => {
        localStorage.setItem('tapawareIntroSeen', 'true')
        setIsIntroExiting(true)
    }

    const fetchData = async () => {
        try {
            const [purokRes, summaryRes] = await Promise.all([
                API.get('/visualization/tds-by-purok'),
                API.get('/visualization/summary'),
            ])
            setPurokData(purokRes.data.filter(p => p.last_recorded))
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

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "name") {
            if (!/^[a-zA-Z\s]*$/.test(value) && value !== "") {
                return;

            }
        }
        setForm({
            ...form, [name]: value

        });
    }
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
        <div className="bg-white font-['Poppins',ui-sans-serif,system-ui,sans-serif]">
            {showIntro && (
                <div
                    onTransitionEnd={(event) => {
                        if (event.target === event.currentTarget && isIntroExiting) {
                            setShowIntro(false)
                        }
                    }}
                    className={`fixed inset-0 z-[100] overflow-hidden bg-black transition-transform duration-700 ease-in-out ${isIntroExiting ? '-translate-y-full' : 'translate-y-0'}`}
                >
                    <video
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        onEnded={() => setIntroEnded(true)}
                        onError={() => setIntroEnded(true)}
                        className="absolute inset-0 h-full w-full object-cover"
                    >
                        <source src="/videos/TapAware-intro.mp4" type="video/mp4" />
                    </video>

                    <div className="absolute inset-0 bg-black/25" />

                    {!introEnded && (
                        <button
                            type="button"
                            onClick={enterWebsite}
                            className="absolute right-5 top-5 z-10 rounded border border-white/60 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                        >
                            Skip intro
                        </button>
                    )}

                    {introEnded && (
                        <button
                            type="button"
                            onClick={enterWebsite}
                            aria-label="Enter website"
                            className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white"
                        >
                            <ArrowDown size={40} className="animate-bounce" aria-hidden="true" />
                            <span className="text-sm font-semibold">Enter website</span>
                        </button>
                    )}
                </div>
            )}
            <LandingNavbar />

            {/* HERO */}
            <section
                id="home"
                className="relative flex min-h-[680px] items-center overflow-hidden text-white sm:min-h-screen"
            >
                <img
                    src="/assets/homepage-image.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#071d50]/45 via-[#123c75]/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06447d]/25 via-transparent to-transparent" />

                {/* Hero Content */}
                <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-32 sm:px-6 md:grid-cols-2 md:items-end md:pb-28">

                    {/* Left Side */}
                    <div className="max-w-xl">
                        <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
                            <MapPin size={14} />
                            Barangay Cabalantian, Bacolor, Pampanga
                        </span>

                        <h1 className="mb-5 text-4xl font-bold leading-[1.1] tracking-tight drop-shadow-md sm:text-5xl">
                            Know what&rsquo;s
                            <br />
                            in your water.
                        </h1>

                        <p className="mb-8 max-w-md text-justify text-sm leading-relaxed text-blue-50 drop-shadow sm:text-base">
                            TapAware tracks water quality across every purok in the
                            barangay, so residents always know where things stand,
                            and can speak up when something&rsquo;s wrong.
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                onClick={() =>
                                    document
                                        .getElementById('quality')
                                        ?.scrollIntoView({ behavior: 'smooth' })
                                }
                                className={heroBtnSolid}
                            >
                                View Water Quality
                                <ArrowDown size={16} className="ml-1" />
                            </Button>

                            {user ? (
                                isResident && (
                                    <Button
                                        onClick={() => navigate('/reports/add')}
                                        variant="outline"
                                        className={heroBtnOutline}
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
                                    className={heroBtnOutline}
                                >
                                    Report a Concern
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex justify-center md:justify-end">
                        {loading ? (
                            <div className="h-[220px] w-[220px] animate-pulse rounded-full border-4 border-white/30" />
                        ) : summary && overallStatus ? (
                            <div className="relative mt-16 w-full max-w-[300px] rounded-2xl bg-white px-6 pb-7 pt-9 text-[#14213d] shadow-2xl shadow-[#071d50]/30 md:mr-32 md:mt-0 lg:mr-40 xl:mr-56">
                                <img
                                    src="/assets/figure-barangay-wide.png"
                                    alt=""
                                    aria-hidden="true"
                                    style={stickerOutline}
                                    className="pointer-events-none absolute bottom-full left-1/2 z-10 w-48 -translate-x-1/2 translate-y-[62px]"
                                />
                                <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#17223c]">
                                    Barangay-wide Average
                                </p>

                                <div className="flex justify-center">
                                    <WaterGauge
                                        value={summary.average_tds}
                                        label="Total Dissolved Solids"
                                        size={200}
                                    />
                                </div>

                                <img
                                    src="/assets/tds-image.png"
                                    alt=""
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -bottom-10 -right-[8rem] z-10 w-[200px] drop-shadow-xl sm:-right-30 sm:w-[200px] md:-bottom-13 md:-right-[14rem] md:w-[280px] lg:-bottom-12 lg:-right-[16rem] lg:w-[300px] xl:-bottom-15 xl:-right-[16rem] xl:w-[400px]"
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section id="about" className="bg-gradient-to-b from-white via-[#f7fcff] to-[#e8f8ff] py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="mb-12 grid items-end gap-6 md:grid-cols-2 md:gap-16">
                        <div>
                            <span className="block text-xs font-bold uppercase tracking-widest text-[#4776ae]">About</span>
                            <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-[#102c69]">
                                What TDS means
                                <br className="hidden md:block" />
                                {' '}for your water
                            </h2>
                        </div>
                        <p className="text-justify text-sm leading-relaxed text-[#536a8d]">
                            TDS, or Total Dissolved Solids, measures the minerals and salts dissolved in drinking water,
                            measured in parts per million (ppm). It&rsquo;s one of the clearest early signs of a water quality
                            problem, a sudden change usually means something in the system needs attention.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3 lg:gap-10">
                        <Card className="rounded-2xl border border-green-300 bg-gradient-to-br from-white to-green-50 shadow-[0_12px_32px_-22px_rgba(22,163,74,0.55)] transition-transform duration-300 hover:-translate-y-1">
                            <CardContent className="flex min-h-[230px] flex-col items-center justify-center pt-6 text-center">
                                <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-green-500 ring-8 ring-green-100">
                                    <img src="/assets/figure-for-green.png" alt="" aria-hidden="true" className="h-12 w-12 object-contain" />
                                </div>
                                <p className="mb-1 font-bold text-green-700">0–500 ppm</p>
                                <p className="max-w-[210px] text-sm text-green-800/75">Safe for everyday drinking and household use.</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border border-amber-300 bg-gradient-to-br from-white to-amber-50 shadow-[0_12px_32px_-22px_rgba(217,119,6,0.55)] transition-transform duration-300 hover:-translate-y-1">
                            <CardContent className="flex min-h-[230px] flex-col items-center justify-center pt-6 text-center">
                                <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-amber-500 ring-8 ring-amber-100">
                                    <img src="/assets/figure-for-yellow.png" alt="" aria-hidden="true" className="h-12 w-12 object-contain" />
                                </div>
                                <p className="mb-1 font-bold text-amber-700">501–1000 ppm</p>
                                <p className="max-w-[210px] text-sm text-amber-800/75">Still usable, but worth monitoring closely.</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border border-red-300 bg-gradient-to-br from-white to-red-50 shadow-[0_12px_32px_-22px_rgba(220,38,38,0.55)] transition-transform duration-300 hover:-translate-y-1">
                            <CardContent className="flex min-h-[230px] flex-col items-center justify-center pt-6 text-center">
                                <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-red-500 ring-8 ring-red-100">
                                    <img src="/assets/figure-for-red.png" alt="" aria-hidden="true" className="h-12 w-12 object-contain" />
                                </div>
                                <p className="mb-1 font-bold text-red-700">1000+ ppm</p>
                                <p className="max-w-[210px] text-sm text-red-800/75">May need attention, this is when reports matter most.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* PUROK GAUGES */}
            <section id="quality" className="relative overflow-hidden bg-[#e4f5fc] px-0 pb-32 pt-20">
                <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#4776ae]">Latest readings</span>
                    <h2 className="mb-10 text-3xl font-bold tracking-tight text-[#102c69]">
                        Water quality by purok
                    </h2>

                    {loading ? (
                        <p className="text-[#536a8d]">Loading readings...</p>
                    ) : purokData.length === 0 ? (
                        <p className="text-[#536a8d]">No readings recorded yet.</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:gap-x-12 lg:gap-y-8">
                            {purokData.map((p) => (
                                <div key={p.purok} className="flex justify-center rounded-xl border border-white/80 bg-white p-4 shadow-[0_10px_28px_-20px_rgba(12,43,86,0.55)] transition-transform duration-300 hover:-translate-y-1 sm:p-5">
                                    <WaterGauge
                                        value={p.average_tds}
                                        label={`Purok ${p.purok}`}
                                        sublabel={`Last recorded on ${formatRecordedAt(p.last_recorded)}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-40 md:h-52">
                    <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="h-full w-full">
                        <path fill="#4a90e2" d="M0 70C260 150 520 175 760 160C1060 140 1260 40 1440 0V200H0Z" />
                        <path fill="#2a4fb0" d="M0 100C260 170 520 190 760 178C1060 160 1260 70 1440 28V200H0Z" />
                        <path fill="#102765" d="M0 128C260 188 520 200 760 192C1060 180 1260 100 1440 62V200H0Z" />
                    </svg>
                </div>
            </section>

            {/* CONTACT / CONCERN FORM */}

            <section id="contact" className="relative -mt-px overflow-hidden bg-[#102765] py-20 text-white">
                <div className={user
                    ? 'mx-auto max-w-3xl px-4 text-center sm:px-6'
                    : 'mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 md:gap-x-24'}>

                    <div className={`flex flex-col items-center text-center ${user ? '' : 'md:items-start md:text-left'}`}>
                        <span className="text-xs font-bold uppercase tracking-widest text-white">
                            Contact
                        </span>

                        <h2 className="mt-2 mb-4 text-3xl font-bold tracking-tight text-white">
                            Noticed something off?
                        </h2>

                        <p className={`mb-8 max-w-md text-sm leading-relaxed text-blue-100 ${user ? '' : 'md:text-justify'}`}>
                            Any resident of Barangay Cabalantian can raise a water quality concern here,
                            you don&rsquo;t need an account.
                        </p>

                        <div className="space-y-4">
                            <div className={`flex items-center justify-center gap-3 text-blue-100 ${user ? '' : 'md:justify-start'}`}>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-200">
                                    <Mail size={16} className="text-[#102765]" />
                                </div>
                                <span className="text-sm">admintapaware@gmail.com</span>
                            </div>

                            <div className={`flex items-center justify-center gap-3 text-blue-100 ${user ? '' : 'md:justify-start'}`}>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-200">
                                    <Users size={16} className="text-[#102765]" />
                                </div>
                                <span className="text-sm">Barangay Cabalantian Hall, Bacolor, Pampanga</span>
                            </div>
                        </div>
                    </div>
                    {!user && (

                        <div className="relative w-full max-w-md md:justify-self-end">
                            <img
                                src="/assets/figure-form.png"
                                alt=""
                                aria-hidden="true"
                                style={stickerOutline}
                                className="pointer-events-none absolute right-107 top-1/2 z-20 hidden w-40 -translate-y-1/2 translate-x-4 md:block md:w-44 lg:w-52" />
                            <Card className="relative z-10 rounded-2xl border-0 bg-white shadow-[0_0_48px_rgba(120,170,255,0.25)]">
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className={labelClass}>Name</Label>
                                                <Input id="name" name="name" value={form.name} onChange={handleChange}
                                                    placeholder="Juan Dela Cruz" required className={`${fieldBase} ${fieldHeight}`} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="purok" className={labelClass}>Purok</Label>
                                                <div className="relative">
                                                    <select id="purok" name="purok" value={form.purok} onChange={handleChange} required
                                                        className={`${fieldBase} ${fieldHeight} appearance-none pr-9`}>
                                                        <option value="">Select purok...</option>
                                                        {[1, 2, 3, 4, 5, 6].map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                    <ChevronDown size={16} aria-hidden="true"
                                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="contact_info" className={labelClass}>Email address</Label>
                                            <Input id="contact_info" name="contact_info" type="email" value={form.contact_info}
                                                onChange={handleChange} placeholder="juandelacruz@gmail.com" required
                                                className={`${fieldBase} ${fieldHeight}`} />
                                            <p className="mt-1 text-xs text-[#4776ae]">
                                                Provide a valid email if you&rsquo;d like the administrator to reply to your concern.
                                            </p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="message" className={labelClass}>Your concern</Label>
                                            <textarea id="message" name="message" value={form.message} onChange={handleChange}
                                                required rows={4} placeholder="Describe what you noticed..." maxLength="120"
                                                className={`${fieldBase} resize-y py-2`} />
                                        </div>
                                        <Button type="submit" disabled={submitting}
                                            className="w-full gap-2 bg-[#102765] text-white hover:cursor-pointer hover:bg-[#1a3a8f]">
                                            <Send size={16} />
                                            {submitting ? 'Sending...' : 'Submit Concern'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}



                </div>
            </section>


            {/* FOOTER */}
            <footer className="bg-[#071b4d] py-8 text-blue-200">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-x-8 gap-y-3 px-4 text-center sm:flex-row sm:flex-wrap sm:px-6">
                    <div className="flex items-center gap-2">
                        <Droplets size={14} className="text-cyan-400" />
                        <span className="text-xs">TapAware — Barangay Cabalantian Water Quality Monitoring System</span>
                    </div>
                    <FooterLegalLinks variant="dark" />
                    <p className="text-xs text-blue-300">© {new Date().getFullYear()} Barangay Cabalantian, Bacolor, Pampanga</p>
                </div>
            </footer>
        </div>
    )
}

export default Homepage