import { useState, useEffect } from 'react'
import { Droplets, Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
]

const LandingNavbar = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()
    const [scrolled, setScrolled] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const isLoginPage = location.pathname === '/login'
    const isOnLanding = location.pathname === '/'
    const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin'
    const isResident = user?.role === 'resident'

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
            const section = document.getElementById(location.state.scrollTo)
            if (section) section.scrollIntoView({ behavior: 'smooth' })
            window.history.replaceState({}, document.title)
        }
    }, [location])

    const handleLogout = () => {
        logout()
        setIsOpen(false)
        navigate('/login')
    }

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-blue-900 shadow-lg  ${scrolled ? 'py-3' : 'py-3'
                }`}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white">
                    <img
                        src="/assets/logo.webp"
                        alt="TapAware logo"
                        width={36}
                        height={36}
                        className="w-9 h-9 object-contain rounded-full"
                    />
                    <span className="font-black tracking-tight text-lg">TapAware</span>
                </button>

                {/* Desktop */}
                <div className="hidden md:flex items-center gap-4">
                    {navLinks.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => goToSection(link.id)}
                            className="text-sm font-medium text-blue-100 hover:text-white transition-colors hover:cursor-pointer"
                        >
                            {link.label}
                        </button>
                    ))}

                    {isResident && (
                        <>


                            <button
                                onClick={() => navigate('/profile')}
                                className="text-sm font-medium text-blue-100 hover:text-white transition-colors hover:cursor-pointer underline underline-offset-4"
                            >
                                Hi, {user.name}
                            </button>
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="bg-blue-400 hover:bg-blue-300 text-slate-950 hover:cursor-pointer"
                            >
                                Dashboard
                            </Button>
                            <Button
                                onClick={handleLogout}
                                className="bg-blue-400 hover:bg-blue-300 text-slate-950 flex items-center gap-2 hover:cursor-pointer"
                            >
                                <LogOut size={16} />
                                Logout
                            </Button>
                        </>
                    )}

                    {isStaffOrAdmin && (
                        <>
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="bg-blue-400 hover:bg-blue-300 text-slate-950 hover:cursor-pointer"
                            >
                                Dashboard
                            </Button>
                            <Button
                                onClick={handleLogout}
                                className="bg-blue-400 hover:bg-blue-300 text-slate-950 flex items-center gap-2 hover:cursor-pointer"
                            >
                                <LogOut size={16} />
                                Logout
                            </Button>
                        </>
                    )}

                    {!user && !isLoginPage && (
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-blue-400 hover:bg-blue-300 text-slate-950"
                        >
                            Log in
                        </Button>
                    )}
                </div>

                {/* Mobile toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
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

                        {isResident && (
                            <>

                                <button
                                    onClick={() => { setIsOpen(false); navigate('/profile') }}
                                    className="text-left py-2.5 text-blue-100 hover:text-white text-sm font-medium underline underline-offset-4"
                                >
                                    Hi, {user.name}
                                </button>
                                <button
                                    onClick={() => { setIsOpen(false); navigate('/dashboard') }}
                                    className="text-left py-2.5 text-blue-100 hover:text-white text-sm font-medium"
                                >
                                    Dashboard
                                </button>
                                <Button onClick={handleLogout} className="mt-2 bg-blue-400 hover:bg-blue-300 text-slate-950 flex items-center gap-2 justify-center">
                                    <LogOut size={16} />
                                    Logout
                                </Button>
                            </>
                        )}

                        {isStaffOrAdmin && (
                            <>
                                <button
                                    onClick={() => { setIsOpen(false); navigate('/dashboard') }}
                                    className="text-left py-2.5 text-blue-100 hover:text-white text-sm font-medium"
                                >
                                    Dashboard
                                </button>
                                <Button onClick={handleLogout} className="mt-2 bg-blue-400 hover:bg-blue-300 text-slate-950 flex items-center gap-2 justify-center">
                                    <LogOut size={16} />
                                    Logout
                                </Button>
                            </>
                        )}

                        {!user && !isLoginPage && (
                            <Button
                                onClick={() => { setIsOpen(false); navigate('/login') }}
                                className="mt-2 bg-blue-400 hover:bg-blue-300 text-slate-950"
                            >
                                Log in
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}

export default LandingNavbar