import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LayoutDashboard, FileText, User, LogOut, Menu, X, Droplets } from 'lucide-react'

const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/reports', label: 'My Reports', icon: FileText },
    { path: '/profile', label: 'Profile', icon: User },
]

const ResidentNavbar = () => {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-blue-900 shadow-lg h-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-white"
                >
                    <img src="/assets/logo.webp" alt="TapAware logo" className="w-8 h-8 object-contain rounded-full" />
                    <span className="font-black tracking-tight text-lg">TapAware</span>
                </button>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-2">
                    {navLinks.map((link) => {
                        const Icon = link.icon
                        return (
                            <NavLink
                                key={link.path}
                                to={link.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-700 text-white'
                                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                                    }`
                                }
                            >
                                <Icon size={16} />
                                {link.label}
                            </NavLink>
                        )
                    })}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-500 text-black hover:cursor-pointer hover:bg-blue-600 hover:text-white transition-colors ml-2"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>

                {/* Mobile toggle */}
                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white p-1">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden bg-blue-900 border-t border-blue-800">
                    <div className="flex flex-col px-4 py-3 gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon
                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? 'bg-blue-700 text-white'
                                            : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                                        }`
                                    }
                                >
                                    <Icon size={16} />
                                    {link.label}
                                </NavLink>
                            )
                        })}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-800 hover:text-white transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default ResidentNavbar