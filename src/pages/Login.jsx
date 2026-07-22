import { useState } from "react";
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

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);



    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await API.post('/auth/login', { email, password });
            const role = res.data.user.role;


            login(res.data.token, res.data.user);
            navigate(role === "resident" ? "/dashboard" : "/dashboard");
            toast.success('Welcome back! ' + res.data.user.name + '!')
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
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
                        {/* <Droplets className="text-blue-800"/> */}
                        <h1 className="text-2xl font-bold text-blue-900">
                            TapAware
                        </h1>
                    </div>
                    <p className="text-gray-500 text-sm mt-1 text-center">
                        Barangay Cabalantian Water Quality System
                    </p>
                </div>
                <CardHeader>

                    <CardTitle className="text-center">Login to your account</CardTitle>
                </CardHeader>
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
            </Card>

        </div>
    )
}

export default Login;
