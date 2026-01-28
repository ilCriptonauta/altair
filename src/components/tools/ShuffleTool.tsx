"use client";

import { useState } from "react";
import { Shuffle, ExternalLink, Loader2, RefreshCw, ZoomIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CURATED_COLLECTION_IDS } from "@/constants/curated_collections";
import { getCollectionNFTCount, getGlobalCollectionNFTs, NFT } from "@/lib/mx-api";
import Image from "next/image";

export function ShuffleTool() {
    const [isShuffling, setIsShuffling] = useState(false);
    const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [shuffleKey, setShuffleKey] = useState(0); // For animation reset

    const handleShuffle = async () => {
        if (isShuffling) return;

        setIsShuffling(true);
        setSelectedNFT(null);
        setError(null);
        setShuffleKey(prev => prev + 1);

        try {
            // 1. Pick a random collection
            const randomCollectionId = CURATED_COLLECTION_IDS[Math.floor(Math.random() * CURATED_COLLECTION_IDS.length)];

            // 2. Get Total Count for that collection
            const count = await getCollectionNFTCount(randomCollectionId);

            if (count === 0) {
                // Retry once or just fail gracefully
                throw new Error(`Collection ${randomCollectionId} has no NFTs.`);
            }

            // 3. Pick a random index
            // API limit might prevent deep pagination, but let's try.
            // Safe bet: usually up to 10k is fine. If count > 10k, maybe cap at 10k for performance?
            // Actually API usually handles 'from' parameter well.
            const maxIndex = Math.max(0, count - 1);
            const randomIndex = Math.floor(Math.random() * maxIndex);

            // 4. Fetch the NFT
            const nfts = await getGlobalCollectionNFTs(randomCollectionId, randomIndex, 1);

            if (!nfts || nfts.length === 0) {
                throw new Error("Failed to fetch NFT.");
            }

            const nft = nfts[0];

            // Artificial delay for animation effect
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSelectedNFT(nft);

        } catch (err: any) {
            console.error(err);
            setError("Failed to shuffle. Please try again.");
        } finally {
            setIsShuffling(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="h-16 w-16 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                    <Shuffle className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">NFT Shuffle</h2>
                <p className="text-slate-400">Discover random masterpieces from curated collections</p>
            </div>

            {/* Display Area */}
            <div className="relative w-full flex flex-col items-center mb-8">
                <div className="relative w-full aspect-square max-w-sm">
                    <AnimatePresence mode="wait">
                        {/* Idle State / Placeholder */}
                        {!isShuffling && !selectedNFT && !error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full h-full rounded-2xl bg-[#0F172A] border-2 border-dashed border-slate-700 flex items-center justify-center"
                            >
                                <p className="text-slate-500 text-sm font-medium">Ready to shuffle</p>
                            </motion.div>
                        )}

                        {/* Shuffle Animation State */}
                        {isShuffling && (
                            <motion.div
                                key="shuffling"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                {/* Card Stack Animation */}
                                {[1, 2, 3].map((index) => (
                                    <motion.div
                                        key={index}
                                        className="absolute w-40 h-40 bg-purple-500/20 rounded-xl border border-purple-500/30 backdrop-blur-sm"
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            rotate: [0, 180, 360],
                                            opacity: [0.5, 1, 0.5]
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            delay: index * 0.1,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                                <div className="z-10 bg-[#0F172A]/80 p-4 rounded-full backdrop-blur-md border border-white/10">
                                    <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
                                </div>
                            </motion.div>
                        )}

                        {/* Result State */}
                        {selectedNFT && !isShuffling && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="relative w-full h-full group perspective-1000"
                            >
                                <div className="relative w-full h-full rounded-2xl overflow-hidden border border-purple-500/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)] bg-[#0F172A] transition-all duration-300 group-hover:border-purple-500/60 group-hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.4)]">
                                    {selectedNFT.media?.[0]?.url || selectedNFT.url ? (
                                        <Image
                                            src={selectedNFT.media?.[0]?.thumbnailUrl || selectedNFT.media?.[0]?.url || selectedNFT.url}
                                            alt={selectedNFT.name || "NFT"}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                            <p className="text-slate-500">No Image</p>
                                        </div>
                                    )}

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Info Below Image */}
                {selectedNFT && !isShuffling && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6 text-center space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {selectedNFT.collection}
                            </span>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white">{selectedNFT.name}</h3>
                            <p className="text-sm text-slate-500 font-mono">ID: {selectedNFT.identifier}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center w-full">
                            <a
                                href={`https://oox.art/marketplace/nfts/${selectedNFT.identifier}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
                            >
                                <ExternalLink className="h-4 w-4" />
                                View on OOX
                            </a>

                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just discovered ${selectedNFT.name} from ${selectedNFT.collection} collection! 🎲🔥\n\nFound using the Shuffle Tool on Altair.\n\n`)}&url=${encodeURIComponent(`https://oox.art/marketplace/nfts/${selectedNFT.identifier}`)}&hashtags=MultiversX,NFT,Altair`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-black hover:bg-slate-900 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg border border-slate-800"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                Share on X
                            </a>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 bg-red-500/10 px-4 py-2 rounded-lg text-sm mb-4"
                >
                    {error}
                </motion.div>
            )}

            {/* Action Button */}
            <button
                onClick={handleShuffle}
                disabled={isShuffling}
                className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative flex items-center gap-2">
                    {isShuffling ? (
                        <>
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            Shuffling...
                        </>
                    ) : (
                        <>
                            <Shuffle className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                            {selectedNFT ? "Shuffle Again" : "Shuffle Now"}
                        </>
                    )}
                </span>
            </button>
        </div>
    );
}
