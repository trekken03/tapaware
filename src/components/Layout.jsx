import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div className="relative flex min-h-screen bg-gray-100 overflow-hidden">
            <div className="pointer-events-none fixed inset-30 flex items-center justify-center opacity-10">
                <img
                    src="/assets/logo.jpg"
                    alt=""
                    className="w-[1000px] max-w-[50vw] object-contain"
                />
            </div>

            <Sidebar />

            <div className="relative z-10 flex-1 lg:ml-64">
                <main className="p-4 pt-24 sm:p-6 lg:p-8 lg:pt-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;