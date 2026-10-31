import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import API from "@/services/api";
import { Link } from "react-router-dom";
import { toast } from 'sonner'
import LandingNavbar from "@/components/NavBar";
import SceneMascot from "@/components/SceneMascot";

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });

        }

    }, [isAuthenticated, navigate]);



    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await API.post('/auth/login', { email, password });

            login(res.data.user);
            navigate("/dashboard");
            toast.success('Welcome back! ' + res.data.user.name + '!')
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }



    return (
        <div className="relative min-h-screen bg-[url('/assets/mobile_version.jpg')] bg-cover bg-center bg-no-repeat md:bg-[url('/assets/new_login_bg.jpg')] flex items-center justify-end p-4 sm:pr-8 lg:pr-[7%] overflow-hidden">
            <LandingNavbar />

            {/* Mascot glued to the background scene (left of the card). Desktop only.
                x = horizontal position, size = width (both as a fraction of the background image) */}
            <SceneMascot src="/assets/login_figure.png" x={0.45} size={0.21} className="hidden md:block" />

            <Card className="relative z-10 w-full max-w-xl bg-white shadow-lg">
                <div className="flex flex-col items-center mb-6">
                    <div className="flex items-center justify-center gap-2">
                        <img
                            src="/assets/logo.webp"
                            onClick={() => navigate('/')}
                            alt="logo"
                            className="w-10 h-10 object-contain hover:cursor-pointer "
                        />


                    </div>
                    <p className="text-blue-900 font-bold text-xl mt-1 text-center">
                        Welcome!
                    </p>
                    <p className="text-blue-900  text-lg mt-1 text-center">
                        Login to your account
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <CardContent>

                        <div className="flex flex-col gap-6 ">


                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
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


                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>

                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                            </div>
                            <Link
                                to="/forgot-password"
                                className="text-center inline-block text-sm underline-offset-4 hover:underline">
                                Forgot your password?
                            </Link>

                        </div>

                    </CardContent>

                    <CardFooter className="flex-col gap-2 border-t-0">
                        <Button
                            type="submit"
                            className="w-full bg-blue-900 hover:bg-blue-700 text-white"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Login'}
                        </Button>
                    </CardFooter>
                </form>
                <Link
                    to="/request-account"
                    className="text-center inline-block text-sm underline-offset-4 hover:underline pb-4">
                    Don't have an account? Request one
                </Link>
            </Card>

        </div>
    )
}

export default Login;