import { useState } from "react";

const MULTIPLIERS = [
    { label: "0x", color: "#ef4444", count: 10 },
    { label: "1x", color: "#3b82f6", count: 4 },
    { label: "2x", color: "#22c55e", count: 3 },
    { label: "4x", color: "#f4780b", count: 2 },
    { label: "8x", color: "#eab308", count: 1 },
];

function shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const SECTORS = shuffle(
    MULTIPLIERS.flatMap((s) =>
        Array.from({ length: s.count }, () => ({ label: s.label, color: s.color }))
    )
);

export default function Roulette() {
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [transitionDuration, setTransitionDuration] = useState(4000);
    const [accumRotation, setAccumRotation] = useState(0);

    const spinRoulette = () => {
        if (spinning) return;
        setSpinning(true);

        const segmentAngle = 360 / SECTORS.length;
        const randomExtra = Math.random() * 360;
        const spins = 720;
        const newAccum = accumRotation + spins + randomExtra;
        setAccumRotation(newAccum);

        setTransitionDuration(4000);
        setRotation(newAccum);

        setTimeout(() => {
            const effectiveRotation = newAccum % 360;
            const index = Math.floor(((360 - effectiveRotation) % 360) / segmentAngle);
            alert(`¡Te ha tocado: ${SECTORS[index].label}! 🎉`);
            setSpinning(false);
        }, 4000);
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900">
            <div className="text-5xl mb-0 z-10">🔻</div>

            <div className="relative w-[80vw] h-[80vw] max-w-[400px] max-h-[400px]">
                <div
                    className="w-full h-full rounded-full shadow-2xl transition-transform"
                    style={{
                        border: "4px solid #fff",
                        transform: `rotate(${rotation}deg)`,
                        transitionDuration: `${transitionDuration}ms`,
                        background: `conic-gradient(${SECTORS.map((s, i) => {
                            const start = (i * 360) / SECTORS.length;
                            const end = ((i + 1) * 360) / SECTORS.length;
                            const borderWidth = 0.5;
                            return `${s.color} ${start}deg ${end - borderWidth}deg, white ${end - borderWidth}deg ${end}deg`;
                        }).join(",")})`,
                    }}
                >
                    {SECTORS.map((s, i) => {
                        const segmentAngle = 360 / SECTORS.length;
                        const angle = (i + 0.5) * segmentAngle;
                        const radius = 140;

                        const x = radius * Math.cos((angle - 90) * (Math.PI / 180));
                        const y = radius * Math.sin((angle - 90) * (Math.PI / 180));

                        const rotation = angle;

                        return (
                            <div
                                key={i}
                                className="absolute text-white font-bold select-none text-sm"
                                style={{
                                    left: "47.8%",
                                    top: "47.8%",
                                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                                    transformOrigin: "center center",
                                }}
                            >
                                {s.label}
                            </div>
                        );
                    })}

                </div>
            </div>

            <div className="flex gap-6 mt-6 text-lg">
                {MULTIPLIERS.map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full" style={{ background: s.color }} />
                        {s.label}
                    </div>
                ))}
            </div>

            <button
                onClick={spinRoulette}
                disabled={spinning}
                className="mt-8 px-6 py-3 bg-indigo-600 rounded text-white font-bold hover:bg-indigo-500 disabled:opacity-50"
            >
                {spinning ? "Girando..." : "Lanzar Ruleta"}
            </button>
        </div>
    );
}
