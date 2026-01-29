"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { getNFTs, getCreatedNFTs, getCreatedNFTsCount, getCollectedNFTsCount, type NFT, getAccountDetails, getCollectionNFTs, getCollection } from "@/lib/mx-api";
import { NFTCard } from "@/components/nfts/NFTCard";
import { NFTDetailModal } from "@/components/nfts/NFTDetailModal";
import { NFTFolderCard } from "@/components/nfts/NFTFolderCard";
import { ArrowLeft, Image as ImageIcon, Paintbrush, Loader2, Layers, Search, X, Share2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
                // First resolve address if it's a herotag
                let targetAddress = slug;
                if (!slug.startsWith("erd1")) {
                    const account = await getAccountDetails(slug);
                    if (account) {
                        targetAddress = account.address;
                        setResolvedAddress(account.address);
                    }
                } else {
                    setResolvedAddress(slug);
                }

                // Parallel Fetch for efficiency
                // We fetch both to show counts immediately (nice UX)
                const [collected, created, cCount, crCount] = await Promise.all([
                    getNFTs(targetAddress, PAGE_SIZE, 0),       // Limit initial size for perf
                    getCreatedNFTs(targetAddress, PAGE_SIZE, 0), // Limit initial size for perf
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
            <div className="flex items-center gap-4 mb-4">
                {openedCollection ? (
                    <button
                        onClick={() => setOpenedCollection(null)}
                        className="rounded-full bg-[#1E293B]/50 p-2 text-slate-400 hover:bg-[#1E293B] hover:text-white transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                ) : (
                    <Link
                        href={`/dashboard/${slug}`}
                        className="rounded-full bg-[#1E293B]/50 p-2 text-slate-400 hover:bg-[#1E293B] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                )}

                <div>
                    <h1 className="text-2xl font-black text-white md:text-3xl flex items-center gap-2">
                        {openedCollection ? (
                            <>
                                <Layers className="h-6 w-6 text-[#FBBF24]" />
                                {collectionNames[openedCollection] || openedCollection}
                            </>
                        ) : (
                            <>
                                Gallery <ImageIcon className="h-6 w-6 text-[#22D3EE] opacity-50" />
                            </>
                        )}
                    </h1>
                </div>

                {openedCollection && (
                    <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Checking out my ${collectionNames[openedCollection] || openedCollection} NFTs on OOX! 🧅 @onionxlabs`)}&url=${encodeURIComponent(`https://www.oox.art/profile/${resolvedAddress}?tab=nfts&collection=${openedCollection}`)}&hashtags=MultiversX,NFT,OOX`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-2 rounded-xl bg-[#FBBF24] px-4 py-2 text-[#0F172A] hover:bg-[#F59E0B] transition-all shadow-lg active:scale-95 font-bold"
                    >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Share Collection</span>
                    </a>
                )}
            </div>

            {/* Tabs Navigation (Pill Style) - Hide when folder is open? Or keep to switch context? Keep but maybe disabled or hidden for cleanliness */}
            {!openedCollection && (
                <div className="flex justify-center mb-8">
                    <div className="flex rounded-full bg-[#1E293B] p-1 border border-slate-800/50 relative overflow-hidden transition-all duration-300">
                        {isSearchOpen ? (
                            <div className="flex items-center w-full px-2 animate-in fade-in slide-in-from-right-5 duration-300">
                                <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search by name, collection or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-white text-sm w-64 placeholder:text-slate-500"
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className="ml-2 p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setActiveTab("collected")}
                                    className={cn(
                                        "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all",
                                        activeTab === "collected"
                                            ? "bg-[#FBBF24] text-[#0F172A] shadow-md"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <span>Collected</span>
                                    <span className={cn(
                                        "rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                                        activeTab === "collected"
                                            ? "bg-[#0F172A]/10 text-[#0F172A]"
                                            : "bg-slate-800 text-slate-500"
                                    )}>
                                        {collectedCount}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("created")}
                                    className={cn(
                                        "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all",
                                        activeTab === "created"
                                            ? "bg-[#FBBF24] text-[#0F172A] shadow-md"
                                            : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <span>Created</span>
                                    <span className={cn(
                                        "rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                                        activeTab === "created"
                                            ? "bg-[#0F172A]/10 text-[#0F172A]"
                                            : "bg-slate-800 text-slate-500"
                                    )}>
                                        {createdCount}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="flex items-center justify-center rounded-full px-4 py-2 text-slate-400 hover:text-white transition-colors hover:bg-white/5"
                                    title="Search NFTs"
                                >
                                    <Search className="h-4 w-4" />
                                </button>
                            </>
                        )}
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
