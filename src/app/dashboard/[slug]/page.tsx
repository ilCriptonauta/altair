"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getAccountDetails, type AccountDetails, getCollectionNFTs, type NFT, getAccountDaysActive, getGuardianData, type GuardianData } from "@/lib/mx-api";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Activity, Database, Server, Coins, Image as ImageIcon, Shield, ShieldAlert } from "lucide-react";
import { Copy, Check, Share2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NetworkStatsWidget } from "@/components/dashboard/NetworkStats";
import { ChubberCard } from "@/components/dashboard/ChubberCard";
import { SponsorshipBanner } from "@/components/dashboard/SponsorshipBanner";
import { MarketMovers } from "@/components/dashboard/MarketMovers";

// ... inside the component return ...



export default function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
    const [data, setData] = useState<AccountDetails | null>(null);
    const [chubberNfts, setChubberNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState<string>("");
    const [showRewards, setShowRewards] = useState(false);

    // Days Active Feature
    const [daysActive, setDaysActive] = useState<number | null>(null);
    const [showDaysActive, setShowDaysActive] = useState(false);
    const [isLoadingDays, setIsLoadingDays] = useState(false);

    // Guardian Feature
    const [guardianData, setGuardianData] = useState<GuardianData | null>(null);
    const [showGuardian, setShowGuardian] = useState(false);
    const [isLoadingGuardian, setIsLoadingGuardian] = useState(false);

    // Copy Feedback
    const [isCopied, setIsCopied] = useState(false);
    const [isUrlCopied, setIsUrlCopied] = useState(false);

    // Global Search State
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");
    const router = useRouter();

    // Unwrap params (Next.js 15+ async params pattern)
    const { slug } = use(params);

    useEffect(() => {
        async function fetchData() {
            try {
                const account = await getAccountDetails(slug);
                setData(account);
                setAddress(account ? account.address : slug);

                if (account) {
                    // Fetch Chubber Collection
                    const chubbers = await getCollectionNFTs(account.address, "CHBONX-3e0201");
                    setChubberNfts(chubbers);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        }
        if (slug) {
            fetchData();
        }
    }, [slug]);

    const handleTransactionsClick = async () => {
        if (showDaysActive) {
            setShowDaysActive(false);
            return;
        }

        if (daysActive !== null) {
            setShowDaysActive(true);
            return;
        }

        setIsLoadingDays(true);
        if (data?.address) {
            const days = await getAccountDaysActive(data.address);
            setDaysActive(days);
            setShowDaysActive(true);
        }
        setIsLoadingDays(false);
    };

    const handleShardClick = async () => {
        if (showGuardian) {
            setShowGuardian(false);
            return;
        }

        if (guardianData !== null) {
            setShowGuardian(true);
            return;
        }

        setIsLoadingGuardian(true);
        if (data?.address) {
            const guardian = await getGuardianData(data.address);
            setGuardianData(guardian || { active: false }); // Fallback to inactive if null
            setShowGuardian(true);
        }
        setIsLoadingGuardian(false);
    };

    const handleCopy = () => {
        if (!address) return;
        navigator.clipboard.writeText(address);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleShare = () => {
        if (typeof window === 'undefined') return;
        navigator.clipboard.writeText(window.location.href);
        setIsUrlCopied(true);
        setTimeout(() => setIsUrlCopied(false), 2000);
    };

    const handleGlobalSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!globalSearchQuery.trim()) return;
        router.push(`/dashboard/${globalSearchQuery.trim()}`);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl bg-[#1E293B]/50" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="text-red-400">Account not found</div>;
    }

    const formatBalance = (balance: string) => {
        const val = Number(balance) / 10 ** 18;
        return val.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Sponsorship Banner */}
            <SponsorshipBanner />

            {/* Header Section */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white md:text-4xl">
                        Welcome back {data.username && <span className="text-[#22D3EE]">{data.username.replace(".elrond", "")}</span>}
                    </h1>
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 text-slate-400 mt-1 hover:text-white transition-colors group cursor-pointer"
                        title="Copy Address"
                    >
                        <span className="font-mono text-sm">{address.substring(0, 8)}...{address.substring(address.length - 8)}</span>
                        {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                            <Copy className="h-3.5 w-3.5 group-hover:text-white" />
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {/* Global Search */}
                    <div className="flex items-center rounded-full bg-[#1E293B]/50 border border-slate-800 p-1 relative overflow-hidden transition-all duration-300 h-10">
                        {isGlobalSearchOpen ? (
                            <form onSubmit={handleGlobalSearch} className="flex items-center w-full px-2 animate-in fade-in slide-in-from-right-5 duration-300">
                                <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search erd... or herotag"
                                    value={globalSearchQuery}
                                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-white text-sm w-48 placeholder:text-slate-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsGlobalSearchOpen(false);
                                        setGlobalSearchQuery("");
                                    }}
                                    className="ml-2 p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsGlobalSearchOpen(true)}
                                className="flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-white transition-colors hover:bg-white/5"
                                title="Search Address"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center h-10 w-10 rounded-full border border-slate-800 bg-[#1E293B]/50 text-slate-400 hover:text-white hover:border-[#22D3EE]/50 hover:bg-[#22D3EE]/10 transition-all backdrop-blur-md"
                        title="Share Dashboard"
                    >
                        {isUrlCopied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
                    </button>
                    <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-[#1E293B]/50 px-4 py-2 backdrop-blur-md h-10">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                            Mainnet
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    label="Total Balance"
                    value={`${formatBalance(data.balance)} EGLD`}
                    subValue="Available"
                    icon={Wallet}
                    trend="+2.5%"
                />
                <StatsCard
                    label={showRewards ? "Claimable Rewards" : "Staked"}
                    value={`${formatBalance(showRewards ? (data.claimableRewards || "0") : (data.activeStake || "0"))} EGLD`}
                    subValue={showRewards ? "Click to view Staked" : "Click to view Rewards"}
                    icon={Database}
                    onClick={() => setShowRewards(!showRewards)}
                    className={cn(showRewards && "border-green-500/50 bg-green-500/5")}
                />
                <StatsCard
                    label={showDaysActive ? "Time Active" : "Transactions"}
                    value={
                        isLoadingDays ? "Loading..." :
                            showDaysActive ? `${daysActive ?? 0} Days` :
                                (data.txCount?.toString() || "0")
                    }
                    subValue={showDaysActive ? "Since first transaction" : "Click to see days active"}
                    icon={Activity}
                    onClick={handleTransactionsClick}
                    className={cn(showDaysActive && "border-[#22D3EE]/50 bg-[#22D3EE]/5")}
                />
                <StatsCard
                    label={showGuardian ? "Guardian Status" : "Shard"}
                    value={
                        isLoadingGuardian ? "Loading..." :
                            showGuardian ? (guardianData?.active ? "Active" : "Inactive") :
                                `Shard ${data.shard}`
                    }
                    subValue={showGuardian ? (guardianData?.active ? "Account Protected" : "No Guardian Set") : "Click to check Guardian"}
                    icon={showGuardian ? (guardianData?.active ? Shield : ShieldAlert) : Server}
                    onClick={handleShardClick}
                    className={cn(showGuardian && (guardianData?.active ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"))}
                />
            </div>

            {/* Additional Stats: Tokens & NFTs */}
            <div className="grid gap-6 md:grid-cols-2">
                <StatsCard
                    label="Tokens"
                    value={data.tokenCount?.toLocaleString() || "0"}
                    subValue="ESDT Assets"
                    icon={Coins}
                />
                <StatsCard
                    label="NFTs"
                    value={data.nftCount?.toLocaleString() || "0"}
                    subValue="Collectibles"
                    icon={ImageIcon}
                />
            </div>

            {/* Network Stats Widget */}
            <NetworkStatsWidget address={data.address} />

            {/* Special Widget: Chubber */}
            {chubberNfts.length > 0 && (
                <div className="animate-in slide-in-from-bottom-5 duration-700 delay-200">
                    <ChubberCard nfts={chubberNfts} />
                </div>
            )}

            {/* Market Movers */}
            <MarketMovers />
        </div>
    );
}
