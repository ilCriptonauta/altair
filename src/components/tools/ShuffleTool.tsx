"use client";

import { useState } from "react";
import { Shuffle, ExternalLink, Loader2, RefreshCw, Sparkles, Share2, Dice5 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CURATED_COLLECTION_IDS } from "@/constants/curated_collections";
import { getCollectionNFTCount, getGlobalCollectionNFTs, NFT } from "@/lib/mx-api";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ShuffleTool() {
    const [isShuffling, setIsShuffling] = useState(false);
    const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleShuffle = async () => {
        if (isShuffling) return;

        setIsShuffling(true);
        setSelectedNFT(null);
        setError(null);

        try {
            const randomCollectionId = CURATED_COLLECTION_IDS[Math.floor(Math.random() * CURATED_COLLECTION_IDS.length)];
            const count = await getCollectionNFTCount(randomCollectionId);

            if (count === 0) throw new Error(`Empty vault detected.`);

            const maxIndex = Math.max(0, count - 1);
            const randomIndex = Math.floor(Math.random() * maxIndex);
            const nfts = await getGlobalCollectionNFTs(randomCollectionId, randomIndex, 1);

            if (!nfts || nfts.length === 0) throw new Error("Synchronization failure.");

            await new Promise(resolve => setTimeout(resolve, 2000));
            setSelectedNFT(nfts[0]);
        } catch (err: any) {
            console.error(err);
            setError("Discovery protocol failed. Please re-initialize.");
        } finally {
            setIsShuffling(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-6 duration-700">
            {/* Header Area */}
            <div className="text-center space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2.2rem] bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-2xl shadow-purple-500/10 mb-2">
                    <Dice5 className="h-10 w-10" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Masterpiece Shuffle</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest leading-relaxed">
                        Discover elite digital assets across the MultiversX ecosystem
                    </p>
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative w-full flex flex-col items-center group">
                {/* Background Aura */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="relative w-full max-w-sm aspect-square rounded-[3rem] bg-[#1E293B]/20 border border-white/5 p-4 backdrop-blur-3xl overflow-hidden shadow-2xl">
                    <AnimatePresence mode="wait">
                        {!isShuffling && !selectedNFT ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-white/5 rounded-[2.5rem]"
                            >
                                <div className="p-5 rounded-3xl bg-white/5">
                                    <Sparkles className="h-8 w-8 text-slate-700" />
                                </div>
                                <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">Scanner Offline</p>
                            </motion.div>
                        ) : isShuffling ? (
                            <motion.div
                                key="shuffling"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center space-y-10"
                            >
                                <div className="relative h-40 w-40">
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute inset-0 rounded-[2rem] border border-purple-500/30 bg-purple-500/10"
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 90 * i, 180 * i],
                                                opacity: [0.1, 0.4, 0.1]
                                            }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                    <div className="absolute inset-x-0 bottom-[-40px] flex justify-center">
                                        <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                                    </div>
                                </div>
                                <p className="text-purple-400 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing Vaults...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ scale: 0.8, opacity: 0, rotateY: 45 }}
                                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                                transition={{ type: "spring", damping: 20 }}
                                className="w-full h-full relative"
                            >
                                <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-2xl group/img">
                                    {(selectedNFT?.media?.[0]?.url || selectedNFT?.url) ? (
                                        <Image
                                            src={selectedNFT?.media?.[0]?.thumbnailUrl || selectedNFT?.media?.[0]?.url || selectedNFT?.url || ""}
                                            alt={selectedNFT?.name || "NFT"}
                                            fill
                                            className="object-cover transition-transform duration-1000 group-hover/img:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                            <p className="text-slate-600 font-black text-xs uppercase tracking-widest">No Media Proxy</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* NFT Details Card */}
                <AnimatePresence>
                    {selectedNFT && !isShuffling && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="w-full max-w-sm mt-8 space-y-6 text-center"
                        >
                            <div>
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{selectedNFT.name}</h3>
                                <p className="text-purple-400/80 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
                                    {selectedNFT.collection} Collection
                                </p>
                            </div>

                            <div className="flex flex-row gap-3 w-full">
                                <a
                                    href={`https://oox.art/marketplace/nfts/${selectedNFT.identifier}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest transition-all hover:scale-[1.03] shadow-2xl shadow-purple-500/20 active:scale-95 text-[10px]"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    <span>View on OOX</span>
                                </a>

                                <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just discovered ${selectedNFT.name} from ${selectedNFT.collection} collection! 🎲🔥\n\nFound using the Shuffle Tool on Altair.\n\n`)}&url=${encodeURIComponent(`https://oox.art/marketplace/nfts/${selectedNFT.identifier}`)}&hashtags=MultiversX,NFT,Altair`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 text-[10px]"
                                >
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span>Share</span>
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Action Button */}
            <div className="pt-4 flex flex-col items-center gap-4">
                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase tracking-widest">
                        {error}
                    </motion.p>
                )}

                <button
                    onClick={handleShuffle}
                    disabled={isShuffling}
                    className="relative group p-[2px] rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-30"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 animate-gradient-x" />
                    <div className="relative h-16 px-12 rounded-full bg-black flex items-center justify-center gap-4 text-white hover:bg-transparent transition-colors">
                        {isShuffling ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span className="font-black uppercase tracking-[0.3em] text-xs">Processing...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
                                <span className="font-black uppercase tracking-[0.3em] text-xs">
                                    Shuffle Now
                                </span>
                            </>
                        )}
                    </div>
                </button>
            </div>

            {/* Background Stats (Subtle) */}
            {!isShuffling && !selectedNFT && (
                <div className="grid grid-cols-2 gap-10 opacity-20 group-hover:opacity-40 transition-opacity">
                    <div className="text-center">
                        <p className="text-3xl font-black text-white tabular-nums">1.2M+</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Curated Assets</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-black text-white tabular-nums">42.5K</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Collections</p>
                    </div>
                </div>
            )}
        </div>
    );
}
