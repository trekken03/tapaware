import { useEffect, useRef, useState } from "react";

/**
 * <Mascot />  – reusable, cursor-aware mascot for TapAware.
 *
 * Works with ONE image (tilts/shifts toward the cursor, floats, bounces on click)
 * and gets better if you add pose images later (looks left/right/up/down, happy on click).
 *
 * Usage:
 *   <Mascot src="/mascot/winking.png" className="w-40" />
 *
 *   <Mascot
 *     src="/mascot/winking.png"
 *     poses={{
 *       left: "/mascot/look-left.png",
 *       right: "/mascot/look-right.png",
 *       up: "/mascot/look-up.png",
 *       down: "/mascot/look-down.png",
 *       happy: "/mascot/happy.png",
 *     }}
 *   />
 *
 * Every pose is optional; a missing pose falls back to `src`.
 */

const CSS = `
@media (prefers-reduced-motion: no-preference) {
  .mascot-float { animation: mascot-float 3.4s ease-in-out infinite; }
  .mascot-pop   { animation: mascot-pop 0.55s cubic-bezier(.3,1.6,.5,1); }
  .mascot-heart { animation: mascot-heart 1.1s ease-out forwards; }
}
@keyframes mascot-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5%) } }
@keyframes mascot-pop {
  0% { transform: scale(1,1) }
  25% { transform: scale(1.12,.88) }
  55% { transform: scale(.94,1.1) translateY(-3%) }
  100% { transform: scale(1,1) }
}
@keyframes mascot-heart {
  0% { opacity: 0; transform: translate(-50%, 0) scale(.6) }
  25% { opacity: 1 }
  100% { opacity: 0; transform: translate(-50%, -34px) scale(1.1) }
}
`;

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export default function Mascot({
    src,
    poses = {},
    alt = "TapAware mascot",
    className = "w-40",
    maxTilt = 8, // degrees
    maxShift = 3, // % of the mascot's own size (scales with zoom)
    followCursor = true,
}) {
    const followRef = useRef(null);
    const frame = useRef(0);
    const lockTimer = useRef(0);
    const [look, setLook] = useState("idle");
    const [poking, setPoking] = useState(false);

    // Preload pose images so swapping never flickers.
    useEffect(() => {
        Object.values(poses).forEach((p) => {
            if (p) new Image().src = p;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(poses)]);

    // Cursor following (desktop with a mouse only, and not for reduced-motion users).
    useEffect(() => {
        if (!followCursor || typeof window === "undefined") return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const mouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        if (reduce || !mouse) return;

        const onMove = (e) => {
            cancelAnimationFrame(frame.current);
            frame.current = requestAnimationFrame(() => {
                const el = followRef.current;
                if (!el) return;
                const r = el.getBoundingClientRect();
                const nx = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1);
                const ny = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1);

                el.style.transform = `translate(${nx * maxShift}%, ${ny * maxShift * 0.5}%) rotate(${nx * maxTilt}deg)`;

                // Pose swap, only if the matching pose image exists.
                let next = "idle";
                if (Math.abs(nx) > 0.2 || Math.abs(ny) > 0.3) {
                    next = Math.abs(nx) * 1.4 > Math.abs(ny)
                        ? (nx < 0 ? "left" : "right")
                        : (ny < 0 ? "up" : "down");
                }
                setLook(poses[next] ? next : "idle");
            });
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        return () => {
            window.removeEventListener("pointermove", onMove);
            cancelAnimationFrame(frame.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [followCursor, maxTilt, maxShift, JSON.stringify(poses)]);

    useEffect(() => () => clearTimeout(lockTimer.current), []);

    const poke = () => {
        setPoking(false);
        // restart the animation if clicked repeatedly
        requestAnimationFrame(() => setPoking(true));
        clearTimeout(lockTimer.current);
        lockTimer.current = setTimeout(() => setPoking(false), 1100);
    };

    const current = poking && poses.happy ? poses.happy : poses[look] || src;

    return (
        <div className={`relative inline-block select-none ${className}`}>
            <style>{CSS}</style>

            {/* Layer 1: follows the cursor */}
            <div
                ref={followRef}
                style={{ transition: "transform 140ms ease-out", willChange: "transform" }}
            >
                {/* Layer 2: idle float + click bounce (separate so transforms don't clash) */}
                <div className="mascot-float">
                    <img
                        src={current}
                        alt={alt}
                        draggable={false}
                        onPointerDown={poke}
                        className={`w-full h-auto cursor-pointer ${poking ? "mascot-pop" : ""}`}
                    />
                </div>
            </div>

            {poking && (
                <span
                    aria-hidden="true"
                    className="mascot-heart pointer-events-none absolute left-1/2 top-0 text-xl"
                >
                    🩷
                </span>
            )}
        </div>
    );
}