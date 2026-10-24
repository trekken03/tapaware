import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import PokeMascot from '@/components/PokeMascot'
import Sidebar from './Sidebar'
import FooterLegalLinks from './legal/FooterLegalLinks'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Droplets } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import Navbar from './NavBar';

// The shadcn SidebarProvider persists the open/closed state in the `sidebar_state`
// cookie. There is no server render to read it on, so seed the initial state from
// the cookie here; otherwise the sidebar always starts expanded on reload.
const getDefaultSidebarOpen = () => {
    const match = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/)
    return match ? match[1] === 'true' : true
}

// ─── Layout background: change these to make the scenes taller / shorter ───────
// Heights are fixed (not tied to the window width), so zooming out or using a big
// monitor no longer blows the pictures up. clamp(min, preferred, max): the picture is
// `preferred` tall, but never below `min` or above `max`. Bigger number = taller.
const TOP_SCENE_H = 'clamp(210px, 17vw, 330px)' // sky + water + mascot behind the page header
const WAVE_H = 'clamp(100px, 9vw, 180px)'        // waves above the footer
const WAVE_GAP = 'mt-6 sm:mt-10'                 // empty space between the page content and the waves

// layout_bg_top_wo_mascot.jpg is 2576 x 664 px. Everything below that is placed "inside"
// the picture is measured in the picture's own pixels, and converted to the real size
// with the scene height, so it always stays in the same spot of the scene.
const PIC_W = 2576
const PIC_H = 664
const TOP_RATIO = PIC_W / PIC_H
const px = (n) => `calc(var(--scene-h) * ${(n / PIC_H).toFixed(5)})`
const fromRight = (x) => px(PIC_W - x) // distance from the picture's right edge

// Where the clickable mascot stands (box of /assets/login_figure.png, in picture pixels)
const MASCOT = { left: 2237.8, top: 108.4, size: 413.2 }
// The mascot's feet are at ~96.7% of its image height: that's the point it squashes around
const MASCOT_FEET = '50% 96.7%'
// The soft shadow on the water under its feet (the shadow is drawn here now, not in the picture)
const SHADOW = { cx: 2435, cy: 490, w: 224, h: 30 }

// Page colour for the sidebar layout. It matches the top row of the wave picture
// (#eff3fb), so the waves melt into the page without a visible edge.
const PAGE_BG = 'bg-[#eff3fb]'

// layout_bg_top.jpg ends in pure white while the page is #eff3fb, so its bottom edge is
// faded out; the waves get a tiny fade at their top for the same reason.
const FADE_BOTTOM = 'linear-gradient(to bottom, #000 88%, transparent 100%)'
const FADE_TOP = 'linear-gradient(to bottom, transparent 0%, #000 6%)'

// The outer layer spans the page's full scrollable height; the inner one sticks to
// the viewport, so the logo stays centred on screen whatever the content height is.
// Centring on the outer layer instead put the logo halfway down the *document*, which
// is on screen for a short page (Staff Management) and far below the fold for a long
// one (User Management). overflow-hidden belongs on the sticky element, not above it:
// an ancestor with overflow-hidden becomes the scroll container and kills the sticking.
// (Still used by the resident layout.)
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

// ── Click-through helpers for the mascot ─────────────────────────────────────────────
// The mascot lives behind the page content, and the content layer covers it, so the
// browser never delivers clicks to it. Instead the layout listens for clicks on the whole
// area and asks two questions: (1) is the click on a solid (non-transparent) pixel of the
// mascot? (2) is there only "empty space" in front of it (no card, text, button, ...)?
// If both are yes, the mascot gets poked.

// True if the element, and everything it sits in (up to `root`), is just empty space.
const isEmptySpace = (el, root) => {
    for (let n = el; n && n !== root; n = n.parentElement) {
        if (n.matches('a,button,input,select,textarea,label,summary,img,svg,canvas,video,table,[role="button"],[role="tab"],[contenteditable="true"]')) return false
        for (const c of n.childNodes) {
            if (c.nodeType === 3 && c.textContent.trim()) return false // has its own text
        }
        const cs = getComputedStyle(n)
        if (cs.backgroundImage !== 'none') return false
        if (!/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor)) return false
        if (cs.boxShadow !== 'none') return false
        if (['Top', 'Right', 'Bottom', 'Left'].some((side) => parseFloat(cs[`border${side}Width`]) > 0)) return false
    }
    return true
}

// Sky + water + mascot scene behind the page header. It scrolls away with the page.
// The picture keeps its proportions at the height set above and is pinned to the right,
// so the mascot is always visible. On wider screens the water/sky continues to the left
// from layout_bg_top_tile.jpg (a mirrored strip of the picture's left side).
export const TopScene = () => {
    const sceneRef = useRef(null)
    const imgRef = useRef(null)
    const pokeRef = useRef(null)
    const alpha = useRef(null)

    // Read the mascot PNG's transparency once, so clicks only count on the mascot itself
    useEffect(() => {
        const img = new Image()
        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            ctx.drawImage(img, 0, 0)
            alpha.current = { w: canvas.width, h: canvas.height, data: ctx.getImageData(0, 0, canvas.width, canvas.height).data }
        }
        img.src = '/assets/login_figure.png'
    }, [])

    useEffect(() => {
        const root = sceneRef.current?.parentElement // the page area that holds scene + content
        if (!root) return

        const onMascot = (x, y) => {
            const img = imgRef.current
            const a = alpha.current
            if (!img || !a) return false
            const r = img.getBoundingClientRect() // includes the squash/stretch animation
            if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false
            const ix = Math.floor(((x - r.left) / r.width) * a.w)
            const iy = Math.floor(((y - r.top) / r.height) * a.h)
            return a.data[(iy * a.w + ix) * 4 + 3] > 40
        }

        const onDown = (e) => {
            if (e.button !== 0) return
            if (onMascot(e.clientX, e.clientY) && isEmptySpace(e.target, root)) pokeRef.current?.()
        }

        let raf = 0
        let pointer = false
        const onMove = (e) => {
            cancelAnimationFrame(raf)
            raf = requestAnimationFrame(() => {
                const over = onMascot(e.clientX, e.clientY) && isEmptySpace(e.target, root)
                if (over !== pointer) {
                    pointer = over
                    root.style.cursor = over ? 'pointer' : ''
                }
            })
        }

        root.addEventListener('pointerdown', onDown)
        root.addEventListener('pointermove', onMove, { passive: true })
        return () => {
            root.removeEventListener('pointerdown', onDown)
            root.removeEventListener('pointermove', onMove)
            cancelAnimationFrame(raf)
            root.style.cursor = ''
        }
    }, [])

    return (
        <div
            ref={sceneRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden"
            style={{
                '--scene-h': TOP_SCENE_H,
                height: 'var(--scene-h)',
                backgroundImage: "url('/assets/layout_bg_top_wo_mascot.jpg'), url('/assets/layout_bg_top_tile.jpg')",
                backgroundRepeat: 'no-repeat, repeat-x',
                backgroundSize: 'auto 100%, auto 100%',
                backgroundPosition: `right top, calc(100% - var(--scene-h) * ${TOP_RATIO.toFixed(4)}) top`,
                WebkitMaskImage: FADE_BOTTOM,
                maskImage: FADE_BOTTOM,
            }}
        >
            {/* soft shadow on the water under the mascot's feet */}
            <div
                className="absolute rounded-[50%]"
                style={{
                    right: fromRight(SHADOW.cx + SHADOW.w / 2),
                    top: px(SHADOW.cy - SHADOW.h / 2),
                    width: px(SHADOW.w),
                    height: px(SHADOW.h),
                    background: '#487bb2',
                }}
            />

            {/* the clickable mascot (clicks are handled above, not by the image itself) */}
            <div
                className="absolute"
                style={{
                    right: fromRight(MASCOT.left + MASCOT.size),
                    top: px(MASCOT.top),
                    width: px(MASCOT.size),
                }}
            >
                <PokeMascot
                    src="/assets/login_figure.png"
                    className="relative w-full"
                    origin={MASCOT_FEET}
                    interactive={false}
                    pokeRef={pokeRef}
                    imgRef={imgRef}
                />
            </div>
        </div>
    )
}

// Waves sitting right above the footer. Because the content area is flex-1, this
// always ends up at the bottom, even on short pages. layout_bg_wave_tile.jpg is the wave
// picture plus its mirror image, so it repeats sideways without a visible seam.
const WaveBottom = () => (
    <div
        aria-hidden="true"
        className={`pointer-events-none relative z-0 ${WAVE_GAP}`}
        style={{
            height: WAVE_H,
            backgroundImage: "url('/assets/layout_bg_wave_tile.jpg')",
            backgroundRepeat: 'repeat-x',
            backgroundSize: 'auto 100%',
            backgroundPosition: 'left top',
            WebkitMaskImage: FADE_TOP,
            maskImage: FADE_TOP,
        }}
    />
)

const PageFooter = ({ homepageStyle = false }) => (
    <footer className={homepageStyle ? 'relative z-10 bg-[#071b4d] py-8 text-blue-200' : 'relative z-10 px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 border-t border-gray-200'}>
        {homepageStyle ? (
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-x-8 gap-y-3 px-4 text-center sm:flex-row sm:flex-wrap sm:px-6">
                <div className="flex items-center gap-2">
                    <Droplets size={14} className="text-cyan-400" />
                    <span className="text-xs">TapAware — Barangay Cabalantian Water Quality Monitoring System</span>
                </div>
                <FooterLegalLinks variant="dark" />
                <p className="text-xs text-blue-300">© {new Date().getFullYear()} Barangay Cabalantian, Bacolor, Pampanga</p>
            </div>
        ) : (
            <>
                <span>© {new Date().getFullYear()} TapAware - Barangay Cabalantian. All rights reserved.</span>
                <FooterLegalLinks variant="light" />
            </>
        )}
    </footer>
)

const Layout = ({ children }) => {
    const { user } = useAuth()
    const location = useLocation()
    const isResident = user?.role === 'resident'
    const residentHomepageStyle = isResident && ['/dashboard', '/profile'].includes(location.pathname)

    if (isResident) {
        return (
            <div className="relative flex min-h-screen bg-gray-100">
                {!residentHomepageStyle && <Watermark />}
                <Navbar />
                <div className="relative z-10 flex-1 flex flex-col min-h-screen pt-16">
                    <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
                    <PageFooter homepageStyle={residentHomepageStyle} />
                </div>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={getDefaultSidebarOpen()}>
                <Sidebar />
                <SidebarInset className={`min-h-svh min-w-0 ${PAGE_BG}`}>
                    <TopScene />

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

                    <WaveBottom />
                    <PageFooter />
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    );
};

export default Layout;