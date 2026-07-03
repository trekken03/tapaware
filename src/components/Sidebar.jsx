import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Home,
    Droplets,
    FileText,
    BarChart3,
    Settings,
    ClipboardList,
    LogOut,
    User,
    Menu,
    X,
} from 'lucide-react';

const getNavItems = (role) => {
    const baseItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/reports', label: 'Reports', icon: FileText },
    ];

    const adminItems = [
        ...baseItems,
        { path: '/households', label: 'Households', icon: Home },
        { path: '/tds', label: 'TDS Readings', icon: Droplets },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/audit-trail', label: 'Audit Trail', icon: ClipboardList },
        { path: '/admin', label: 'Admin Panel', icon: Settings },
    ];

    const staffItems = [
        ...baseItems,
        { path: '/households', label: 'Households', icon: Home },
        { path: '/tds', label: 'TDS Readings', icon: Droplets },
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    ];

    const residentItems = baseItems;

    switch (role) {
        case 'admin':
            return adminItems;
        case 'staff':
            return staffItems;
        case 'resident':
            return residentItems;
        default:
            return baseItems;
    }
};

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = getNavItems(user?.role);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-blue-950 flex items-center justify-between px-4 z-40">
                <div className="flex items-center gap-2">
                    <img
                        src="/assets/logo.jpg"
                        alt="logo"
                        className="w-8 h-8 object-contain"
                    />
                    <h1 className="text-white font-bold text-lg leading-none">TapAware</h1>
                </div>
                <button onClick={() => setIsOpen(true)} className="text-white p-2">
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`w-64 min-h-screen bg-blue-950 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Close button (mobile only) */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="lg:hidden absolute top-4 right-4 text-white p-1"
                >
                    <X size={20} />
                </button>

                {/* Logo section */}
                <div className="p-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/assets/logo.jpg"
                            alt="logo"
                            className="w-10 h-10 object-contain"
                        />
                        <div>
                            <h1 className="text-white font-bold text-lg leading-none">TapAware</h1>
                            <p className="text-blue-300 text-xs">Water Quality Monitoring System</p>
                        </div>
                    </div>
                </div>

                <Separator className="bg-blue-800" />

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-blue-200 hover:bg-blue-900 hover:text-white'
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <Separator className="bg-blue-800" />


                {/* User section */}
                <div className="p-4">
                    <div
                        className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-50 transition-opacity"
                        onClick={() => {
                            navigate('/profile')
                            setIsOpen(false)
                        }}
                    >
                        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
                            <User size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-blue-300 text-xs capitalize">
                                {user?.role || 'resident'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-200 hover:bg-blue-900 hover:text-white text-sm transition-all duration-200"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;