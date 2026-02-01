"use client";

import { useEffect, useState } from "react";
import { NFT, getNFT } from "@/lib/mx-api";
import { X, ExternalLink, ShieldCheck, Tag, Copy, ChevronRight, Hash, Database, User, Coins, AlertCircle } from "lucide-react";
import { NFTMedia } from "./NFTMedia";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NFTDetailModalProps {
    identifier: string;
    onClose: () => void;
}

export function NFTDetailModal({ identifier, onClose }: NFTDetailModalProps) {
    const [nft, setNft] = useState<NFT | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDetails() {
            setLoading(true);
            const data = await getNFT(identifier);
            setNft(data);
            setLoading(false);
        }
        if (identifier) fetchDetails();
    }, [identifier]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    const [copiedID, setCopiedID] = useState(false);
    const [showAttributes, setShowAttributes] = useState(false);

    useEffect(() => {
        if (copiedID) {
            const timeout = setTimeout(() => setCopiedID(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copiedID]);

    const handleCopyID = () => {
        if (nft?.identifier) {
            navigator.clipboard.writeText(nft.identifier);
            setCopiedID(true);
        }
    };

    if (!identifier) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-[#020617]/95 md:bg-[#020617]/90 backdrop-blur-xl"
            />

            {/* Modal Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full h-full md:h-[800px] md:max-w-6xl md:rounded-[3rem] bg-[#0F172A]/80 border-t md:border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden backdrop-blur-3xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/5 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] pointer-events-none" />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 md:top-6 md:right-6 z-[110] h-10 w-10 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-white hover:bg-cyan-400 hover:text-[#0F172A] transition-all group active:scale-95"
                >
                    <X className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                </button>

                {/* Left Section: Visuals */}
                <div className="w-full md:w-5/12 h-[45vh] md:h-full bg-black/60 flex items-center justify-center relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5 shrink-0">
                    <div className="absolute inset-0 bg-cyan-400/5 pointer-events-none" />

                    {loading ? (
                        <div className="w-4/5 aspect-square rounded-[2rem] bg-white/5 animate-pulse" />
                    ) : nft ? (
                        <div className="relative w-full h-full flex items-center justify-center p-8 md:p-16">
                            {/* Centered glow effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 aspect-square bg-cyan-400/20 blur-[150px] animate-pulse pointer-events-none" />

                            <NFTMedia
                                nft={nft}
                                className="w-full max-h-full aspect-square rounded-3xl md:rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.7)] border border-white/10 relative z-10 object-contain"
                                autoPlay
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-500">
                            <Database className="h-10 w-10 opacity-20" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Media Offline</span>
                        </div>
                    )}
                </div>

                {/* Right Section: Details & Actions (Scrollable) */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0">
                    {loading ? (
                        <div className="p-8 md:p-12 space-y-8 h-full">
                            <div className="flex flex-col gap-4">
                                <div className="h-4 w-32 bg-white/5 rounded-full animate-pulse" />
                                <div className="h-12 w-3/4 bg-white/5 rounded-2xl animate-pulse" />
                            </div>
                            <div className="h-48 w-full bg-white/5 rounded-3xl animate-pulse" />
                        </div>
                    ) : nft ? (
                        <>
                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 space-y-8 md:space-y-10">
                                {/* Header */}
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            {nft.collection}
                                        </div>
                                        {nft.rank && (
                                            <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                                                Rank #{nft.rank}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-[1] md:leading-[0.9] break-words">
                                        {nft.name}
                                    </h2>
                                </div>

                                {/* Description */}
                                {nft.metadata?.description && (
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <ChevronRight className="h-3 w-3 text-cyan-400" /> Protocol Overview
                                        </h3>
                                        <p className="text-slate-400 font-medium leading-relaxed text-sm bg-white/5 p-5 md:p-6 rounded-3xl border border-white/5 italic">
                                            "{nft.metadata.description}"
                                        </p>
                                    </div>
                                )}

                                {/* Attributes */}
                                {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setShowAttributes(!showAttributes)}
                                            className="w-full flex items-center justify-between group/toggle"
                                        >
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3 group-hover/toggle:text-cyan-400 transition-colors">
                                                <ChevronRight className={cn("h-3 w-3 text-cyan-400 transition-transform duration-300", showAttributes && "rotate-90")} /> Attributes
                                            </h3>
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest group-hover/toggle:text-cyan-400">
                                                {showAttributes ? "Hide" : `Show (${nft.metadata.attributes.length})`}
                                            </span>
                                        </button>

                                        <AnimatePresence>
                                            {showAttributes && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                                                        {nft.metadata.attributes.map((attr, idx) => (
                                                            <div key={idx} className="bg-black/40 rounded-2xl p-4 border border-white/5 hover:border-cyan-400/30 transition-all group/attr">
                                                                <p className="text-[8px] md:text-[9px] uppercase text-slate-600 font-black mb-1.5 tracking-tighter truncate group-hover/attr:text-cyan-400/60 transition-colors">
                                                                    {attr.trait_type}
                                                                </p>
                                                                <p className="text-[11px] md:text-xs font-black text-white truncate" title={attr.value}>
                                                                    {attr.value}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 md:p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <User className="h-3.5 w-3.5 text-cyan-400" /> Creator Account
                                        </div>
                                        <p className="text-[10px] md:text-xs font-mono text-white truncate font-bold" title={nft.creator}>
                                            {nft.creator}
                                        </p>
                                    </div>
                                    <div className="p-5 md:p-6 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <Coins className="h-3.5 w-3.5 text-cyan-400" /> Royalties Set
                                        </div>
                                        <p className="text-lg md:text-xl font-black text-white">
                                            {nft.royalties ? `${nft.royalties}%` : "0%"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Sticky Actions (Fixed at Bottom) */}
                            <div className="p-5 md:p-10 md:pt-0 grid grid-cols-2 gap-3 mt-auto border-t border-white/10 bg-[#0F172A]/95 backdrop-blur-3xl shrink-0 relative z-[120]">
                                <button
                                    onClick={handleCopyID}
                                    className={cn(
                                        "flex-1 flex items-center justify-between gap-3 px-4 py-2.5 md:px-5 md:py-3 rounded-2xl transition-all group/copy border",
                                        copiedID
                                            ? "bg-cyan-400/10 border-cyan-400 text-cyan-400"
                                            : "bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white"
                                    )}
                                >
                                    <div className="flex flex-col items-start min-w-0">
                                        <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-50">
                                            {copiedID ? "Copied" : "Global ID"}
                                        </span>
                                        <span className="text-[9px] font-mono font-bold truncate w-full tracking-wider">
                                            {nft.identifier.substring(0, 8)}...
                                        </span>
                                    </div>
                                    <Copy className={cn("h-3.5 w-3.5 shrink-0 transition-transform", copiedID ? "scale-110" : "group-active/copy:scale-90")} />
                                </button>

                                <a
                                    href={`https://oox.art/marketplace/nfts/${identifier}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 md:px-6 md:py-2.5 rounded-2xl bg-cyan-400 hover:bg-white text-[#0F172A] font-black uppercase tracking-widest text-[10px] md:text-xs transition-all shadow-[0_10px_25px_rgba(34,211,238,0.15)] active:scale-95"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    <span>View on OOX</span>
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="p-12 flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                            <AlertCircle className="h-10 w-10 opacity-20" />
                            <p className="font-black uppercase tracking-widest text-sm text-center">Data Unavailable</p>
                            <button onClick={onClose} className="text-xs text-cyan-400 font-black uppercase tracking-widest hover:underline transition-all">
                                Return to Gallery
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
