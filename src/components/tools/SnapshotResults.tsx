"use client";

import { useState, useMemo, useEffect } from "react";
import { TokenDetailed, TokenAccount, CollectionDetailed, CollectionAccount, NFT, SftAccount, getAccounts } from "@/lib/mx-api";
import { formatBalance, formatAddress } from "@/lib/utils";
import { Download, PieChart, Table as TableIcon, Trophy, Users, Coins, Layers, FileDigit, PartyPopper, Dna, Loader2 } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { GiveawayModal } from "./GiveawayModal";

interface SnapshotResultsProps {
    type: "token" | "collection" | "sft";
    data: {
        info: TokenDetailed | CollectionDetailed | NFT;
        accounts: (TokenAccount | CollectionAccount | SftAccount)[];
    };
    excludeSC: boolean;
}

export function SnapshotResults({ type, data, excludeSC }: SnapshotResultsProps) {
    const [viewMode, setViewMode] = useState<"chart" | "table">("table");

    // Giveaway State
    const [winner, setWinner] = useState<{ address: string, type: "balanced" | "weighted", herotag?: string } | null>(null);

    // Herotag State
    const [herotags, setHerotags] = useState<Record<string, string>>({});
    const [isExporting, setIsExporting] = useState(false);

    const info = data.info;
    const isToken = type === "token";
    const isSft = type === "sft";

    // Type assertion helpers
    const tokenInfo = isToken ? (info as TokenDetailed) : null;
    const collectionInfo = type === "collection" ? (info as CollectionDetailed) : null;
    const sftInfo = isSft ? (info as NFT) : null;

    // 1. Aggregate Data (Handle duplicates for Collections/SFTs)
    const aggregatedAccounts = useMemo(() => {
        // For standard tokens, usually API returns unique accounts.
        // For Collections/SFTs, we aggregate by address to sum up holdings.
        const map = new Map<string, bigint>();

        data.accounts.forEach(acc => {
            const current = map.get(acc.address) || 0n;
            map.set(acc.address, current + BigInt(acc.balance));
        });

        // Convert back to array
        return Array.from(map.entries()).map(([address, balance]) => ({
            address,
            balance: balance.toString()
        }));
    }, [data.accounts]);

    // 2. Filter Data based on excludeSC and Sort Descending
    const filteredAccounts = useMemo(() => {
        let result = excludeSC
            ? aggregatedAccounts.filter(acc => !acc.address.includes("qqqqqqqqqqqq"))
            : [...aggregatedAccounts];

        return result.sort((a, b) => {
            const diff = BigInt(b.balance) - BigInt(a.balance);
            return diff > 0n ? 1 : diff < 0n ? -1 : 0;
        });
    }, [aggregatedAccounts, excludeSC]);

    // 2. Calculate Stats
    const totalHeld = useMemo(() => {
        return filteredAccounts.reduce((acc, curr) => acc + BigInt(curr.balance), 0n);
    }, [filteredAccounts]);

    // 3. Prepare Chart Data (Top 10 holders for visualization)
    const chartData = useMemo(() => {
        const sorted = [...filteredAccounts].sort((a, b) =>
            Number(BigInt(b.balance) - BigInt(a.balance))
        );
        const top10 = sorted.slice(0, 10);
        const otherBalance = sorted.slice(10).reduce((acc, curr) => acc + BigInt(curr.balance), 0n);

        return {
            items: top10,
            other: otherBalance
        };
    }, [filteredAccounts]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [inputPage, setInputPage] = useState("1");
    const itemsPerPage = 25;

    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
    const paginatedAccounts = useMemo(() => {
        return filteredAccounts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [filteredAccounts, currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            setInputPage(newPage.toString());
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            const page = parseInt(inputPage);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                handlePageChange(page);
            } else {
                setInputPage(currentPage.toString());
            }
        }
    };

    // Herotag Resolution Effect for Current Page
    useEffect(() => {
        const fetchHerotags = async () => {
            // Filter out addresses we already know or that are SCs (if excluded, though filteredAccounts handles that)
            // Smart Contracts usually don't have Herotags, but checking doesn't hurt.
            // We optimize by checking cache.
            const missing = paginatedAccounts
                .map(a => a.address)
                .filter(addr => !herotags[addr] && !addr.includes("qqqqqqqqqqqq"));

            if (missing.length > 0) {
                const accounts = await getAccounts(missing);
                const newTags: Record<string, string> = {};
                accounts.forEach(acc => {
                    if (acc.username) {
                        newTags[acc.address] = acc.username;
                    }
                    // We could mark others as "checked" to avoid re-fetch, but for now this is fine.
                    // To avoid infinite retry loops for users without tags, we might want to set empty string?
                    // Let's set empty string if not found? 
                    // The API returns only found accounts or list of accounts
                    // Actually getAccounts returns details. If username is undefined, they don't have one.
                });
                // We should also mark the ones we checked but have no username as "checked" so we don't spam?
                // For simplicity, we just set the ones found. 
                // A better approach: 
                const updates: Record<string, string> = {};
                missing.forEach(addr => updates[addr] = ""); // Mark as checked (empty)
                accounts.forEach(acc => {
                    if (acc.username) updates[acc.address] = acc.username;
                });

                setHerotags(prev => ({ ...prev, ...updates }));
            }
        };

        const timeout = setTimeout(fetchHerotags, 500); // Debounce slightly
        return () => clearTimeout(timeout);
    }, [paginatedAccounts, herotags]);

    // Giveaway Logic
    const handleGiveaway = async (giveawayType: "balanced" | "weighted") => {
        if (!filteredAccounts.length) return;

        let selectedWinnerAddress = "";

        if (giveawayType === "balanced") {
            // Simple random selection
            const randomIndex = Math.floor(Math.random() * filteredAccounts.length);
            selectedWinnerAddress = filteredAccounts[randomIndex].address;
        } else {
            // Weighted selection based on balance
            const totalBalance = filteredAccounts.reduce((acc, curr) => acc + BigInt(curr.balance), 0n);
            if (totalBalance === 0n) {
                // Fallback to random if total balance is 0
                const randomIndex = Math.floor(Math.random() * filteredAccounts.length);
                selectedWinnerAddress = filteredAccounts[randomIndex].address;
            } else {
                // Simplistic Weighted Random
                let r = Math.random();
                let accumulated = 0;

                for (const acc of filteredAccounts) {
                    const balance = BigInt(acc.balance);
                    const weight = Number(balance * 1000000n / totalBalance) / 1000000; // Normalized weight

                    accumulated += weight;
                    if (r <= accumulated) {
                        selectedWinnerAddress = acc.address;
                        break;
                    }
                }

                if (!selectedWinnerAddress) {
                    selectedWinnerAddress = filteredAccounts[filteredAccounts.length - 1].address;
                }
            }
        }

        // Check if we need to resolve Herotag for the winner
        let winnerHerotag = herotags[selectedWinnerAddress];
        if (!winnerHerotag && !selectedWinnerAddress.includes("qqqqqq")) {
            // Fetch on demand
            const accounts = await getAccounts([selectedWinnerAddress]);
            if (accounts.length > 0 && accounts[0].username) {
                winnerHerotag = accounts[0].username;
                // Update cache too
                setHerotags(prev => ({ ...prev, [selectedWinnerAddress]: winnerHerotag }));
            }
        }

        setWinner({ address: selectedWinnerAddress, type: giveawayType, herotag: winnerHerotag });
    }

    // 4. Export Functions
    const handleExport = async (format: "json" | "csv") => {
        setIsExporting(true);
        try {
            // Resolve ALL Herotags before export
            // Identification of missing herotags in the entire filtered list
            const allAddresses = filteredAccounts.map(a => a.address);
            // We check which ones are missing from cache (and likely not SCs)
            // Optimization: SCs might be filtered out already. 
            // If user really wants "both data", we should try to resolve.
            const missing = allAddresses.filter(addr => herotags[addr] === undefined && !addr.includes("qqqqqqqqqqqq"));

            if (missing.length > 0) {
                // Batch fetch
                const accounts = await getAccounts(missing);
                const updates: Record<string, string> = {};
                missing.forEach(addr => updates[addr] = ""); // Init as empty
                accounts.forEach(acc => {
                    if (acc.username) updates[acc.address] = acc.username;
                });
                setHerotags(prev => ({ ...prev, ...updates }));

                // Update local variable for export usage (since state update might be async/batched)
                // Actually we can just use the merged map
                Object.assign(herotags, updates);
            }

            // Safe access to identifier/ticker
            const ticker = isSft && sftInfo ? sftInfo.identifier : (info as any).ticker;
            const filename = `${ticker}-snapshot-${new Date().toISOString().split('T')[0]}`;

            if (format === "json") {
                const jsonContent = JSON.stringify({
                    info: info,
                    type: type,
                    snapshot_date: new Date().toISOString(),
                    total_holders: filteredAccounts.length,
                    total_assets_held: totalHeld.toString(),
                    holders: filteredAccounts.map(acc => ({
                        ...acc,
                        herotag: herotags[acc.address] || ""
                    }))
                }, null, 2);
                downloadFile(jsonContent, `${filename}.json`, "application/json");
            } else {
                // CSV
                const headers = ["Rank,Address,Herotag,Balance,Percentage"];

                // Total Supply Logic:
                let total = 0n;
                if (isToken) {
                    const rawSupply = tokenInfo?.supply && tokenInfo.supply !== "0" ? tokenInfo.supply
                        : tokenInfo?.circulatingSupply && tokenInfo.circulatingSupply !== "0" ? tokenInfo.circulatingSupply
                            : tokenInfo?.minted || "0";
                    total = BigInt(rawSupply);
                }
                else if (isSft && sftInfo) {
                    // Try to cast to any to see if API gave us supply, or fallback
                    total = (sftInfo as any).supply ? BigInt((sftInfo as any).supply) : totalHeld;
                } else {
                    total = totalHeld;
                }

                const rows = filteredAccounts.map((acc, index) => {
                    const balance = BigInt(acc.balance);
                    // Decimals logic
                    let decimals = 0;
                    if (isToken) decimals = tokenInfo?.decimals || 18;
                    else if (collectionInfo) decimals = collectionInfo.decimals || 0;
                    // SFTs also have decimals sometimes? Usually 0.

                    const readableBalance = formatBalance(acc.balance, decimals);
                    const percentage = total > 0n ? Number((balance * 10000n) / total) / 100 : 0;
                    const tag = herotags[acc.address] || "";

                    return `${index + 1},${acc.address},${tag},${readableBalance},${percentage.toFixed(4)}%`;
                });

                const csvContent = headers.concat(rows).join("\n");
                downloadFile(csvContent, `${filename}.csv`, "text/csv");
            }
        } catch (e) {
            console.error("Export failed", e);
        } finally {
            setIsExporting(false);
        }
    };

    const downloadFile = (content: string, name: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Total for percentage calculation in UI
    let totalSupply = 0n;
    if (isToken) {
        const rawSupply = tokenInfo?.supply && tokenInfo.supply !== "0" ? tokenInfo.supply
            : tokenInfo?.circulatingSupply && tokenInfo.circulatingSupply !== "0" ? tokenInfo.circulatingSupply
                : tokenInfo?.minted || "0";
        totalSupply = BigInt(rawSupply);
    }
    else if (isSft && sftInfo) totalSupply = (sftInfo as any).supply ? BigInt((sftInfo as any).supply) : totalHeld;
    else totalSupply = totalHeld;




    return (
        <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <AnimatePresence>
                <AnimatePresence>
                    {winner && (
                        <GiveawayModal
                            winnerAddress={winner.address}
                            herotag={winner.herotag}
                            type={winner.type}
                            onClose={() => setWinner(null)}
                            onRedraw={() => handleGiveaway(winner.type)}
                        />
                    )}
                </AnimatePresence>
            </AnimatePresence>

            {/* Summary Card */}
            <div className="rounded-2xl bg-[#1E293B]/50 border border-slate-800 p-6 shadow-xl shadow-black/10">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Icon/Image Section */}
                    <div className="shrink-0 h-24 w-24 rounded-2xl bg-[#0F172A] border border-slate-800 flex items-center justify-center p-4 mx-auto md:mx-0 shadow-inner">
                        {(isSft && sftInfo?.url) ? (
                            <img
                                src={sftInfo.url}
                                alt={sftInfo.name}
                                className="h-full w-full object-contain rounded-lg"
                            />
                        ) : (data.info as any).assets?.svgUrl || (data.info as any).assets?.pngUrl ? (
                            <img
                                src={(data.info as any).assets?.svgUrl || (data.info as any).assets?.pngUrl}
                                alt={(data.info as any).ticker}
                                className="h-full w-full object-contain rounded-lg"
                            />
                        ) : (
                            isToken ? <Coins className="h-10 w-10 text-slate-500" /> :
                                isSft ? <FileDigit className="h-10 w-10 text-slate-500" /> :
                                    <Layers className="h-10 w-10 text-slate-500" />
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 min-w-0 space-y-4 w-full text-center md:text-left">
                        <div className="space-y-1">
                            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 justify-center md:justify-start">
                                <h3 className="text-2xl md:text-3xl font-black text-white truncate max-w-full leading-tight">
                                    {info.name}
                                </h3>
                                {!isToken && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="px-2.5 py-0.5 rounded-lg bg-pink-500/10 text-pink-500 text-[10px] font-bold border border-pink-500/20 uppercase tracking-widest leading-none">
                                            {isSft
                                                ? (sftInfo?.type === "SemiFungibleESDT" ? "SFT" : sftInfo?.type === "NonFungibleESDT" ? "NFT" : sftInfo?.type || "SFT")
                                                : (collectionInfo?.type === "SemiFungibleESDT" ? "SFT" : collectionInfo?.type === "NonFungibleESDT" ? "NFT" : collectionInfo?.type || "Collection")
                                            }
                                        </span>
                                        {isSft && sftInfo?.nonce && (
                                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 uppercase tracking-widest leading-none">
                                                #{sftInfo.nonce}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-[#22D3EE] text-sm font-bold font-mono tracking-wide opacity-80">
                                {isSft ? sftInfo?.identifier : (info as any).ticker}
                            </p>
                        </div>

                        {/* Metrics Grid */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-700/50 px-4 py-2 rounded-xl text-sm shadow-sm hover:border-slate-600 transition-colors">
                                <Users className="h-4 w-4 text-[#22D3EE]" />
                                <div className="flex flex-col leading-none gap-0.5 text-left">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Holders</span>
                                    <span className="text-white font-bold">{filteredAccounts.length.toLocaleString()}</span>
                                </div>
                            </div>

                            {totalSupply > 0n && (
                                <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-700/50 px-4 py-2 rounded-xl text-sm shadow-sm hover:border-slate-600 transition-colors">
                                    {isToken ? <Coins className="h-4 w-4 text-[#FBBF24]" /> : <FileDigit className="h-4 w-4 text-[#FBBF24]" />}
                                    <div className="flex flex-col leading-none gap-0.5 text-left">
                                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{isToken ? "Supply" : "Count"}</span>
                                        <span className="text-white font-bold">{formatBalance(totalSupply.toString(), isToken ? tokenInfo?.decimals : 0, 0)}</span>
                                    </div>
                                </div>
                            )}

                            {isToken && tokenInfo?.price && (
                                <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-700/50 px-4 py-2 rounded-xl text-sm shadow-sm hover:border-slate-600 transition-colors">
                                    <span className="text-green-400 font-bold text-lg leading-none">${tokenInfo.price.toFixed(4)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="w-full md:w-auto flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 pl-0">
                        <button
                            onClick={() => handleExport("csv")}
                            disabled={isExporting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-[#22D3EE] text-slate-300 hover:text-[#0F172A] border border-slate-700 hover:border-[#22D3EE] transition-all font-bold text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                            <span>CSV</span>
                        </button>
                        <button
                            onClick={() => handleExport("json")}
                            disabled={isExporting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-[#22D3EE] text-slate-300 hover:text-[#0F172A] border border-slate-700 hover:border-[#22D3EE] transition-all font-bold text-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />}
                            <span>JSON</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Giveaway Section (New) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => handleGiveaway("balanced")}
                    className="group relative overflow-hidden rounded-2xl bg-[#0F172A] border border-green-500/30 p-4 flex items-center gap-4 hover:border-green-500 hover:bg-green-500/5 transition-all text-left"
                >
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <PartyPopper className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wide">Balanced Draw</h4>
                        <p className="text-slate-400 text-xs">Equal chance for every holder</p>
                    </div>
                    <div className="absolute -right-8 -top-8 h-24 w-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all opacity-0 group-hover:opacity-100" />
                </button>

                <button
                    onClick={() => handleGiveaway("weighted")}
                    className="group relative overflow-hidden rounded-2xl bg-[#0F172A] border border-green-500/30 p-4 flex items-center gap-4 hover:border-green-500 hover:bg-green-500/5 transition-all text-left"
                >
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <Dna className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wide">Weighted Draw</h4>
                        <p className="text-slate-400 text-xs">Higher chance for larger holders</p>
                    </div>
                    <div className="absolute -right-8 -top-8 h-24 w-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all opacity-0 group-hover:opacity-100" />
                </button>
            </div>

            {/* Visual Header */}
            <div className="flex items-center justify-between">
                <div className="flex bg-[#0F172A] p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setViewMode("table")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                            viewMode === "table" ? "bg-[#1E293B] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <TableIcon className="h-4 w-4" /> List
                    </button>
                    <button
                        onClick={() => setViewMode("chart")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                            viewMode === "chart" ? "bg-[#1E293B] text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <PieChart className="h-4 w-4" /> Chart
                    </button>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                    Showing {filteredAccounts.length} accounts
                </p>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {viewMode === "table" ? (
                    <div className="bg-[#1E293B]/30 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            {isExporting ? (
                                <div className="flex flex-col items-center justify-center text-slate-500 py-12">
                                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                    <p className="text-sm">Preparing download...</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-[#0F172A] sticky top-0 z-10">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-16 text-center">Rank</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Address / Herotag</th>
                                            <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{isToken ? "Balance" : "Count"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {paginatedAccounts.map((acc, i) => {
                                            const originalIndex = (currentPage - 1) * itemsPerPage + i;
                                            // const balanceBig = BigInt(acc.balance); // Unused variable
                                            const decimals = isToken ? tokenInfo?.decimals : 0;
                                            const herotag = herotags[acc.address];

                                            return (
                                                <tr key={acc.address} className="hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-4 text-xs text-slate-500 font-mono text-center">
                                                        #{originalIndex + 1}
                                                    </td>
                                                    <td className="p-4 text-sm font-mono text-slate-300" title={acc.address}>
                                                        <div className="flex items-center gap-2">
                                                            {herotag ? (
                                                                <span className="text-[#22D3EE] font-bold">@{herotag}</span>
                                                            ) : (
                                                                formatAddress(acc.address)
                                                            )}
                                                            {acc.address.includes("qqqqqq") && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded border border-blue-500/20">SC</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-sm text-[#22D3EE] font-bold">
                                                        {formatBalance(acc.balance, decimals, decimals === 0 ? 0 : 2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && !isExporting && (
                            <div className="flex items-center justify-center gap-4 border-t border-slate-800 bg-[#0F172A]/50 p-4">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="rounded-lg bg-[#1E293B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-400">Page</span>
                                    <input
                                        type="text"
                                        value={inputPage}
                                        onChange={(e) => setInputPage(e.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        className="w-12 rounded-lg bg-[#0F172A] border border-slate-700 px-2 py-1 text-center text-sm text-white focus:border-[#22D3EE] focus:outline-none focus:ring-1 focus:ring-[#22D3EE]"
                                    />
                                    <span className="text-sm text-slate-400">of {totalPages}</span>
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="rounded-lg bg-[#1E293B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-[#1E293B]/30 rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-full h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={[
                                            ...chartData.items.map(item => ({
                                                address: item.address,
                                                balance: item.balance,
                                                value: totalSupply > 0n ? Number((BigInt(item.balance) * 10000n) / totalSupply) : 0
                                            })),
                                            ...(chartData.other > 0n ? [{
                                                address: "Other",
                                                balance: chartData.other.toString(),
                                                value: totalSupply > 0n ? Number((chartData.other * 10000n) / totalSupply) : 0
                                            }] : [])
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {chartData.items.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={[
                                                "#22D3EE", "#3B82F6", "#8B5CF6", "#D946EF", "#F43F5E",
                                                "#F97316", "#FACC15", "#4ADE80", "#2DD4BF", "#94A3B8"
                                            ][index % 10]} />
                                        ))}
                                        {chartData.other > 0n && <Cell key="cell-other" fill="#475569" />}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const balanceBig = BigInt(data.balance);
                                                const share = totalSupply > 0n ? Number((balanceBig * 10000n) / totalSupply) / 100 : 0;
                                                return (
                                                    <div className="bg-[#0F172A] border border-slate-700 p-3 rounded-xl shadow-xl">
                                                        <p className="text-slate-300 font-mono text-xs mb-1">
                                                            {data.address === "Other" ? "Other Holders" : formatAddress(data.address)}
                                                        </p>
                                                        <p className="text-[#22D3EE] font-bold">
                                                            {share.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        content={({ payload }: any) => (
                                            <ul className="space-y-1 text-xs">
                                                {payload?.map((entry: any, index: number) => (
                                                    <li key={`item-${index}`} className="flex items-center gap-2 text-slate-400">
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                        <span className="font-mono">
                                                            {entry.payload && (entry.payload as any).address === "Other"
                                                                ? "Other Holders"
                                                                : formatAddress((entry.payload as any).address || "")}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
