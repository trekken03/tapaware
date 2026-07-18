import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import LandingNavbar from "@/components/LandingNavbar";

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        setLoading(true)
        try {
            await API.post('/auth/reset-password', { token, password });
            setSuccess(true)
            toast.success('Password changed successfully')
        } catch (err) {
            const message = err.response?.data?.message || 'Something went wrong'
            setError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <LandingNavbar />
                <Card className="w-full max-w-sm shadow-lg">
                    <CardContent className="pt-6">
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Invalid link</AlertTitle>
                            <AlertDescription>This reset link is invalid or missing a token.</AlertDescription>
                        </Alert>
                        <Link to="/forgot-password" className="block text-sm text-center mt-4 underline-offset-4 hover:underline">
                            Request a new reset link
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

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
                            Reset Password
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-1 text-center">
                        Barangay Cabalantian Water Quality System
                    </p>
                </div>

                {success ? (
                    <CardContent>
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            className="w-full mt-4 bg-blue-900 hover:bg-blue-700 text-white"
                            onClick={() => navigate('/login')}
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle className="text-center">Enter your new password</CardTitle>
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
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Enter new password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </CardFooter>
                        </form>
                    </>
                )}
            </Card>
        </div>
    )
}

export default ResetPassword;