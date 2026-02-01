"use client";

import { useEffect, useState } from "react";
import { X, Crown, Copy, ExternalLink, RefreshCw, Trophy, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { formatAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

    const triggerConfetti = () => {
        const duration = 4000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 1000, colors: ['#FBBF24', '#FFFFFF', '#06B6D4'] };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 60 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    useEffect(() => {
        triggerConfetti();
    }, []);

    useEffect(() => {
        if (!isRolling) {
            setDisplayAddress(winnerAddress);
            setDisplayHerotag(herotag);
        }
    }, [winnerAddress, herotag, isRolling]);

    const handleRedraw = () => {
        setIsRolling(true);
        onRedraw();
        const startTime = Date.now();
        const duration = 2000;

        const interval = setInterval(() => {
            const randomChars = Array(58).fill(0).map(() => Math.random().toString(36)[2]).join('');
            setDisplayAddress(`erd1${randomChars.substring(0, 58)}`);
            setDisplayHerotag(undefined);

            if (Date.now() - startTime > duration) {
                clearInterval(interval);
                setIsRolling(false);
                triggerConfetti();
            }
        }, 40);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(herotag ? herotag : winnerAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/80">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 cursor-pointer"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 40, rotateX: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 40 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="relative w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(251,191,36,0.15)] overflow-hidden"
            >
                {/* Visual Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-amber-400/10 blur-[120px]" />
                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-amber-400/5 blur-[80px] rounded-full" />
                </div>

                <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors z-20 h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/5">
                    <X className="h-6 w-6" />
                </button>

                <div className="relative flex flex-col items-center text-center space-y-8 z-10">
                    {/* Icon Stack */}
                    <div className="relative">
                        <motion.div
                            animate={isRolling ? {
                                rotateY: [0, 360, 720],
                                scale: [1, 1.1, 1]
                            } : {
                                y: [0, -10, 0],
                            }}
                            transition={isRolling ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Trophy className="h-28 w-28 text-amber-400 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-4 -right-4 bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-2xl flex items-center gap-1.5"
                        >
                            <Sparkles className="h-3 w-3" />
                            Elite
                        </motion.div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                            {isRolling ? "Rolling the Dice" : "WE HAVE A WINNER"}
                        </h2>
                        <p className="text-amber-400/60 text-xs font-black uppercase tracking-[0.3em]">
                            {type === "balanced" ? "FAIR SHUFFLE PROTOCOL" : "WEIGHTED QUANTUM SELECTION"}
                        </p>
                    </div>

                    {/* Winner Address Display */}
                    <div className="w-full bg-black/40 border border-white/5 rounded-[2rem] p-8 flex flex-col items-center gap-6 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-col items-center gap-2 w-full">
                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">
                                Holder Identity
                            </span>

                            {displayHerotag ? (
                                <div className="flex flex-col items-center">
                                    <span className="font-black text-amber-400 text-3xl sm:text-4xl tracking-tighter uppercase break-all">
                                        @{displayHerotag}
                                    </span>
                                    <span className="text-[10px] text-slate-600 font-mono font-bold mt-2 tracking-widest">
                                        {formatAddress(displayAddress, 8, 8)}
                                    </span>
                                </div>
                            ) : (
                                <span className="font-mono text-amber-400 font-black text-xl sm:text-2xl break-all">
                                    {isRolling ? displayAddress.substring(0, 16) + "..." : formatAddress(displayAddress, 16, 16)}
                                </span>
                            )}
                        </div>

                        {!isRolling && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="h-12 w-12 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-amber-400/20 hover:border-amber-400/30 border border-white/5 transition-all flex items-center justify-center relative"
                                    title="Copy"
                                >
                                    <Copy className="h-5 w-5" />
                                    <AnimatePresence>
                                        {isCopied && (
                                            <motion.span
                                                initial={{ y: 0, opacity: 0 }}
                                                animate={{ y: -45, opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute bg-amber-400 text-black text-[10px] font-black px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap"
                                            >
                                                COPIED
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </button>
                                <a
                                    href={`https://explorer.multiversx.com/accounts/${winnerAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-12 w-12 rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-amber-400/20 hover:border-amber-400/30 border border-white/5 transition-all flex items-center justify-center"
                                    title="Explorer"
                                >
                                    <ExternalLink className="h-5 w-5" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 w-full pt-4">
                        <button
                            onClick={handleRedraw}
                            disabled={isRolling}
                            className="flex-1 flex items-center justify-center gap-3 h-16 rounded-[1.5rem] bg-white/5 hover:bg-white/10 border border-white/5 text-white font-black uppercase tracking-widest transition-all disabled:opacity-20 active:scale-95 group"
                        >
                            <RefreshCw className={cn("h-5 w-5", isRolling && "animate-spin")} />
                            <span>REDRAW</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 h-16 rounded-[1.5rem] bg-amber-400 hover:bg-amber-300 text-[#0F172A] font-black uppercase tracking-widest transition-all shadow-2xl shadow-amber-400/20 active:scale-95"
                        >
                            FINALIZE
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
