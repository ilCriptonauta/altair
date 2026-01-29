"use client";

import { useState } from "react";
import { type NFT } from "@/lib/mx-api";
import { ChevronDown, Tag, Layers, Calendar, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NFTMedia } from "./NFTMedia";

interface NFTCardProps {
    nft: NFT;
}

export function NFTCard({ nft }: NFTCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Rank/Score Badge

    // Rank/Score Badge
    const renderRank = () => {
        if (!nft.rank) return null;
        return (
            <div className="absolute top-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-[#22D3EE] backdrop-blur-md border border-[#22D3EE]/20">
                Rank #{nft.rank}
            </div>
        );
    };

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-slate-800 bg-[#1E293B]/40 transition-all hover:bg-[#1E293B]/60 cursor-pointer flex flex-col h-full",
                isExpanded && "border-[#22D3EE]/30 bg-[#1E293B]/80 z-10"
            )}
        >
            {/* Image Container */}
            <div className="aspect-square w-full overflow-hidden bg-slate-900 relative">
                <NFTMedia
                    nft={nft}
                    className="h-full w-full group-hover:scale-105 transition-transform duration-500"
                />

                {renderRank()}

                {/* Overlay Gradient on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
            </div>

            {/* Content info */}
            <div className="p-3 flex flex-col gap-1 flex-grow">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 line-clamp-1">
                    {nft.collection}
                </span>
                <span className="font-bold text-white text-sm line-clamp-1 group-hover:text-[#22D3EE] transition-colors">
                    {nft.name}
                </span>

                <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="rounded-full bg-slate-800/50 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-700/50">
                        {nft.type === "SemiFungibleESDT" ? "SFT" : "NFT"}
                    </span>
                    <ChevronDown className={cn("h-3 w-3 text-slate-500 transition-transform", isExpanded && "rotate-180")} />
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="absolute inset-x-0 top-full z-20 -mt-2 border-x border-b border-[#22D3EE]/30 rounded-b-xl bg-[#1E293B] p-4 shadow-xl animate-in slide-in-from-top-2">
                    <div className="flex flex-col gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {/* Tags */}
                        {nft.tags && nft.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {nft.tags.slice(0, 5).map(tag => (
                                    <span key={tag} className="text-[10px] text-slate-400">#{tag}</span>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        {nft.metadata?.description && (
                            <p className="text-xs text-slate-300 leading-relaxed">
                                {nft.metadata.description}
                            </p>
                        )}

                        {/* Attributes Grid */}
                        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                {nft.metadata.attributes.map((attr, i) => (
                                    <div key={i} className="rounded bg-[#0F172A]/50 p-1.5 border border-slate-800/50">
                                        <div className="text-[9px] uppercase text-slate-500 mb-0.5">{attr.trait_type}</div>
                                        <div className="text-[10px] font-medium text-white line-clamp-1" title={attr.value}>{attr.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <a
                            href={`https://explorer.multiversx.com/nfts/${nft.identifier}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 text-center text-xs text-[#22D3EE] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            View on Explorer
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
