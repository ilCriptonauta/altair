"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { getNFTs, getCreatedNFTs, getCreatedNFTsCount, getCollectedNFTsCount, type NFT, getAccountDetails, getCollectionNFTs, getCollection } from "@/lib/mx-api";
import { NFTCard } from "@/components/nfts/NFTCard";
import { NFTDetailModal } from "@/components/nfts/NFTDetailModal";
import { NFTFolderCard } from "@/components/nfts/NFTFolderCard";
import { ArrowLeft, Image as ImageIcon, Paintbrush, Loader2, Layers, Search, X, Share2, Filter } from "lucide-react";
import Link from "next/link";
import { cn, isValidAddress } from "@/lib/utils";

const PAGE_SIZE = 50;

export default function NFTsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);

    // Data State
    const [collectedNFTs, setCollectedNFTs] = useState<NFT[]>([]);
    const [createdNFTs, setCreatedNFTs] = useState<NFT[]>([]);
    const [collectedCount, setCollectedCount] = useState(0);
    const [createdCount, setCreatedCount] = useState(0);

    // UI State
    const [activeTab, setActiveTab] = useState<"collected" | "created">("collected");
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedNFTIdentifier, setSelectedNFTIdentifier] = useState<string | null>(null);
    const [openedCollection, setOpenedCollection] = useState<string | null>(null);

    // Resolved Address for Sharing (Prioritize ERD)
    const [resolvedAddress, setResolvedAddress] = useState<string>(slug);

    // Collection Names Mapping
    const [collectionNames, setCollectionNames] = useState<Record<string, string>>({});

    // Smart Folder State
    const [currentFolderNFTs, setCurrentFolderNFTs] = useState<NFT[]>([]);
    const [folderLoading, setFolderLoading] = useState(false);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Derived state for current view
    const currentList = activeTab === "collected" ? collectedNFTs : createdNFTs;
    const totalCount = activeTab === "collected" ? collectedCount : createdCount;

    // Filtering Logic
    const displayedList = searchQuery
        ? currentList.filter(nft =>
            nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (nft.collection && nft.collection.toLowerCase().includes(searchQuery.toLowerCase())) ||
            nft.identifier.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : currentList;

    const hasMore = currentList.length < totalCount && !searchQuery; // Disable infinite scroll during search for now (or handle it differently)

    // Grouping Logic
    const groupedNFTs = displayedList.reduce((acc, nft) => {
        const key = nft.collection || "Other";
        if (!acc[key]) acc[key] = [];
        acc[key].push(nft);
        return acc;
    }, {} as Record<string, NFT[]>);

    // Filter valid groups
    const groups = Object.entries(groupedNFTs).sort((a, b) => b[1].length - a[1].length);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                let targetAddress = slug;

                // Resolve address if it's not a direct Bech32
                if (!isValidAddress(slug)) {
                    const account = await getAccountDetails(slug);
                    if (account) {
                        targetAddress = account.address;
                    }
                }
                setResolvedAddress(targetAddress);

                // Full parallel fetch for lists and counts
                const [collected, created, cCount, crCount] = await Promise.all([
                    getNFTs(targetAddress, PAGE_SIZE, 0),
                    getCreatedNFTs(targetAddress, PAGE_SIZE, 0),
                    getCollectedNFTsCount(targetAddress),
                    getCreatedNFTsCount(targetAddress)
                ]);

                setCollectedNFTs(collected);
                setCreatedNFTs(created);
                setCollectedCount(cCount);
                setCreatedCount(crCount);
            } catch (err) {
                console.error("Failed to load nfts", err);
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            fetchData();
        }
    }, [slug]);

    // Handle Folder Open (Smart Fetch)
    const handleOpenFolder = async (collectionId: string) => {
        setOpenedCollection(collectionId);
        setFolderLoading(true);
        setCurrentFolderNFTs([]); // Reset previous

        try {
            let targetAddress = slug;
            if (!slug.startsWith("erd1")) {
                const account = await getAccountDetails(slug);
                if (account) targetAddress = account.address;
            }

            // Fetch FULL collection (up to 1000 items as per updated API)
            const nfts = await getCollectionNFTs(targetAddress, collectionId);
            setCurrentFolderNFTs(nfts);

        } catch (error) {
            console.error("Failed to fetch folder NFTs", error);
        } finally {
            setFolderLoading(false);
        }
    };

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !resolvedAddress) return;

        // Safety check: Don't fetch if address still looks like a herotag or is invalid
        if (!resolvedAddress.startsWith("erd1")) {
            console.warn("Skipping load more: Address not resolved properly", resolvedAddress);
            return;
        }

        setLoadingMore(true);
        try {
            const targetAddress = resolvedAddress;

            if (activeTab === "collected") {
                const currentLength = collectedNFTs.length;
                const more = await getNFTs(targetAddress, PAGE_SIZE, currentLength);
                setCollectedNFTs(prev => [...prev, ...more]);
            } else {
                const currentLength = createdNFTs.length;
                const more = await getCreatedNFTs(targetAddress, PAGE_SIZE, currentLength);
                setCreatedNFTs(prev => [...prev, ...more]);
            }
        } catch (error) {
            console.error("Failed to load more NFTs", error);
        } finally {
            setLoadingMore(false);
        }
    }, [loadingMore, resolvedAddress, activeTab, collectedNFTs.length, createdNFTs.length]);

    // Infinite Scroll Observer
    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                handleLoadMore();
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, handleLoadMore]);




    // Fetch Collection Names
    useEffect(() => {
        const fetchNames = async () => {
            const missingIds = Object.keys(groupedNFTs).filter(id => !collectionNames[id] && id !== "Other");
            if (missingIds.length === 0) return;

            const newNames: Record<string, string> = {};
            // Fetch in chunks or parallel? Let's do parallel with a limit if needed, 
            // but for now simple Promise.all is okay as user rarely has 100s of collections *grouped* at once visible?
            // Actually, displayedList updates on scroll? No, displayedList is full list filtered by search.
            // groupedNFTs is derived from displayedList.

            // Optimization: Only fetch for top X groups? Or fetch all. 
            // Better to just fetch all displayed groups.

            await Promise.all(missingIds.map(async (id) => {
                const col = await getCollection(id);
                if (col) {
                    newNames[id] = col.name;
                } else {
                    newNames[id] = id; // Fallback to ID if failed
                }
            }));

            setCollectionNames(prev => ({ ...prev, ...newNames }));
        };

        if (Object.keys(groupedNFTs).length > 0) {
            fetchNames();
        }
    }, [groupedNFTs]); // collectionNames dependency omitted to avoid loop, we check keys inside

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8 group">
                <div className="flex items-center gap-5">
                    {openedCollection ? (
                        <button
                            onClick={() => setOpenedCollection(null)}
                            className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-cyan-400 hover:text-[#0F172A] hover:border-cyan-400 transition-all shadow-2xl active:scale-90 group/back"
                        >
                            <ArrowLeft className="h-6 w-6 group-hover/back:-translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <Link
                            href={`/dashboard/${slug}`}
                            className="h-14 w-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-cyan-400 hover:text-[#0F172A] hover:border-cyan-400 transition-all shadow-2xl active:scale-90 group/back"
                        >
                            <ArrowLeft className="h-6 w-6 group-hover/back:-translate-x-1 transition-transform" />
                        </Link>
                    )}

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/60">Digital Assets</span>
                        </div>
                        <h1 className="text-3xl font-black text-white md:text-4xl flex items-center gap-3 tracking-tighter uppercase leading-none">
                            {openedCollection ? (
                                <>
                                    {collectionNames[openedCollection] || openedCollection}
                                    <Layers className="h-8 w-8 text-cyan-400 opacity-20" />
                                </>
                            ) : (
                                <>
                                    Gallery <ImageIcon className="h-8 w-8 text-cyan-400 opacity-20" />
                                </>
                            )}
                        </h1>
                    </div>
                </div>

                {openedCollection && (
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Checking out my ${collectionNames[openedCollection] || openedCollection} NFTs on OOX! 🧅 @onionxlabs`)}&url=${encodeURIComponent(`https://www.oox.art/profile/${resolvedAddress}?tab=nfts&collection=${openedCollection}`)}&hashtags=MultiversX,NFT,OOX`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:ml-auto flex items-center justify-center gap-3 rounded-2xl bg-cyan-400 px-8 py-4 text-[#0F172A] hover:bg-white transition-all shadow-2xl shadow-cyan-400/20 active:scale-95 font-black uppercase tracking-widest text-xs"
                    >
                        <Share2 className="h-4 w-4" />
                        <span>Share Gallery</span>
                    </a>
                )}
            </div>

            {/* Premium Filter/Search/Tabs Bar */}
            {!openedCollection && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#1E293B]/20 border border-white/5 p-3 rounded-3xl backdrop-blur-3xl relative overflow-hidden group/bar">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-400/5 blur-[100px] pointer-events-none" />

                    <div className="flex rounded-2xl bg-black/40 p-1.5 border border-white/5 relative z-10 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("collected")}
                            className={cn(
                                "flex-1 sm:flex-none flex items-center justify-center gap-3 rounded-xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === "collected"
                                    ? "bg-cyan-400 text-[#0F172A] shadow-xl shadow-cyan-400/20"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <span>Collected</span>
                            <span className={cn(
                                "rounded-lg px-2 py-0.5 text-[10px] font-black",
                                activeTab === "collected" ? "bg-black/10 text-[#0F172A]" : "bg-white/5 text-slate-600"
                            )}>
                                {collectedCount}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab("created")}
                            className={cn(
                                "flex-1 sm:flex-none flex items-center justify-center gap-3 rounded-xl px-8 py-3 text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === "created"
                                    ? "bg-cyan-400 text-[#0F172A] shadow-xl shadow-cyan-400/20"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <span>Created</span>
                            <span className={cn(
                                "rounded-lg px-2 py-0.5 text-[10px] font-black",
                                activeTab === "created" ? "bg-black/10 text-[#0F172A]" : "bg-white/5 text-slate-600"
                            )}>
                                {createdCount}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto relative z-10">
                        <div className="relative flex-grow group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within/search:text-cyan-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter results..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-80 bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-white font-bold placeholder:text-slate-700 focus:outline-none focus:border-cyan-400/50 transition-all focus:ring-1 focus:ring-cyan-400/20"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square animate-pulse rounded-xl bg-[#1E293B]/30 border border-slate-800/50" />
                    ))}
                </div>
            ) : openedCollection ? (
                // FOLDER VIEW: Show SMART FETCHED NFTs for this collection
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {folderLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 text-[#FBBF24] animate-spin" />
                            <p className="text-slate-400">Loading collection content...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {currentFolderNFTs.map((nft) => (
                                <div key={nft.identifier} onClick={() => setSelectedNFTIdentifier(nft.identifier)} className="cursor-pointer">
                                    <NFTCard nft={nft} />
                                </div>
                            ))}
                            {currentFolderNFTs.length === 0 && (
                                <div className="col-span-full text-center text-slate-500 py-20">
                                    No items found in this collection.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                // MAIN VIEW: Show Groups (Folders) + Singles
                <>
                    <div className="grid grid-cols-2 gap-y-8 gap-x-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {groups.length > 0 ? (
                            groups.map(([collectionName, nfts]) => {
                                // If group has more than 1 item, render Folder
                                if (nfts.length > 1) {
                                    return (
                                        <NFTFolderCard
                                            key={collectionName}
                                            collectionName={collectionNames[collectionName] || collectionName}
                                            nfts={nfts}
                                            onClick={() => handleOpenFolder(collectionName)}
                                        />
                                    );
                                } else {
                                    // If single item, render standard card
                                    return nfts.map((nft) => (
                                        <div key={nft.identifier} onClick={() => setSelectedNFTIdentifier(nft.identifier)} className="cursor-pointer">
                                            <NFTCard nft={nft} />
                                        </div>
                                    ));
                                }
                            })
                        ) : (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                                <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                                    {activeTab === 'collected' ? <ImageIcon className="h-8 w-8 opacity-50" /> : <Paintbrush className="h-8 w-8 opacity-50" />}
                                </div>
                                <p>No {activeTab} NFTs found.</p>
                            </div>
                        )}
                    </div>

                    {/* Infinite Scroll Sentinel */}
                    {hasMore && (
                        <div ref={lastElementRef} className="flex justify-center py-8">
                            {loadingMore && <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />}
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedNFTIdentifier && (
                <NFTDetailModal
                    identifier={selectedNFTIdentifier}
                    onClose={() => setSelectedNFTIdentifier(null)}
                />
            )}
        </div>
    );
}
