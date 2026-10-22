import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import API from "@/services/api";
import LandingNavbar from "@/components/NavBar";

const VerifyEmail = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        try {
            await API.post('/auth/verify-email', { token });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to verify this email. Please ask your administrator to resend the link.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[url('/assets/mobile_version.jpg')] bg-cover bg-center bg-no-repeat md:bg-[url('/assets/forgot_and_resetp_.jpg')] flex items-center justify-center p-4">
            <LandingNavbar />
            <Card className="relative z-10 w-full max-w-sm bg-white shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center justify-center gap-2">
                        <img
                            src="/assets/logo.webp"
                            onClick={() => navigate('/')}
                            alt="logo"
                            className="w-10 h-10 object-contain hover:cursor-pointer"
                        />
                        <h1 className="text-2xl font-bold text-blue-900">Verify Email</h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-1 text-center">
                        Barangay Cabalantian Water Quality System
                    </p>
                </div>

                {!token ? (
                    <CardContent>
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Invalid link</AlertTitle>
                            <AlertDescription>This verification link is invalid or missing a token.</AlertDescription>
                        </Alert>
                        <Link to="/login" className="block text-sm text-center mt-4 underline-offset-4 hover:underline">
                            Go to Login
                        </Link>
                    </CardContent>
                ) : success ? (
                    <CardContent className="space-y-4">
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>Your email is verified. You can now log in.</AlertDescription>
                        </Alert>
                        <Button
                            className="w-full bg-blue-900 hover:bg-blue-700 text-white"
                            onClick={() => navigate('/login')}
                        >
                            Go to Login
                        </Button>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle className="text-center">Confirm your email</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-center text-sm text-gray-600">
                                Confirm your email address to activate your TapAware account.
                            </p>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Verification failed</AlertTitle>
                                    <AlertDescription>
                                        {error}
                                        {!error.toLowerCase().includes('resend') && ' Ask your administrator to resend the link.'}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Button
                                className="w-full bg-blue-900 hover:bg-blue-700 text-white"
                                onClick={handleVerify}
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify my email'}
                            </Button>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
};

export default VerifyEmail;
