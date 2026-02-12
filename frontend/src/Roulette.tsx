import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import ROULETTE_ABI from "./abis/Roulette.json";
import TOKEN_ABI from "./abis/RouletteToken.json";
import { CustomConnectButton } from "./CustomWalletButton";

const ROULETTE_ADDRESS = "0x141c78B19eBf756639d5EB1a80E75bbC3d6B2c89";
const TOKEN_ADDRESS = "0x9291262Fed342bA9d4F585f25a674A3160331199";

// Multipliers configuration for the roulette sectors
const MULTIPLIERS = [
    { label: "0x", color: "#e72121", count: 10 },
    { label: "1x", color: "#3775d9", count: 4 },
    { label: "2x", color: "#1ea650", count: 3 },
    { label: "4x", color: "#f97316", count: 2 },
    { label: "8x", color: "#eab308", count: 1 },
];

// Build visual sectors ensuring colors are not consecutive
function buildVisualSectors() {
    const sectors: { label: string; color: string; realIndex: number }[] = [];
    let globalIndex = 0;

    MULTIPLIERS.forEach((m) => {
        for (let i = 0; i < m.count; i++) {
            sectors.push({ label: m.label, color: m.color, realIndex: globalIndex });
            globalIndex++;
        }
    });

    // Shuffle sectors visually to avoid consecutive colors being the same
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

// Static shuffled sectors array for display
const SECTORS = buildVisualSectors();

export default function RouletteApp() {
    const { isConnected, address } = useAccount();
    const { data: walletClient } = useWalletClient();

    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [lastSector, setLastSector] = useState<number | null>(null);
    const [balance, setBalance] = useState("0");
    const [isApproved, setIsApproved] = useState(false);

    // Ref and state for responsive roulette layout
    const rouletteRef = useRef<HTMLDivElement>(null);
    const [radius, setRadius] = useState(0);
    const [labelSize, setLabelSize] = useState(24);
    const [fontSize, setFontSize] = useState(14);

    // Adjust radius and label size based on roulette container width
    useEffect(() => {
        const updateSizes = () => {
            if (rouletteRef.current) {
                const width = rouletteRef.current.getBoundingClientRect().width;
                const isMobile = width < 500;
                setRadius(width * 0.43);
                setLabelSize(isMobile ? 16 : 24);
                setFontSize(14);
            }
        };
        updateSizes();
        window.addEventListener("resize", updateSizes);
        return () => window.removeEventListener("resize", updateSizes);
    }, []);

    // Reset UI when wallet changes or disconnects
    useEffect(() => {
        if (!isConnected) {
            setBalance("0");
            setIsApproved(false);
            setLastSector(null);
            return;
        }

        // Reset last spin when changing wallet
        setLastSector(null);
    }, [address, isConnected]);

    // Fetch balance and approval when wallet or client changes
    useEffect(() => {
        if (!walletClient || !isConnected || !address) {
            setBalance("0");
            setIsApproved(false);
            return;
        }

        fetchBalance();
        checkApproval();
    }, [walletClient, isConnected, address]);

    // Optional: auto-refresh balance every 60s
    useEffect(() => {
        if (!walletClient || !address) return;

        const interval = setInterval(() => {
            fetchBalance();
        }, 60000);

        return () => clearInterval(interval);
    }, [walletClient, address]);

    // Fetch token balance
    const fetchBalance = useCallback(async () => {
        if (!walletClient || !address) {
            setBalance("0");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(walletClient);
            const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI.abi, provider);
            const raw = await token.balanceOf(address);
            const formatted = ethers.formatUnits(raw, 18);
            setBalance(Number(formatted).toFixed(0));
        } catch (err) {
            console.error("Balance fetch error:", err);
            setBalance("0");
        }
    }, [walletClient, address]);

    // Check token allowance
    const checkApproval = useCallback(async () => {
        if (!walletClient || !isConnected || !address) {
            setIsApproved(false);
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(walletClient);
            const signer = await provider.getSigner();
            const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI.abi, signer);

            const allowance = await token.allowance(address, ROULETTE_ADDRESS);
            const minimum = ethers.parseUnits("1", 18);

            setIsApproved(allowance >= minimum);
        } catch (err) {
            console.error("Error checking allowance:", err);
            setIsApproved(false);
        }
    }, [walletClient, isConnected, address]);

    // Approve roulette contract to spend tokens
    const approveToken = async () => {
        if (!walletClient || !isConnected) return;

        try {
            const provider = new ethers.BrowserProvider(walletClient);
            const signer = await provider.getSigner();
            const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI.abi, signer);

            const amountApprove = ethers.parseUnits("9999999999999999", 18);
            const tx = await token.approve(ROULETTE_ADDRESS, amountApprove);
            await tx.wait();

            await checkApproval();
        } catch (err) {
            console.error(err);
            alert("❌ Approval failed");
        }
    };

    // Buy tickets
    const buyTickets = async () => {
        if (!walletClient || !isConnected) return;

        try {
            const provider = new ethers.BrowserProvider(walletClient);
            const signer = await provider.getSigner();
            const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI.abi, signer);

            const tx = await token.buyTokens(10, { value: ethers.parseEther("0.01") });
            await tx.wait();

            fetchBalance();
            alert("🎉 You bought 10 tickets");
        } catch (err) {
            console.error(err);
            alert("❌ Error buying tickets");
        }
    };

    // Spin the roulette
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
            const tx = await roulette.spin(betAmount, { gasLimit: 250_000 });
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
                fetchBalance();
                setSpinning(false);
                const entero = ethers.formatUnits(payout, 18).split('.')[0];
                alert(`You won ${entero} Tickets 🎟️`);
            }, 4000);

        } catch (err) {
            console.error(err);
            setSpinning(false);
            alert("❌ Error spinning the roulette");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">

            <div className="w-full mb-8 mt-10">
                <h1 className="style-script-regular text-2xl w-full text-center">
                    SkullRoulette
                </h1>
            </div>

            <div className="text-5xl"><i className="fa-solid fa-caret-down arrow"></i></div>

            <div ref={rouletteRef} className="relative w-[80vw] h-[80vw] max-w-[400px] max-h-[400px]">
                <div
                    className="w-full h-full rounded-full shadow-2xl transition-transform relative"
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
                        const rad = (angle - 90) * (Math.PI / 180);
                        const x = radius * Math.cos(rad);
                        const y = radius * Math.sin(rad);

                        return (
                            <div
                                key={i}
                                className="absolute text-white font-bold select-none flex items-center justify-center"
                                style={{
                                    left: "48%",
                                    top: "48%",
                                    width: labelSize,
                                    height: labelSize,
                                    transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                                    transformOrigin: "center center",
                                    fontSize: fontSize,
                                }}
                            >
                                {s.label}
                            </div>
                        );
                    })}
                </div>

                <div
                    className="absolute rounded-full flex items-center justify-center border-2"
                    style={{
                        backgroundColor: "#e72121",
                        width: "40px",
                        height: "40px",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 10,
                    }}
                >
                    <i className="fa-solid fa-arrow-rotate-right text-white text-lg"></i>
                </div>
            </div>

            <div className="mt-10 flex flex-col">
                <CustomConnectButton balance={balance} />
            </div>

            {isConnected && (
                <div className="mt-8 flex flex-col gap-4">
                    {!isApproved && (
                        <button
                            onClick={approveToken}
                            disabled={spinning}
                            className="px-7 py-1 rounded-full custom-button"
                        >
                            Approve Tickets
                        </button>
                    )}

                    {isApproved && (
                        <button
                            onClick={spinRoulette}
                            disabled={spinning || !isApproved}
                            className="px-7 py-1 rounded-full font-bold custom-button"
                        >
                            {spinning ? "Spinning..." : "Spin · 1 Ticket"}
                        </button>
                    )}

                    <button
                        onClick={buyTickets}
                        disabled={spinning}
                        className="px-7 py-1 rounded-full font-bold custom-button"
                    >
                        Buy 10 Tickets · 0.01 ETH
                    </button>
                </div>
            )}
        </div>
    );
}
