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

// Same rules the server enforces in accountRequest.controller.
const NAME_PATTERN = /^\p{L}[\p{L}\p{M} .'’-]*$/u
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const tidyName = (value) => value.normalize('NFC').trim().replace(/\s+/g, ' ')
const isValidName = (value) => {
    const name = tidyName(value)
    return name.length >= 2 && name.length <= 60
        && NAME_PATTERN.test(name)
        && (name.match(/\p{L}/gu) || []).length >= 2
}
const isValidEmail = (value) => {
    const email = value.trim()
    return email.length <= 250 && EMAIL_PATTERN.test(email)
}
const isValidHousehold = (value) => /^\d{1,3}$/.test(value) && parseInt(value, 10) >= 1
const isValidAddress = (value) => value.trim().length >= 5
const hintClass = 'text-xs text-red-600'

const RequestAccount = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [form, setForm] = useState(emptyForm);
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [touched, setTouched] = useState({});

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate]);

    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;

        if (name === 'household_number') {
            value = value.replace(/\D/g, '').slice(0, 3);
        }
        if (name === 'full_name') {
            value = value.normalize('NFC')
                .replace(/[^\p{L}\p{M} .'’-]/gu, '')
                .replace(/^ +/, '')
                .replace(/ {2,}/g, ' ')
                .slice(0, 60);
        }

        setForm({ ...form, [name]: value });
    }

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
    }

    const nameInvalid = !isValidName(form.full_name)
    const emailInvalid = !isValidEmail(form.email)
    const householdInvalid = !isValidHousehold(form.household_number)
    const addressInvalid = !isValidAddress(form.address)
    const isFormValid = !nameInvalid && !emailInvalid && !householdInvalid
        && form.zone !== '' && !addressInvalid && consent
    const submitDisabled = loading || !isFormValid

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (submitDisabled) return
        setLoading(true)

        try {
            const res = await API.post('/account-requests', { ...form, consent });
            setSuccessMessage(res.data.message)
            setForm(emptyForm)
            setConsent(false)
            setTouched({})
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
                                            maxLength={60}
                                            value={form.full_name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            aria-invalid={touched.full_name && nameInvalid ? true : undefined}
                                            aria-describedby={touched.full_name && nameInvalid ? 'full_name-hint' : undefined}
                                            className={fieldClass}
                                            required
                                        />
                                        {touched.full_name && nameInvalid && (
                                            <p id="full_name-hint" className={hintClass}>Use letters, spaces, hyphens, apostrophes or periods only.</p>
                                        )}
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
                                            onBlur={handleBlur}
                                            aria-invalid={touched.email && emailInvalid ? true : undefined}
                                            aria-describedby={touched.email && emailInvalid ? 'email-hint' : undefined}
                                            className={fieldClass}
                                            required
                                        />
                                        {touched.email && emailInvalid && (
                                            <p id="email-hint" className={hintClass}>Enter a valid email address.</p>
                                        )}
                                    </div>

                                    <div className="grid gap-2 content-start">
                                        <Label htmlFor="household_number">Household number</Label>
                                        <Input
                                            id="household_number"
                                            name="household_number"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={3}
                                            placeholder="e.g. 101"
                                            value={form.household_number}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            aria-invalid={touched.household_number && householdInvalid ? true : undefined}
                                            aria-describedby={touched.household_number && householdInvalid ? 'household-help household_number-hint' : 'household-help'}
                                            className={fieldClass}
                                            required
                                        />
                                        {touched.household_number && householdInvalid && (
                                            <p id="household_number-hint" className={hintClass}>Enter 1 to 3 digits.</p>
                                        )}
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
                                            onBlur={handleBlur}
                                            aria-invalid={touched.address && addressInvalid ? true : undefined}
                                            aria-describedby={touched.address && addressInvalid ? 'address-hint' : undefined}
                                            className={fieldClass}
                                            required
                                        />
                                        {touched.address && addressInvalid && (
                                            <p id="address-hint" className={hintClass}>Enter your street address.</p>
                                        )}
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
                                    className="w-full h-11 bg-blue-900 hover:bg-blue-700 text-white hover:cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-900"
                                    disabled={submitDisabled}
                                    aria-describedby={!isFormValid ? 'submit-help' : undefined}
                                >
                                    {loading ? 'Sending...' : 'Submit request'}
                                </Button>
                                {!isFormValid && (
                                    <p id="submit-help" className="text-xs text-gray-500">Complete all fields to continue.</p>
                                )}
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
