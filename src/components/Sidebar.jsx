import { useState, useEffect } from 'react';
import API from '@/services/api';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    Home,
    ShieldUser,
    BarChart3,
    ClipboardList,
    LogOut,
    User,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Sidebar as SidebarRoot,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
    useSidebar,
} from '@/components/ui/sidebar';

const getNavItems = (role) => {
    const baseItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    const adminItems = [
        ...baseItems,
        { path: '/reports', label: 'Reports', icon: ClipboardList },
        { path: '/households', label: 'Households', icon: Home },
        { path: '/visualization', label: 'Visualization', icon: BarChart3 },
        { path: '/audit-trail', label: 'Audit Trail', icon: ClipboardList },
        { path: '/admin', label: 'Admin Panel', icon: ShieldUser },
        { path: '/archive', label: 'Archive', icon: Trash2 },
    ];

    const staffItems = [
        ...baseItems,
        { path: '/reports', label: 'Reports', icon: ClipboardList },
        { path: '/households', label: 'Households', icon: Home },
        { path: '/visualization', label: 'Visualization', icon: BarChart3 },
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

const Sidebar = (props) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const location = useLocation();
    const { isMobile, setOpenMobile } = useSidebar();
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

    // On mobile the sidebar is a sheet overlaying the page, so any navigation
    // has to close it; on desktop it is a permanent rail and must stay put.
    const closeOnMobile = () => {
        if (isMobile) setOpenMobile(false);
    };

    const handleNavClick = (item) => {
        if (item.path === '/reports') markReportsSeen();
        closeOnMobile();
    };

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
        <SidebarRoot collapsible="icon" {...props}>
            <SidebarHeader className="p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip="TapAware"
                            onClick={() => {
                                navigate('/');
                                closeOnMobile();
                            }}
                            className="rounded-lg hover:cursor-pointer group-data-[collapsible=icon]:justify-center"
                        >
                            <img
                                src="/assets/logo.webp"
                                alt="logo"
                                className="size-8 shrink-0 rounded-full object-contain"
                            />
                            {/* Hidden outright when collapsed: a grid box defaults to
                                min-width:auto, so it will not shrink to zero in the
                                icon rail and would shove the logo out of the button's
                                overflow-hidden box. */}
                            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-bold text-white">TapAware</span>
                                <span className="truncate text-xs text-sidebar-foreground/70">
                                    Water Quality Monitoring System
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator className="bg-sidebar-border/60" />

            <SidebarContent className="thin-scrollbar">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;

                                return (
                                    <SidebarMenuItem key={item.path}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.label}
                                            className="h-10 rounded-lg font-medium data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
                                        >
                                            <NavLink to={item.path} onClick={() => handleNavClick(item)}>
                                                <Icon className="transition-transform duration-200 group-hover/menu-button:scale-110" />
                                                <span>{item.label}</span>
                                            </NavLink>
                                        </SidebarMenuButton>
                                        {item.path === '/reports' && hasNewReports && (
                                            <SidebarMenuBadge className="top-1/2! -translate-y-1/2">
                                                <span className="size-2 rounded-full bg-red-500" />
                                            </SidebarMenuBadge>
                                        )}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarSeparator className="bg-sidebar-border/60" />

            <SidebarFooter className="p-2">
                <SidebarMenu className="gap-1">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip={user?.name || 'User'}
                            onClick={() => {
                                navigate('/profile');
                                closeOnMobile();
                            }}
                            className="rounded-lg hover:cursor-pointer group-data-[collapsible=icon]:justify-center"
                        >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500">
                                <User className="text-white" />
                            </div>
                            <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate text-sm font-medium text-white">
                                    {user?.name || 'User'}
                                </span>
                                <span className="truncate text-xs text-sidebar-foreground/70 capitalize">
                                    {user?.role || 'resident'}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <ConfirmDialog
                            title="Confirm logout"
                            description="Are you sure you want to logout?"
                            actionText="Logout"
                            actionVariant="destructive"
                            onConfirm={handleLogout}
                        >
                            <SidebarMenuButton
                                tooltip="Logout"
                                className="h-10 rounded-lg hover:cursor-pointer"
                            >
                                <LogOut className="transition-transform duration-200 group-hover/menu-button:scale-110" />
                                <span>Logout</span>
                            </SidebarMenuButton>
                        </ConfirmDialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </SidebarRoot>
    );
};

export default Sidebar;
