import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Sidebar from './Sidebar'
import FooterLegalLinks from './legal/FooterLegalLinks'

import Navbar from './NavBar';

const Layout = ({ children }) => {
    const { user } = useAuth()
    const isResident = user?.role === 'resident'
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem('sidebar_collapsed') === 'true'
    )

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev
            localStorage.setItem('sidebar_collapsed', String(next))
            return next
        })
    }

    return (
        <div className="relative flex min-h-screen bg-gray-100 overflow-hidden">
            <div className={`pointer-events-none fixed inset-30 flex items-center justify-center opacity-10 ${isResident ? 'pl-15' : collapsed ? '' : 'pl-70'}`}>
                <img
                    src="/assets/logo.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-[40vw] max-w-[1000px] min-w-[250px] h-auto object-contain"
                />
            </div>

            {isResident ? <Navbar /> : <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapsed} />}

            <div
                className={`relative z-10 flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ${isResident ? 'pt-16' : collapsed ? 'lg:ml-0' : 'lg:ml-64'
                    }`}
            >
                <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${isResident ? '' : 'pt-24 lg:pt-8'}`}>
                    {children}
                </main>

                <footer className="px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 border-t border-gray-200">
                    <span>© {new Date().getFullYear()} TapAware - Barangay Cabalantian. All rights reserved.</span>
                    <FooterLegalLinks variant="light" />
                </footer>
            </div>
        </div>
    );
};

export default Layout;