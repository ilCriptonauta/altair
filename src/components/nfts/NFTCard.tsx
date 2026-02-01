import { useState } from "react";
import { type NFT } from "@/lib/mx-api";
import { ChevronDown, Tag, Layers, Calendar, Image as ImageIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { NFTMedia } from "./NFTMedia";

interface NFTCardProps {
    nft: NFT;
}

export function NFTCard({ nft }: NFTCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const renderRank = () => {
        if (!nft.rank) return null;
        return (
            <div className="absolute top-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black text-cyan-400 backdrop-blur-xl border border-white/10 shadow-2xl">
                RANK #{nft.rank}
            </div>
        );
    };

    return (
        <div
            className={cn(
                "group relative flex flex-col h-full rounded-[2rem] border border-white/5 bg-[#1E293B]/20 transition-all duration-500",
                "hover:bg-[#1E293B]/40 hover:border-cyan-400/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-400/5 cursor-pointer",
                isExpanded && "border-cyan-400/20 bg-[#1E293B]/60 z-10"
            )}
        >
            {/* Image Container */}
            <div className="aspect-square w-full overflow-hidden bg-slate-900 relative rounded-t-[2rem]">
                <NFTMedia
                    nft={nft}
                    className="h-full w-full group-hover:scale-110 transition-transform duration-1000"
                />

                {renderRank()}

                {/* Status Badge */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="rounded-xl bg-black/60 px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400 backdrop-blur-xl border border-white/10">
                        {nft.type === "SemiFungibleESDT" ? "SFT" : "NFT"}
                    </div>
                </div>

                {/* Highlight Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>

            {/* Content info */}
            <div className="p-5 flex flex-col gap-2 flex-grow relative z-10 bg-gradient-to-b from-transparent to-black/20 rounded-b-[2rem]">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 truncate">
                        {nft.collection}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded(!isExpanded);
                        }}
                        className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors pointer-events-auto"
                    >
                        <ChevronDown className={cn("h-4 w-4 text-slate-600 transition-transform duration-500", isExpanded && "rotate-180 text-cyan-400")} />
                    </button>
                </div>

                <h4 className="font-black text-white text-sm group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight uppercase tracking-tight">
                    {nft.name}
                </h4>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div
                    className="absolute inset-x-0 top-[95%] z-20 border-x border-b border-white/10 rounded-b-[2rem] bg-[#0F172A]/95 p-6 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-top-4 duration-500"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-col gap-5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        {/* Description */}
                        {nft.metadata?.description && (
                            <div className="space-y-1.5">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Protocol Data</span>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                                    "{nft.metadata.description}"
                                </p>
                            </div>
                        )}

                        {/* Attributes Grid */}
                        {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                            <div className="space-y-2.5">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Core Attributes</span>
                                <div className="grid grid-cols-2 gap-2">
                                    {nft.metadata.attributes.map((attr, i) => (
                                        <div key={i} className="rounded-xl bg-white/5 p-2.5 border border-white/5 hover:border-cyan-400/20 transition-all group/attr">
                                            <div className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-1 truncate">{attr.trait_type}</div>
                                            <div className="text-[10px] font-black text-cyan-100/90 truncate group-hover/attr:text-cyan-400" title={attr.value}>{attr.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                            <a
                                href={`https://explorer.multiversx.com/nfts/${nft.identifier}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400 hover:text-white transition-all active:scale-95"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Index Record
                            </a>
                            <span className="text-[8px] font-mono text-slate-600 font-bold">
                                {nft.identifier.substring(0, 10)}...
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
