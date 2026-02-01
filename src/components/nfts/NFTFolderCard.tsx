"use client";

import { NFT } from "@/lib/mx-api";
import { Folder, Layers, ArrowRight } from "lucide-react";
import { NFTMedia } from "./NFTMedia";
import { motion } from "framer-motion";

interface NFTFolderCardProps {
    collectionName: string;
    nfts: NFT[];
    onClick: () => void;
}

export function NFTFolderCard({ collectionName, nfts, onClick }: NFTFolderCardProps) {
    const thumbnailNFT = nfts[0];
    const count = nfts.length;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className="group relative cursor-pointer"
        >
            {/* Multi-Stack Effect Layers */}
            <div className="absolute top-0 w-full h-full bg-slate-800/40 rounded-[2rem] rotate-3 scale-95 z-0 transition-transform duration-500 group-hover:rotate-6 border border-white/5" />
            <div className="absolute top-0 w-full h-full bg-slate-800/60 rounded-[2rem] -rotate-2 scale-95 z-0 transition-transform duration-500 group-hover:-rotate-4 border border-white/5" />

            {/* Main Card */}
            <div className="relative z-10 w-full aspect-square bg-[#0F172A]/80 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl backdrop-blur-xl group-hover:border-cyan-400/30 transition-all duration-500">

                {/* Image Area */}
                <div className="relative h-[70%] w-full bg-black/40">
                    <NFTMedia
                        nft={thumbnailNFT}
                        className="h-full w-full transition-transform duration-1000 group-hover:scale-110"
                    />

                    {/* Glassy Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-90" />

                    {/* Premium Item Badge */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-2xl bg-cyan-400 px-3 py-1.5 text-[10px] font-black text-[#0F172A] shadow-xl shadow-cyan-400/20 uppercase tracking-widest border border-white/20">
                        <Layers className="h-3 w-3" />
                        {count} Items
                    </div>
                </div>

                {/* Info Area */}
                <div className="h-[30%] px-5 flex flex-col justify-center relative bg-gradient-to-b from-transparent to-black/20">
                    <h3 className="font-black text-white text-base truncate leading-none group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                        {collectionName || "Unknown Collection"}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1 duration-500">
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Open Folder</span>
                        <ArrowRight className="h-3 w-3 text-cyan-400" />
                    </div>
                </div>

                {/* Subtle Hover Glow */}
                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
        </motion.div>
    );
}
