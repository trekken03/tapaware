import Mascot from "./Mascot";

/**
 * <SceneMascot /> – places the mascot INSIDE the background scene.
 *
 * Your page backgrounds use `bg-cover bg-center`, so the picture is scaled to
 * cover the window and centered. This component does the same maths in CSS, so
 * the mascot keeps its size and spot in the scene at ANY browser zoom or
 * window size (it no longer shrinks when you zoom out).
 *
 * Props
 *   x        horizontal centre of the mascot, as a fraction of the background
 *            image width (0 = far left, 0.5 = middle, 1 = far right)
 *   size     mascot width as a fraction of the background image width
 *   bottom   distance from the bottom of the screen, in % of screen height
 *   bgRatio  background image width / height (new_login_bg.jpg = 2576 / 1093)
 *   className  visibility breakpoint, e.g. "hidden md:block"
 *
 * Needs a browser with container query units (cqw/cqh): Chrome 105+, Safari 16+,
 * Firefox 110+.
 */
export default function SceneMascot({
    src,
    x = 0.45,
    size = 0.21,
    bottom = 2,
    bgRatio = 2576 / 1093,
    className = "hidden md:block",
    alt = "TapAware mascot",
    ...mascotProps
}) {
    const style = {
        // How wide the background image is drawn (what `bg-cover` does)
        "--cover": `max(100cqw, ${(bgRatio * 100).toFixed(2)}cqh)`,
        "--w": `calc(var(--cover) * ${size})`,
        width: "var(--w)",
        left: `calc(50cqw + ${x - 0.5} * var(--cover) - var(--w) / 2)`,
        bottom: `${bottom}cqh`,
    };

    return (
        <div
            className={`pointer-events-none [&_img]:pointer-events-auto absolute inset-0 z-0 overflow-hidden ${className}`}
            style={{ containerType: "size" }}
        >
            <div className="absolute" style={style}>
                <Mascot src={src} alt={alt} className="w-full" {...mascotProps} />
            </div>
        </div>
    );
}