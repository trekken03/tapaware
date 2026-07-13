import { useState, useEffect } from 'react'
import { Droplets, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

import { useLocation } from 'react-router-dom';

const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
]


const LandingNavbar = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';
    const { user } = useAuth();
    const isOnLanding = location.pathname === '/';

    const goToSection = (id) => {
        setIsOpen(false)
        if (isOnLanding) {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
        } else {
            navigate('/', { state: { scrollTo: id } })
        }
    }



    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (location.state?.scrollTo) {
            const section = document.getElementById(location.state.scrollTo);

            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }

            // Clear the state so it doesn't scroll again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-blue-900 backdrop-blur-sm shadow-lg py-3'
                : 'bg-blue-900 backdrop-blur-sm shadow-lg py-3'
                }`}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-white"
                >
                    <img
                        src="/assets/logo.jpg"
                        alt="TapAware logo"
                        className="w-9 h-9 object-contain rounded-full"
                    />
                    <span className="font-black tracking-tight text-lg">TapAware</span>
                </button>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => goToSection(link.id)}
                            className="text-sm font-medium text-blue-100 hover:text-white transition-colors hover:cursor-pointer"
                        >
                            {link.label}
                        </button>
                    ))}
                    {!isLoginPage && (
                        user ? (
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="bg-blue-500 hover:bg-blue-300 text-slate-950 hover:cursor-pointer"
                            >
                                Dashboard
                            </Button>
                        ) : (
                            <Button
                                onClick={() => navigate('/login')}
                                className="bg-blue-400 hover:bg-blue-300 text-slate-950 hover:cursor-pointer"
                            >
                                Login
                            </Button>
                        )
                    )}

                </div>

                {/* Mobile toggle */}

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden text-white p-1"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden bg-[#0a1a33] border-t border-white/10 mt-3">
                    <div className="flex flex-col px-4 py-4 gap-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => goToSection(link.id)}

                                className="text-left py-2.5 text-blue-100 hover:text-white text-sm font-medium"
                            >
                                {link.label}
                            </button>
                        ))}
                        {!isLoginPage && (
                            user ? (
                                <Button
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-blue-400 hover:bg-blue-300 text-slate-950"
                                >
                                    Dashboard
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => navigate('/login')}
                                    className="bg-blue-400 hover:bg-blue-300 text-slate-950"
                                >
                                    Login
                                </Button>
                            )
                        )}


                    </div>
                </div>
            )}
        </nav>
    )
}

export default LandingNavbar