"use client";

import { useEffect, useState } from "react";
import { NFT, getNFT } from "@/lib/mx-api";
import { X, ExternalLink, ShieldCheck, Tag, Copy } from "lucide-react";
import Image from "next/image";

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
        fetchDetails();
    }, [identifier]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!identifier) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Overlay click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-5xl rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-white/20 transition-colors"
                >
                    <X className="h-6 w-6" />
                </button>

                {/* Left Column: Image */}
                <div className="w-full md:w-1/2 bg-[#020617] flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-800 relative shrink-0">
                    {loading ? (
                        <div className="w-full aspect-square rounded-2xl bg-slate-800/50 animate-pulse" />
                    ) : nft?.url ? (
                        <div className="relative w-full aspect-square max-w-md">
                            <Image
                                src={nft.url}
                                alt={nft.name}
                                fill
                                className="object-contain rounded-xl"
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </div>
                    ) : (
                        <div className="w-full aspect-square flex items-center justify-center text-slate-500">
                            No Image Available
                        </div>
                    )}
                </div>

                {/* Right Column: Details */}
                <div className="w-full md:w-1/2 flex flex-col h-auto md:h-full">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            <div className="h-8 w-3/4 bg-slate-800 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-slate-800 rounded animate-pulse" />
                            <div className="h-32 w-full bg-slate-800 rounded animate-pulse" />
                        </div>
                    ) : nft ? (
                        <>
                            <div className="p-6 md:p-8 flex-1 custom-scrollbar overflow-visible md:overflow-y-auto">
                                {/* Header Info */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-[#22D3EE] text-sm font-bold tracking-wider uppercase">
                                            <ShieldCheck className="h-4 w-4" />
                                            {nft.collection}
                                        </div>
                                        {nft.rank && (
                                            <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-white border border-slate-700">
                                                Rank #{nft.rank}
                                            </span>
                                        )}
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
                                        {nft.name}
                                    </h2>
                                </div>

                                {/* Description */}
                                {nft.metadata?.description && (
                                    <div className="mb-8">
                                        <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Description</h3>
                                        <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                            {nft.metadata.description}
                                        </p>
                                    </div>
                                )}

                                {/* Attributes Grid */}
                                {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wide flex items-center gap-2">
                                            <Tag className="h-4 w-4" /> Attributes
                                        </h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                            {nft.metadata.attributes.map((attr, idx) => (
                                                <div key={idx} className="bg-[#1E293B]/50 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition-colors">
                                                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1 truncate">
                                                        {attr.trait_type}
                                                    </p>
                                                    <p className="text-sm font-bold text-slate-200 truncate" title={attr.value}>
                                                        {attr.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 md:p-8 border-t border-slate-800 bg-[#0F172A]/90 backdrop-blur space-y-4 shrink-0 z-10 relative">

                                {/* Technical Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-[#1E293B]/30 rounded-lg p-3 border border-slate-800/50">
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Creator</p>
                                        <div className="flex items-center gap-1">
                                            <p className="text-xs font-mono text-[#22D3EE] truncate" title={nft.creator}>
                                                {nft.creator.substring(0, 6)}...{nft.creator.substring(nft.creator.length - 6)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-[#1E293B]/30 rounded-lg p-3 border border-slate-800/50">
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Royalties</p>
                                        <p className="text-sm font-mono text-white">{nft.royalties ? `${nft.royalties}%` : "0%"}</p>
                                    </div>
                                    <div className="bg-[#1E293B]/30 rounded-lg p-3 border border-slate-800/50">
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Nonce</p>
                                        <p className="text-sm font-mono text-white">#{nft.nonce}</p>
                                    </div>
                                    <div
                                        className="bg-[#1E293B]/30 rounded-lg p-3 border border-slate-800/50 cursor-pointer hover:bg-[#1E293B]/50 transition-colors group/ticker"
                                        onClick={() => {
                                            if (nft.ticker) navigator.clipboard.writeText(nft.ticker);
                                        }}
                                        title="Click to copy Ticker"
                                    >
                                        <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Ticker</p>
                                        <div className="flex items-center gap-1">
                                            <p className="text-sm font-mono text-white truncate">{nft.ticker || "-"}</p>
                                            {nft.ticker && <Copy className="h-3 w-3 text-slate-600 group-hover/ticker:text-[#22D3EE] transition-colors" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                {nft.tags && nft.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {nft.tags.map(tag => (
                                            <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <a
                                    href={`https://oox.art/marketplace/nfts/${identifier}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-[#0F172A] font-black text-lg py-4 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20"
                                >
                                    <ExternalLink className="h-5 w-5" />
                                    View on OOX
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-slate-500">Failed to load details</div>
                    )}
                </div>
            </div>
        </div>
    );
}
