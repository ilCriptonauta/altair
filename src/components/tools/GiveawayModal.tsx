"use client";

import { useEffect, useState, useRef } from "react";
import { X, Crown, Copy, ExternalLink, RefreshCw, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { formatAddress } from "@/lib/utils";

interface GiveawayModalProps {
    winnerAddress: string;
    herotag?: string;
    onClose: () => void;
    onRedraw: () => void;
    type: "balanced" | "weighted";
}

export function GiveawayModal({ winnerAddress, herotag, onClose, onRedraw, type }: GiveawayModalProps) {
    const [isCopied, setIsCopied] = useState(false);
    const [displayAddress, setDisplayAddress] = useState(winnerAddress);
    const [displayHerotag, setDisplayHerotag] = useState(herotag);
    const [isRolling, setIsRolling] = useState(false);

    // Confetti trigger
    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    // Initial mount confetti
    useEffect(() => {
        triggerConfetti();
    }, []);

    // Effect to update display when winner changes (stops rolling)
    useEffect(() => {
        if (!isRolling) {
            setDisplayAddress(winnerAddress);
            setDisplayHerotag(herotag);
        }
    }, [winnerAddress, herotag, isRolling]);

    const handleRedraw = () => {
        setIsRolling(true);
        onRedraw(); // Trigger parent calculation (will update props)

        // Start scrambling animation
        const startTime = Date.now();
        const duration = 1500; // Animation duration (min rolling time)

        const interval = setInterval(() => {
            // Generate random fake address
            const randomChars = Array(58).fill(0).map(() => Math.random().toString(36)[2]).join('');
            setDisplayAddress(`erd1${randomChars.substring(0, 58)}`);
            setDisplayHerotag(undefined); // Hide herotag during roll

            // We only stop if duration passed AND we have a new winner (props updated could happen anytime)
            // But here we rely on the parent updating the props, which will be reflected AFTER isRolling is set to false.
            // Actually, we should just run for fixed duration then unlock.
            // The parent updates `winnerAddress` but we ignore it while `isRolling` is true due to the effect dependency.

            if (Date.now() - startTime > duration) {
                clearInterval(interval);
                setIsRolling(false);
                // When isRolling becomes false, the effect [winnerAddress, isRolling] will fire and update displayAddress to the NEW winner.
                triggerConfetti();
            }
        }, 50);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(herotag ? herotag : winnerAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative w-full max-w-md bg-[#0F172A] border border-[#22D3EE]/30 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
                {/* Background Glow Effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[#22D3EE]/20 blur-[100px] rounded-full pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="relative flex flex-col items-center text-center space-y-6">

                    {/* Crown Icon */}
                    <div className="relative">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            key={isRolling ? "rolling" : winnerAddress} // Re-animate on winner change
                        >
                            <Crown className="h-20 w-20 text-[#FBBF24] drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="absolute -top-2 -right-2 bg-[#22D3EE] text-[#0F172A] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        >
                            Winner
                        </motion.div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                            {isRolling ? "Drawing..." : "Congratulations!"}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            {type === "balanced" ? "Random selection (Equal Chance)" : "Weighted selection (Token Heavy)"}
                        </p>
                    </div>

                    {/* Winner Address Card */}
                    <div className="w-full bg-[#1E293B]/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between group hover:border-[#22D3EE]/50 transition-colors">
                        <div className="flex flex-col items-start gap-1 overflow-hidden text-left w-full">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                {displayHerotag ? "Herotag" : "Address"}
                            </span>
                            {displayHerotag ? (
                                <div className="flex flex-col w-full">
                                    <span className="font-bold text-[#22D3EE] text-xl md:text-2xl truncate w-full">
                                        @{displayHerotag}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono break-all leading-tight mt-1">
                                        {formatAddress(displayAddress, 6, 6)}
                                    </span>
                                </div>
                            ) : (
                                <span className="font-mono text-[#22D3EE] font-bold text-lg md:text-xl break-all w-full">
                                    {isRolling ?
                                        // Fake format during rolling, full visible
                                        `${displayAddress.substring(0, 12)}...${displayAddress.substring(displayAddress.length - 12)}`
                                        : formatAddress(displayAddress, 12, 12)
                                    }
                                </span>
                            )}
                        </div>
                        {!isRolling && (
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                <button
                                    onClick={handleCopy}
                                    className="p-2 rounded-lg bg-[#0F172A] text-slate-400 hover:text-white hover:bg-slate-700 transition-colors relative"
                                    title="Copy Address"
                                >
                                    <Copy className="h-4 w-4" />
                                    {isCopied && (
                                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#22D3EE] text-[#0F172A] text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                            Copied!
                                        </span>
                                    )}
                                </button>
                                <a
                                    href={`https://explorer.multiversx.com/accounts/${winnerAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-[#0F172A] text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                    title="View on Explorer"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 w-full pt-2">
                        <button
                            onClick={handleRedraw}
                            disabled={isRolling}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-slate-700 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.98]"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRolling ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                            Redraw
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-[#22D3EE] hover:bg-[#06B6D4] text-[#0F172A] font-bold transition-colors shadow-lg shadow-[#22D3EE]/20 hover:shadow-[#22D3EE]/40 active:scale-[0.98]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
