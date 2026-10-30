import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MailCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import API from "@/services/api";
import { toast } from 'sonner'
import LandingNavbar from "@/components/NavBar";
import SceneMascot from "@/components/SceneMascot";

// 16px text and 44px height so phones don't zoom in and fingers hit the target.
const fieldClass = 'h-11 text-base md:text-base'
// Same box as <Input>: height, border, radius, background, padding, font size, focus ring.
const selectClass =
    'h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base md:text-base transition-colors outline-none hover:cursor-pointer focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const emptyForm = { full_name: '', email: '', household_number: '', zone: '', address: '', website: '' }

const RequestAccount = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [form, setForm] = useState(emptyForm);
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'household_number' && !/^\d{0,6}$/.test(value)) {
            return;
        }

        setForm({ ...form, [name]: value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await API.post('/account-requests', { ...form, consent });
            setSuccessMessage(res.data.message)
            setForm(emptyForm)
            setConsent(false)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            {/* The scene is pinned to the window, so the taller card scrolls over it. */}
            <div className="fixed inset-0 bg-[url('/assets/mobile_version.jpg')] bg-cover bg-center bg-no-repeat md:bg-[url('/assets/new_login_bg.jpg')]">
                {/* Mascot glued to the background scene (right of the centered card). Desktop only. */}
                <SceneMascot src="/assets/login_figure.png" x={0.73} size={0.21} className="hidden lg:block" />
            </div>

            <LandingNavbar />

            <div className="pointer-events-none relative z-10 flex min-h-screen items-center justify-center px-4 pt-24 pb-10">
                <Card className="pointer-events-auto w-full sm:max-w-[34rem] bg-white shadow-lg p-6 sm:p-8 has-data-[slot=card-footer]:pb-6 sm:has-data-[slot=card-footer]:pb-8">
                    <div className="flex flex-col items-center mb-2">
                        <div className="flex items-center justify-center gap-2">
                            <img
                                src="/assets/logo.webp"
                                onClick={() => navigate('/')}
                                alt="logo"
                                className="w-10 h-10 object-contain hover:cursor-pointer "
                            />
                            <h1 className="text-2xl font-bold text-blue-900">
                                Request an account
                            </h1>
                        </div>
                        <p className="text-gray-500 text-sm mt-1 text-center">
                            Fill in your details. The barangay will review your request and email you if it is approved.
                        </p>
                    </div>

                    {successMessage ? (
                        <CardContent className="px-0 pb-2">
                            <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-5 text-center text-green-800">
                                <MailCheck size={28} aria-hidden="true" />
                                <p className="text-sm leading-relaxed">{successMessage}</p>
                            </div>
                            <Button
                                className="w-full h-11 mt-4 bg-blue-900 hover:bg-blue-700 text-white hover:cursor-pointer"
                                onClick={() => navigate('/login')}
                            >
                                Back to login
                            </Button>
                        </CardContent>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <CardContent className="px-0">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 content-start">
                                        <Label htmlFor="full_name">Full name</Label>
                                        <Input
                                            id="full_name"
                                            name="full_name"
                                            placeholder="e.g. Juan Dela Cruz"
                                            autoComplete="name"
                                            maxLength={250}
                                            value={form.full_name}
                                            onChange={handleChange}
                                            className={fieldClass}
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2 content-start">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="e.g. juan@gmail.com"
                                            autoComplete="email"
                                            maxLength={250}
                                            value={form.email}
                                            onChange={handleChange}
                                            className={fieldClass}
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2 content-start">
                                        <Label htmlFor="household_number">Household number</Label>
                                        <Input
                                            id="household_number"
                                            name="household_number"
                                            type="number"
                                            inputMode="numeric"
                                            min="1"
                                            placeholder="e.g. 101"
                                            value={form.household_number}
                                            onChange={handleChange}
                                            aria-describedby="household-help"
                                            className={fieldClass}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2 content-start">
                                        <Label htmlFor="zone">Zone</Label>
                                        <select
                                            id="zone"
                                            name="zone"
                                            value={form.zone}
                                            onChange={handleChange}
                                            aria-describedby="household-help"
                                            className={`${selectClass} ${form.zone === '' ? 'text-muted-foreground' : 'text-foreground'}`}
                                            required
                                        >
                                            <option value="">Select zone...</option>
                                            {[1, 2, 3, 4, 5, 6].map(p => (
                                                <option key={p} value={p} className="text-foreground">{p}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <p id="household-help" className="sm:col-span-2 -mt-2 text-xs text-gray-500">
                                        Enter them exactly as the barangay recorded them.
                                    </p>

                                    <div className="grid gap-2 sm:col-span-2">
                                        <Label htmlFor="address">Street address</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            placeholder="e.g. Don Jose St."
                                            autoComplete="street-address"
                                            maxLength={250}
                                            value={form.address}
                                            onChange={handleChange}
                                            className={fieldClass}
                                            required
                                        />
                                    </div>

                                    {/* Honeypot: hidden from people, bots fill it in. */}
                                    <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                                        <label htmlFor="website">Website</label>
                                        <input
                                            id="website"
                                            name="website"
                                            type="text"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={form.website}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <label htmlFor="consent" className="sm:col-span-2 flex min-h-11 items-start gap-3 text-sm text-gray-700 hover:cursor-pointer">
                                        <input
                                            id="consent"
                                            type="checkbox"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            className="mt-0.5 h-5 w-5 shrink-0 accent-blue-900 hover:cursor-pointer"
                                            required
                                        />
                                        <span>I agree that the barangay may use this information to verify my request and create my account.</span>
                                    </label>
                                </div>
                            </CardContent>

                            <CardFooter className="flex-col gap-2 border-t-0 bg-white p-0 pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-blue-900 hover:bg-blue-700 text-white hover:cursor-pointer"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Submit request'}
                                </Button>
                                <Link
                                    to="/login"
                                    className="flex min-h-11 items-center text-sm text-center underline-offset-4 hover:underline hover:cursor-pointer"
                                >
                                    Back to login
                                </Link>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    )
}

export default RequestAccount;
