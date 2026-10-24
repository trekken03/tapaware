
import { useEffect, useRef, useState } from "react";

/**
 * <PokeMascot /> – a simple, friendly mascot.
 *
 *  - Every few seconds it gives a small stretch-hop, as if inviting you to click it
 *    (only while it is on screen and the tab is visible).
 *  - Click / tap it: it squashes, stretches up, wobbles, and a heart floats away.
 *  - It never lifts off: all movement is scaling/rotating around `origin`, so the
 *    spot where it rests on the card (its hands) stays put and no gap opens up.
 *  - With "reduce motion" turned on, it stays still.
 *
 * Put the positioning classes in `className` (absolute, left/right, z-index, ...).
 * All movement happens on an inner layer, so it never clashes with those classes.
 *
 * Props
 *   src        the PNG
 *   className  positioning classes for the wrapper
 *   imgStyle   e.g. the white sticker outline
 *   origin     CSS transform-origin for the squash (where the "feet" are).
 *              Default "50% 100%" (bottom centre).
 *   hopEvery   average ms between nudge hops (default 7000)
 *   heartLeft  horizontal position of the heart (default "50%")
 *   interactive  false = the image itself ignores clicks (used when something else,
 *              like the page layout, decides when a click counts)
 *   pokeRef    a ref that receives the poke() function, so a parent can trigger it
 *   imgRef     a ref to the <img>, so a parent can check where it is on screen
 */

const HOP = [
    { transform: "scale(1, 1)" },
    { transform: "scale(1.03, .96)", offset: 0.18 },
    { transform: "scale(.97, 1.08)", offset: 0.45 },
    { transform: "scale(1.02, .98)", offset: 0.75 },
    { transform: "scale(1, 1)" },
];

const POKE = [
    { transform: "rotate(0deg) scale(1, 1)" },
    { transform: "rotate(0deg) scale(1.08, .88)", offset: 0.15 },
    { transform: "rotate(-2deg) scale(.94, 1.14)", offset: 0.4 },
    { transform: "rotate(1.5deg) scale(1.05, .95)", offset: 0.65 },
    { transform: "rotate(0deg) scale(1, 1.03)", offset: 0.82 },
    { transform: "rotate(0deg) scale(1, 1)" },
];

const HEART = [
    { opacity: 0, transform: "translate(-50%, 0) scale(.5)" },
    { opacity: 1, transform: "translate(-50%, -14px) scale(1)", offset: 0.2 },
    { opacity: 0, transform: "translate(-50%, -52px) scale(1.15)" },
];

export default function PokeMascot({
    src,
    className = "",
    imgStyle,
    origin = "50% 100%",
    hopEvery = 7000,
    heartLeft = "50%",
    interactive = true,
    pokeRef,
    imgRef,
}) {
    const rootRef = useRef(null);
    const innerRef = useRef(null);
    const inView = useRef(false);
    const busy = useRef(false);
    const busyTimer = useRef(0);
    const [hearts, setHearts] = useState([]);
    const [reduce] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    const play = (frames, duration, easing) => {
        const el = innerRef.current;
        if (!el || !el.animate) return;
        el.animate(frames, { duration, easing });
    };

    // Small nudge hop every few seconds, only when visible
    useEffect(() => {
        if (reduce) return;
        const el = rootRef.current;
        if (!el) return;

        const io = new IntersectionObserver(
            ([entry]) => {
                inView.current = entry.isIntersecting;
            },
            { threshold: 0.3 }
        );
        io.observe(el);

        let timer;
        const loop = () => {
            timer = setTimeout(() => {
                if (inView.current && document.visibilityState === "visible" && !busy.current) {
                    play(HOP, 650, "ease-out");
                }
                loop();
            }, hopEvery * (0.8 + Math.random() * 0.5));
        };
        loop();

        return () => {
            clearTimeout(timer);
            io.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduce, hopEvery]);

    useEffect(() => () => clearTimeout(busyTimer.current), []);

    const poke = () => {
        if (reduce) return;
        busy.current = true;
        clearTimeout(busyTimer.current);
        busyTimer.current = setTimeout(() => {
            busy.current = false;
        }, 700);

        play(POKE, 650, "ease-out");

        const id = Date.now() + Math.random();
        setHearts((h) => [...h, id]);
        setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 1150);
    };

    if (pokeRef) pokeRef.current = poke;

    return (
        <div ref={rootRef} aria-hidden="true" className={`pointer-events-none ${className}`}>
            <div ref={innerRef} style={{ transformOrigin: origin }}>
                <img
                    ref={imgRef}
                    src={src}
                    alt=""
                    draggable={false}
                    onPointerDown={interactive ? poke : undefined}
                    className={`block w-full select-none ${interactive ? "pointer-events-auto cursor-pointer" : "pointer-events-none"
                        }`}
                    style={imgStyle}
                />
            </div>

            {hearts.map((id) => (
                <span
                    key={id}
                    ref={(el) => {
                        if (el && !el.dataset.played) {
                            el.dataset.played = "1";
                            el.animate(HEART, { duration: 1100, easing: "ease-out", fill: "forwards" });
                        }
                    }}
                    className="pointer-events-none absolute opacity-0"
                    style={{ left: heartLeft, top: "4%", fontSize: "1.5rem" }}
                >
                    🩷
                </span>
            ))}
        </div>
    );
}