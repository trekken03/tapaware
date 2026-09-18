import { useAuth } from '@/context/AuthContext'
import Sidebar from './Sidebar'
import FooterLegalLinks from './legal/FooterLegalLinks'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'

import Navbar from './NavBar';

// The shadcn SidebarProvider persists the open/closed state in the `sidebar_state`
// cookie. There is no server render to read it on, so seed the initial state from
// the cookie here; otherwise the sidebar always starts expanded on reload.
const getDefaultSidebarOpen = () => {
    const match = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/)
    return match ? match[1] === 'true' : true
}

// The outer layer spans the page's full scrollable height; the inner one sticks to
// the viewport, so the logo stays centred on screen whatever the content height is.
// Centring on the outer layer instead put the logo halfway down the *document*, which
// is on screen for a short page (Staff Management) and far below the fold for a long
// one (User Management). overflow-hidden belongs on the sticky element, not above it:
// an ancestor with overflow-hidden becomes the scroll container and kills the sticking.
const Watermark = () => (
    <div className="pointer-events-none absolute inset-0 z-0">
        <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden">
            <img
                src="/assets/logo.webp"
                alt=""
                loading="lazy"
                decoding="async"
                className="w-[40vw] max-w-[1000px] min-w-[250px] h-auto object-contain opacity-10"
            />
        </div>
    </div>
)

const PageFooter = () => (
    <footer className="relative z-10 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 border-t border-gray-200">
        <span>© {new Date().getFullYear()} TapAware - Barangay Cabalantian. All rights reserved.</span>
        <FooterLegalLinks variant="light" />
    </footer>
)

const Layout = ({ children }) => {
    const { user } = useAuth()
    const isResident = user?.role === 'resident'

    if (isResident) {
        return (
            <div className="relative flex min-h-screen bg-gray-100">
                <Watermark />
                <Navbar />
                <div className="relative z-10 flex-1 flex flex-col min-h-screen pt-16">
                    <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
                    <PageFooter />
                </div>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={getDefaultSidebarOpen()}>
                <Sidebar />
                <SidebarInset className="min-h-svh min-w-0 bg-gray-100">
                    <Watermark />

                    {/* The toggle floats over the page rather than sitting in a bar:
                        no background, no border. It stays in normal flow so it can
                        never overlap a page's heading. */}
                    <div className="relative z-20 flex shrink-0 items-center gap-2 px-4 pt-2 sm:px-6 sm:pt-3 lg:px-8 lg:pt-4">
                        {/* Solid navy tile matching the sidebar itself. bg-clip-border
                            undoes the button base's bg-clip-padding, which would otherwise
                            leave the 1px transparent border showing the page grey as a
                            ring around the tile. */}
                        <SidebarTrigger className="size-9 rounded-[4px] bg-sidebar bg-clip-border text-white shadow-md hover:bg-sidebar-border hover:text-blue-900 hover:cursor-pointer [&_svg]:size-5" />
                        <div className="flex items-center gap-2 md:hidden">
                            <Separator orientation="vertical" className="h-4" />
                            <img
                                src="/assets/logo.webp"
                                alt="logo"
                                className="size-7 rounded-full object-contain"
                            />
                            <span className="font-bold leading-none">TapAware</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 px-4 pt-3 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
                        {children}
                    </div>

                    <PageFooter />
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
};

export default Layout;
