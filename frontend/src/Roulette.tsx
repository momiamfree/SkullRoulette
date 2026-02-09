import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import ROULETTE_ABI from "./abis/Roulette.json";
import TOKEN_ABI from "./abis/RouletteToken.json";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const ROULETTE_ADDRESS = "0xC92d0755FD14a7e7Cf07d1766297fb994fC682A2";
const TOKEN_ADDRESS = "0x7D043994787813bA063B56344e801dD4177e2359";

// === Multiplicadores ===
const MULTIPLIERS = [
    { label: "0x", color: "#ef4444", count: 10 },
    { label: "1x", color: "#3b82f6", count: 4 },
    { label: "2x", color: "#22c55e", count: 3 },
    { label: "4x", color: "#f97316", count: 2 },
    { label: "8x", color: "#eab308", count: 1 },
];

// === Construir sectores visuales dispersos sin romper índices ===
function buildVisualSectors() {
    const sectors: { label: string; color: string; realIndex: number }[] = [];
    let globalIndex = 0;

    MULTIPLIERS.forEach((m) => {
        for (let i = 0; i < m.count; i++) {
            sectors.push({ label: m.label, color: m.color, realIndex: globalIndex });
            globalIndex++;
        }
    });

    // Mezclar visualmente evitando colores consecutivos iguales
    const shuffled: typeof sectors = [];
    let remaining = [...sectors];
    let prevColor: string | null = null;

    while (remaining.length > 0) {
        let options = remaining.filter((s) => s.color !== prevColor);
        if (options.length === 0) options = remaining;
        const choice = options[Math.floor(Math.random() * options.length)];
        shuffled.push(choice);
        prevColor = choice.color;
        remaining = remaining.filter((s) => s !== choice);
    }

    return shuffled;
}

const SECTORS = buildVisualSectors();

export default function RouletteApp() {
    const { isConnected, address } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [lastSector, setLastSector] = useState<number | null>(null);
    const [isApproved, setIsApproved] = useState(false);

    // === CHEQUEAR APROBACIÓN AL MONTAR ===
    useEffect(() => {
        const checkApproval = async () => {
            if (!walletClient || !isConnected || !address) return;
            try {
                const provider = new ethers.BrowserProvider(walletClient);
                const signer = await provider.getSigner();
                const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI.abi, signer);

                const allowance = await token.allowance(address, ROULETTE_ADDRESS);
                // allowance es bigint en ethers v6
                const minimum = ethers.parseUnits("1", 18);
                if (allowance >= minimum) {
                    setIsApproved(true);
                }
            } catch (err) {
                console.error("Error checking allowance:", err);
            }
        };
        checkApproval();
    }, [walletClient, isConnected, address]);


    // === COMPRAR TICKETS ===
    const buyTickets = async () => {
        if (!walletClient || !isConnected) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI.abi, signer);
            const tx = await token.buyTokens(10, { value: ethers.parseEther("0.01") });
            await tx.wait();
            alert("🎉 Compraste 10 tickets");
        } catch (err) {
            console.error(err);
            alert("❌ Error comprando tickets");
        }
    };

    // === APROBAR TOKENS ===
    const approveToken = async () => {
        if (!walletClient || !isConnected) return;
        try {
            const provider = new ethers.BrowserProvider(walletClient);
            const signer = await provider.getSigner();
            const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI.abi, signer);
            const amountApprove = ethers.parseUnits("9999999999999999", 18);
            const tx = await token.approve(ROULETTE_ADDRESS, amountApprove);
            await tx.wait();
            setIsApproved(true);
            alert("✅ Tokens approved! Now you can spin the roulette.");
        } catch (err) {
            console.error(err);
            alert("❌ Approval failed");
        }
    };

    // === GIRAR RULETA ===
    const spinRoulette = async () => {
        if (!walletClient || !isConnected) return;
        if (!isApproved) {
            alert("⚠️ Please approve tokens first!");
            return;
        }

        try {
            setSpinning(true);
            const provider = new ethers.BrowserProvider(walletClient);
            const signer = await provider.getSigner();
            const roulette = new ethers.Contract(ROULETTE_ADDRESS, ROULETTE_ABI.abi, signer);

            const betAmount = ethers.parseUnits("1", 18);
            const tx = await roulette.spin(betAmount, {
                gasLimit: 250_000, // ajusta según sea necesario
            });
            const receipt = await tx.wait();

            const iface = new ethers.Interface(ROULETTE_ABI.abi);
            const logs = receipt.logs
                .map((log: { topics: ReadonlyArray<string>; data: string }) => {
                    try { return iface.parseLog(log); } catch { return null; }
                })
                .filter(Boolean);

            const spinEvent = logs.find((e: any) => e.name === "SpinResult");
            if (!spinEvent) throw new Error("SpinResult event not found");

            const sectorIndex = Number(spinEvent.args.sectorIndex);
            const multiplier = Number(spinEvent.args.multiplier);
            const payout = spinEvent.args.payout;

            const visualIndex = SECTORS.findIndex(s => s.realIndex === sectorIndex);

            const segmentAngle = 360 / SECTORS.length;
            const spins = 2;
            const targetRotation =
                rotation +
                360 * spins +
                (360 - (rotation % 360)) +
                (360 - visualIndex * segmentAngle - segmentAngle / 2);

            setRotation(targetRotation);
            setLastSector(visualIndex);

            setTimeout(() => {
                setSpinning(false);
                alert(`🎉 Prize: ${multiplier}x\nYou won ${ethers.formatUnits(payout, 18)} RLT`);
            }, 4000);
        } catch (err) {
            console.error(err);
            setSpinning(false);
            alert("❌ Error spinning the roulette");
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
            <div className="mb-4"><ConnectButton /></div>
            <div className="text-5xl mb-2">🔻</div>

            {/* RUEDA */}
            <div className="relative w-[80vw] h-[80vw] max-w-[400px] max-h-[400px]">
                {/* RUEDA GIRATORIA */}
                <div
                    className="w-full h-full rounded-full shadow-2xl transition-transform"
                    style={{
                        border: "4px solid white",
                        transform: `rotate(${rotation}deg)`,
                        transitionDuration: spinning ? "4000ms" : "0ms",
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
                        const rad = (angle - 90) * (Math.PI / 180);
                        const x = radius * Math.cos(rad);
                        const y = radius * Math.sin(rad);

                        return (
                            <div
                                key={i}
                                className="absolute text-white font-bold select-none text-sm w-6 h-6 flex items-center justify-center rounded-sm"
                                style={{
                                    left: "47%",
                                    top: "47%",
                                    transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                                    transformOrigin: "center center",
                                }}
                            >
                                {s.label}
                            </div>
                        );
                    })}
                </div>


                {/* CIRCULO ROJO FIJO EN EL CENTRO CON ICONO */}
                <div
                    className="absolute rounded-full flex items-center justify-center border-2"
                    style={{
                        backgroundColor: "#ef4444",
                        width: "40px",
                        height: "40px",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 10, // por encima de la ruleta
                    }}
                >
                    <i className="fa-solid fa-arrow-rotate-right text-white text-lg"></i>
                </div>

            </div>


            <div className="flex gap-6 mt-6 text-lg text-white">
                {MULTIPLIERS.map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full" style={{ background: s.color }} />
                        {s.label}
                    </div>
                ))}
            </div>

            {isConnected && (
                <div className="mt-8 flex flex-col gap-4">
                    {!isApproved && (
                        <button
                            onClick={approveToken}
                            disabled={spinning}
                            className="px-6 py-2 bg-blue-600 rounded font-bold text-white"
                        >
                            Approve Tokens
                        </button>
                    )}
                    <button
                        onClick={spinRoulette}
                        disabled={spinning || !isApproved}
                        className="px-6 py-2 bg-yellow-500 rounded font-bold text-white"
                    >
                        {spinning ? "Spinning..." : "Spin Roulette"}
                    </button>
                    <button
                        onClick={buyTickets}
                        disabled={spinning}
                        className="px-6 py-2 bg-green-600 rounded font-bold text-white"
                    >
                        Buy 10 Tickets · 0.01 ETH
                    </button>
                </div>
            )}

            {lastSector !== null && (
                <p className="mt-4 text-white">
                    Last spin: {SECTORS[lastSector].label}
                </p>
            )}
        </div>
    );
}
