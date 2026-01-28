"use client";

import { useState } from "react";
import { NFT } from "@/lib/mx-api";
import { NFTCard } from "@/components/nfts/NFTCard";
import { NFTDetailModal } from "@/components/nfts/NFTDetailModal";

interface GalleryClientViewProps {
    nfts: NFT[];
}

export function GalleryClientView({ nfts }: GalleryClientViewProps) {
    const [selectedNFTIdentifier, setSelectedNFTIdentifier] = useState<string | null>(null);

    return (
        <>
            {nfts.length > 0 ? (
                <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {nfts.map((nft) => (
                        <div
                            key={nft.identifier}
                            onClick={() => setSelectedNFTIdentifier(nft.identifier)}
                            className="transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
                        >
                            <NFTCard nft={nft} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <p>No NFTs found in this collection.</p>
                </div>
            )}

            {/* Detail Modal */}
            {selectedNFTIdentifier && (
                <NFTDetailModal
                    identifier={selectedNFTIdentifier}
                    onClose={() => setSelectedNFTIdentifier(null)}
                />
            )}
        </>
    );
}
