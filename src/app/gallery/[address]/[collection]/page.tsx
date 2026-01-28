import { getCollectionNFTs, getAccountDetails } from "@/lib/mx-api";
import { NFTCard } from "@/components/nfts/NFTCard";
import { Layers, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 60; // Revalidate every minute

export default async function GalleryPage({
    params
}: {
    params: Promise<{ address: string; collection: string }>
}) {
    const { address, collection } = await params;

    // Resolve Address (handle herotags)
    let targetAddress = address;
    let displayAddress = address;
    if (!address.startsWith("erd1")) {
        const account = await getAccountDetails(address);
        if (account) {
            targetAddress = account.address;
            displayAddress = address; // Keep herotag for display
        }
    } else {
        // Try to reverse resolve? No, just keep erd.
        // Or if we want to show herotag, we'd need another call.
        // For simplicity, display truncated erd if long.
        displayAddress = `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
    }

    // Fetch NFTs
    const nfts = await getCollectionNFTs(targetAddress, collection);

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-purple-500/30">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 relative">
                            {/* Simple Logo Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-lg transform rotate-3" />
                            <div className="absolute inset-0 bg-[#0F172A] rounded-lg m-0.5" />
                            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-purple-600">
                                A
                            </div>
                        </div>
                        <span className="font-bold text-lg tracking-tight">Altair</span>
                    </Link>

                    <a
                        href="https://altair.app"
                        target="_blank"
                        className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-bold transition-colors border border-white/5"
                    >
                        Get Altair
                    </a>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 sm:py-12">
                {/* Hero / Collection Info */}
                <div className="flex flex-col items-center text-center space-y-4 mb-12">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 ring-1 ring-white/10 mb-2">
                        <Layers className="h-8 w-8 text-cyan-400" />
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                        {collection}
                    </h1>

                    <div className="flex items-center gap-2 text-slate-400 bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-800">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">Owned by <span className="text-cyan-400">{displayAddress}</span></span>
                    </div>
                </div>

                {/* Grid */}
                {nfts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {nfts.map((nft) => (
                            <div key={nft.identifier} className="transform hover:scale-[1.02] transition-transform duration-300">
                                <NFTCard nft={nft} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <p>No NFTs found in this collection.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-600 text-sm border-t border-white/5 mt-12 bg-slate-950/50">
                <p>Powered by <a href="https://altair.app" className="text-slate-400 hover:text-white transition-colors">Altair</a> &bull; MultiversX Network</p>
            </footer>
        </div>
    );
}
