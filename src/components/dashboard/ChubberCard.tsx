"use client";

import { useRef } from "react";
import { type NFT } from "@/lib/mx-api";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Custom Onion Icon as User Requested
function OnionIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" style={{ opacity: 0 }} /> {/* Spacer logic reset, drawing real onion below */}
            <path d="M12 2C7 2 3 7 3 13c0 5 4 9 9 9s9-4 9-9c0-6-4-11-9-11zm0 0v16" />
            <path d="M12 18c-3 0-5-2-5-5s2-5 5-5 5 2 5 5-2 5-5 5" />
            <path d="M12 2v3" />
        </svg>
    );
}

interface ChubberCardProps {
    nfts: NFT[];
}

export function ChubberCard({ nfts }: ChubberCardProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 200;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (nfts.length === 0) return null;

    return (
        <div className="rounded-2xl border border-[#F87171] bg-[#1E293B]/30 p-6 backdrop-blur-sm relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F87171]/20 text-[#F87171]">
                    <OnionIcon className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white">CHUBBER</h2>
                    <p className="text-xs text-[#F87171]/80 font-medium tracking-wide uppercase">Exclusive Holder</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <button onClick={() => scroll('left')} className="p-1 rounded-full hover:bg-slate-700/50 text-slate-400 transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={() => scroll('right')} className="p-1 rounded-full hover:bg-slate-700/50 text-slate-400 transition-colors">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content Scroller */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {nfts.map((nft) => (
                    <div
                        key={nft.identifier}
                        className="flex-shrink-0 w-40 snap-start group cursor-pointer"
                    >
                        <div className="aspect-square rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800 relative">
                            <img
                                src={nft.media?.[0]?.thumbnailUrl || nft.url}
                                alt={nft.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                <span className="text-[10px] text-white font-bold truncate w-full">{nft.name}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
