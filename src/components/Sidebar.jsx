import { useState, useEffect } from 'react';
import API from '@/services/api';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Home,
    Droplets,
    ShieldUser,
    FileText,
    BarChart3,
    ClipboardList,
    LogOut,
    User,
    Menu,
    X,
    ChevronDown,
} from 'lucide-react';

const getNavItems = (role) => {
    const baseItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        {
            path: '/reports',
            label: 'Reports',
            icon: FileText,
            children: [
                { path: '/reports?status=pending', label: 'Pending' },
                { path: '/reports?status=investigating', label: 'Investigating' },
                { path: '/reports?status=resolved', label: 'Resolved' },
            ],
        },
    ];

    const householdsItem = {
        path: '/households',
        label: 'Households',
        icon: Home,
        children: [
            { path: '/households?status=safe', label: 'Safe' },
            { path: '/households?status=pending', label: 'Pending Reports' },
            { path: '/households?status=flagged', label: 'Flagged' },
        ],
    };

    const tdsItem = {
        path: '/tds',
        label: 'TDS Readings',
        icon: Droplets,
        children: [
            { path: '/tds?status=safe', label: 'Safe' },
            { path: '/tds?status=mild', label: 'Mild' },
            { path: '/tds?status=danger', label: 'Danger' },
        ],
    };

    const adminItems = [
        ...baseItems,
        householdsItem,
        tdsItem,
        { path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { path: '/audit-trail', label: 'Audit Trail', icon: ClipboardList },
        { path: '/admin', label: 'Admin Panel', icon: ShieldUser },
    ];

    const staffItems = [
        ...baseItems,
        householdsItem,
        tdsItem,
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
const getInitialExpanded = () => {
    return localStorage.getItem('sidebar_expanded') || null;
};

const Sidebar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedItem, setExpandedItem] = useState(getInitialExpanded);
    const navItems = getNavItems(user?.role);

    const [hasNewReports, setHasNewReports] = useState(false);

    useEffect(() => {
        if (user?.role === 'resident') return; // residents don't need this indicator
        checkNewReports();
    }, [user?.role]);

    const checkNewReports = async () => {
        try {
            const res = await API.get('/reports');
            if (res.data.length === 0) return;

            const latestReportTime = new Date(res.data[0].created_at).getTime();
            const lastSeen = localStorage.getItem('reports_last_seen');
            const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

            setHasNewReports(latestReportTime > lastSeenTime);
        } catch (error) {
            console.log('Error checking new reports:', error);
        }
    };

    const markReportsSeen = () => {
        localStorage.setItem('reports_last_seen', new Date().toISOString());
        setHasNewReports(false);
    };

    const handleExpandToggle = (path) => {
        const newValue = expandedItem === path ? null : path;
        setExpandedItem(newValue);
        if (newValue) {
            localStorage.setItem('sidebar_expanded', newValue);
        } else {
            localStorage.removeItem('sidebar_expanded');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sidebar_expanded');
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
                className={`w-64 h-screen max-h-screen overflow-y-auto bg-blue-950 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
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
                <div className="p-6 pb-4">
                    <div onClick={() => navigate('/')} className="flex items-center gap-3 hover:cursor-pointer">
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

                <Separator className="bg-blue-950" />

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto pb-6 thin-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const hasChildren = item.children && item.children.length > 0;
                        const isOnThisPage = location.pathname === item.path;
                        const isExpanded = expandedItem === item.path || isOnThisPage;

                        if (hasChildren) {
                            return (
                                <div key={item.path}>
                                    <div className="flex items-center rounded-lg text-blue-200 hover:bg-blue-950 hover:text-white transition-all duration-200">
                                        <NavLink
                                            to={item.path}
                                            onClick={() => {
                                                setIsOpen(false)
                                                if (item.path === '/reports') markReportsSeen()
                                            }}
                                            className={({ isActive }) =>
                                                `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive && !isOnThisPage === false && location.search === ''
                                                    ? 'text-white'
                                                    : ''
                                                }`
                                            }
                                        >
                                            <Icon size={18} />
                                            {item.label}
                                            {item.path === '/reports' && hasNewReports && (
                                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                            )}
                                        </NavLink>
                                        <button
                                            onClick={() => handleExpandToggle(item.path)}
                                            className="px-3 py-2.5"
                                        >
                                            <ChevronDown
                                                size={16}
                                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            {item.children.map((child) => (
                                                <NavLink
                                                    key={child.path}
                                                    to={child.path}
                                                    onClick={() => setIsOpen(false)}
                                                    className={({ isActive }) =>
                                                        `block px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isActive
                                                            ? 'bg-white/5 text-white hover:bg-white hover:text-black'
                                                            : 'bg-white/5 text-white hover:bg-white hover:text-black'
                                                        }`
                                                    }
                                                >
                                                    {child.label}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

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
                <div className="p-4 pt-2 pb-6 border-t border-blue-800/50 mt-2">
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