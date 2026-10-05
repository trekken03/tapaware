import { useState, useEffect } from 'react'
import { Droplets, Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'

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
        try {
            logout();
            navigate('/login');
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to logout');
        }
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#142f72]/95 shadow-[0_8px_30px_-18px_rgba(5,20,55,0.75)] backdrop-blur-md transition-all duration-300 ${scrolled ? 'py-3' : 'py-3'
                }`}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
                <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-white">
                    <img
                        src="/assets/figure-main-logo.png"
                        alt="TapAware logo"
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 translate-y-[2px] rounded-full object-contain"
                    />
                    <span className="text-lg font-black leading-none tracking-tight">TapAware</span>
                </button>

                {/* Desktop */}
                <div className="hidden md:flex items-center gap-4">
                    {navLinks.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => goToSection(link.id)}
                            className="text-sm font-medium rounded-full text-blue-100 transition-colors hover:cursor-pointer hover:text-cyan-100"
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
                                className=" rounded-full bg-white hover:bg-cyan-50 text-[#143472] hover:cursor-pointer"
                            >
                                Dashboard
                            </Button>
                            <ConfirmDialog
                                title="Confirm logout"
                                description="Are you sure you want to logout?"
                                actionText="Logout"
                                actionVariant="destructive"
                                onConfirm={handleLogout}
                            >
                                <Button

                                    className=" rounded-full bg-white hover:bg-cyan-50 text-[#143472] flex items-center gap-2 hover:cursor-pointer"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </Button>
                            </ConfirmDialog>

                        </>
                    )}

                    {isStaffOrAdmin && (
                        <>
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="bg-white hover:bg-cyan-50 text-[#143472] hover:cursor-pointer rounded-full"
                            >
                                Dashboard
                            </Button>
                            <ConfirmDialog
                                title="Confirm logout"
                                description="Are you sure you want to logout?"
                                actionText="Logout"
                                actionVariant="destructive"
                                onConfirm={handleLogout}
                            >
                                <Button

                                    className="bg-white rounded-full hover:bg-cyan-50 text-[#143472] flex items-center gap-2 hover:cursor-pointer"
                                >
                                    <LogOut size={16} />
                                    Logout
                                </Button>
                            </ConfirmDialog>
                        </>
                    )}

                    {!user && !isLoginPage && (
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-white hover:bg-cyan-50 text-[#143472] rounded-full"
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
                <div className="mt-3 border-t border-white/10 bg-[#102765] md:hidden">
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
                                    className="mt-2 bg-white hover:bg-cyan-50 text-[#143472] flex items-center gap-2 font-medium rounded-full justify-center h-7.5"
                                >
                                    Dashboard
                                </button>
                                <ConfirmDialog
                                    title="Confirm logout"
                                    description="Are you sure you want to logout?"
                                    actionText="Logout"
                                    actionVariant="destructive"
                                    onConfirm={handleLogout}
                                >
                                    <Button

                                        className="mt-2 bg-white hover:bg-cyan-50 text-[#143472] flex font-medium items-center gap-2 rounded-full justify-center"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </Button>
                                </ConfirmDialog>

                            </>
                        )}

                        {isStaffOrAdmin && (
                            <>
                                <button
                                    onClick={() => { setIsOpen(false); navigate('/dashboard') }}
                                    className="mt-2 h-7.5 bg-white hover:bg-cyan-50 text-[#143472] flex font-medium items-center gap-2 rounded-full justify-center"
                                >
                                    Dashboard
                                </button>
                                <ConfirmDialog
                                    title="Confirm logout"
                                    description="Are you sure you want to logout?"
                                    actionText="Logout"
                                    actionVariant="destructive"
                                    onConfirm={handleLogout}
                                >
                                    <Button

                                        className="rounded-full mt-2 bg-white hover:bg-cyan-50 text-[#143472] flex items-center gap-2 justify-center"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </Button>
                                </ConfirmDialog>
                            </>
                        )}

                        {!user && !isLoginPage && (
                            <Button
                                onClick={() => { setIsOpen(false); navigate('/login') }}
                                className="mt-2 bg-white hover:bg-cyan-50 text-[#143472]"
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