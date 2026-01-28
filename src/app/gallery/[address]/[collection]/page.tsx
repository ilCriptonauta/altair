import { getCollectionNFTs, getAccountDetails } from "@/lib/mx-api";
import { GalleryClientView } from "@/components/gallery/GalleryClientView";
import { Layers, User } from "lucide-react";
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
    let nfts = await getCollectionNFTs(targetAddress, collection);
    let displayCollection = collection;

    // Fallback: If no NFTs found, try upper-case collection ID (common issue with URLs)
    if (nfts.length === 0) {
        const upperCollection = collection.toUpperCase();
        const upperNfts = await getCollectionNFTs(targetAddress, upperCollection);
        if (upperNfts.length > 0) {
            nfts = upperNfts;
            displayCollection = upperCollection;
        }
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-purple-500/30">
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-10 w-10 text-white">
                            {/* Logo SVG */}
                            <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                            >
                                <path
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                    stroke="none"
                                />
                            </svg>
                        </div>
                        <span className="font-black text-xl tracking-tight">Altair</span>
                    </Link>

                    <a
                        href="https://altairstar.vercel.app"
                        target="_blank"
                        className="px-5 py-2.5 rounded-full bg-white text-[#020617] text-sm font-bold transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    >
                        Visit Altair
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
                        {displayCollection}
                    </h1>

                    <div className="flex items-center gap-2 text-slate-400 bg-slate-900/50 px-4 py-1.5 rounded-full border border-slate-800">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">Owned by <span className="text-cyan-400">{displayAddress}</span></span>
                    </div>
                </div>

                {/* Grid */}
                <GalleryClientView nfts={nfts} />
            </main>
        </div>
    );
}
