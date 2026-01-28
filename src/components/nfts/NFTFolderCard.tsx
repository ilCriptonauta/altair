"use client";

import { NFT } from "@/lib/mx-api";
import { Folder, Layers } from "lucide-react";
import Image from "next/image";

interface NFTFolderCardProps {
    collectionName: string;
    nfts: NFT[];
    onClick: () => void;
}

export function NFTFolderCard({ collectionName, nfts, onClick }: NFTFolderCardProps) {
    const thumbnailNFT = nfts[0];
    const count = nfts.length;

    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
            {/* Stack Effect Background Layers */}
            <div className="absolute top-0 w-full h-full bg-slate-800/40 rounded-2xl rotate-3 scale-95 z-0 transition-transform group-hover:rotate-6 border border-slate-700/30" />
            <div className="absolute top-0 w-full h-full bg-slate-800/60 rounded-2xl -rotate-2 scale-95 z-0 transition-transform group-hover:-rotate-4 border border-slate-700/30" />

            {/* Main Card */}
            <div className="relative z-10 w-full aspect-square bg-[#0F172A] rounded-2xl overflow-hidden border border-slate-800 shadow-xl group-hover:border-[#FBBF24]/50 group-hover:shadow-[#FBBF24]/10 transition-all">

                {/* Image Area */}
                <div className="relative h-2/3 w-full bg-[#020617]">
                    {thumbnailNFT?.url ? (
                        <Image
                            src={thumbnailNFT.url}
                            alt={collectionName}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">
                            <Folder className="h-12 w-12 opacity-20" />
                        </div>
                    )}

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent opacity-80" />

                    {/* Badge */}
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-[#FBBF24] px-3 py-1 text-xs font-bold text-[#0F172A] shadow-lg">
                        <Layers className="h-3 w-3" />
                        {count} Items
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative h-1/3 p-4 flex flex-col justify-center">
                    <h3 className="font-bold text-white text-lg truncate leading-tight group-hover:text-[#FBBF24] transition-colors">
                        {collectionName || "Unknown Collection"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">
                        Open Folder
                    </p>
                </div>
            </div>
        </div>
    );
}
