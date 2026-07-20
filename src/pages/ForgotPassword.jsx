import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplet } from "lucide-react";
import API from "@/services/api";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { MailCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import LandingNavbar from "@/components/NavBar";

const ForgotPass = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [cooldown, setCooldown] = useState(0);




    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await API.post('/auth/forgot-password', { email });
            setSubmitted(true)
            setCooldown(300)
            toast.success('If that user exist password reset link has been sent successfully')
        } catch (err) {
            const message = err.response?.data?.message || 'Something went wrong'
            setError(message)
            toast.error(err.response?.data?.message || 'Something went wrong')
        } finally {

            setLoading(false)
        }
    }
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown]);

    return (

        <div className="relative min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <LandingNavbar />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img
                    src="/assets/logo.webp"
                    alt=""
                    className="w-[700px] opacity-10 object-contain"
                />
            </div>

            <Card className="relative z-10 w-full max-w-sm bg-white shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center justify-center gap-2">
                        <img
                            src="/assets/logo.webp"
                            onClick={() => navigate('/')}
                            alt="logo"
                            className="w-10 h-10 object-contain hover:cursor-pointer "
                        />
                        {/* <Droplet className="text-blue-800" /> */}
                        <h1 className="text-2xl font-bold text-blue-900">
                            Forgot Password
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-1 text-center">
                        Barangay Cabalantian Water Quality System
                    </p>
                </div>

                {submitted ? (
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                data={email}
                                disabled
                                required
                            />
                        </div>

                        <Button
                            className="w-full mt-4 bg-blue-900 hover:bg-blue-700 text-white"
                            disabled={cooldown > 0}
                            onClick={handleSubmit}
                        >
                            {cooldown > 0
                                ? `Resend link in ${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
                                : 'Resend link'}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => navigate('/login')}
                        >
                            Back to Login
                        </Button>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle className="text-center">Enter your email for reset link</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent>
                                <div className="flex flex-col gap-6">
                                    {error && (
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Error</AlertTitle>
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex-col gap-2 border-t-0">
                                <Button
                                    type="submit"
                                    className="w-full bg-blue-900 hover:bg-blue-700 text-white"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Link'}
                                </Button>
                                <Link to="/login" className="text-sm text-center underline-offset-4 hover:underline">
                                    Back to Login
                                </Link>
                            </CardFooter>
                        </form>
                    </>
                )}
            </Card>
        </div>
    )
}

export default ForgotPass;