const LoadingScreen = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a1a33]">
            <div className="flex flex-col items-center gap-4">
                <svg width="70" height="70" viewBox="0 0 80 80">
                    <path
                        d="M40 12 C40 12 24 34 24 46 A16 16 0 0 0 56 46 C56 34 40 12 40 12 Z"
                        fill="#22d3ee"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="translate"
                            values="0 -6; 0 4; 0 -6"
                            dur="1.4s"
                            repeatCount="indefinite"
                        />
                    </path>
                    <ellipse cx="40" cy="66" rx="14" ry="3" fill="#0891b2" opacity="0.5">
                        <animate
                            attributeName="rx"
                            values="6;16;6"
                            dur="1.4s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.2;0.5;0.2"
                            dur="1.4s"
                            repeatCount="indefinite"
                        />
                    </ellipse>
                </svg>
                <p className="text-cyan-200 text-sm font-medium tracking-wide">
                    Loading TapAware...
                </p>
            </div>
        </div>
    )
}

export default LoadingScreen