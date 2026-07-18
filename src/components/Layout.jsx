import { useAuth } from '@/context/AuthContext'
import Sidebar from './Sidebar'

import LandingNavbar from './LandingNavbar';

const Layout = ({ children }) => {
    const { user } = useAuth()
    const isResident = user?.role === 'resident'

    return (
        <div className="relative flex min-h-screen bg-gray-100 overflow-hidden">
            <div className={`pointer-events-none fixed inset-30 flex items-center justify-center opacity-10 ${isResident ? 'pl-15' : 'pl-70'}`}>
                <img
                    src="/assets/logo.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-[1000px] max-w-[50vw] object-contain"
                />
            </div>

            {isResident ? <LandingNavbar /> : <Sidebar />}

            <div
                className={`relative z-10 flex-1 flex flex-col min-h-screen ${isResident ? 'pt-16' : 'lg:ml-64'
                    }`}
            >
                <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${isResident ? '' : 'pt-24 lg:pt-8'}`}>
                    {children}
                </main>

                <footer className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs sm:text-sm text-gray-500 border-t border-gray-200">
                    © {new Date().getFullYear()} TapAware - Barangay Cabalantian. All rights reserved.
                </footer>
            </div>
        </div>
    );
};

export default Layout;