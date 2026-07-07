import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="relative flex min-h-screen bg-gray-100 overflow-hidden">
            <div className="pointer-events-none fixed inset-30 flex items-center justify-center opacity-10 pl-70">
                <img
                    src="/assets/logo.jpg"
                    alt=""
                    className="w-[1000px] max-w-[50vw] object-contain"
                />
            </div>

            <Sidebar />

            <div className="relative z-10 flex-1 lg:ml-64 flex flex-col min-h-screen">
                <main className="flex-1 p-4 pt-24 sm:p-6 lg:p-8 lg:pt-8">
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