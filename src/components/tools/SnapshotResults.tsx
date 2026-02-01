"use client";

import { useState, useMemo, useEffect } from "react";
import { TokenDetailed, TokenAccount, CollectionDetailed, CollectionAccount, NFT, SftAccount, getAccounts } from "@/lib/mx-api";
import { formatBalance, formatAddress } from "@/lib/utils";
import { Download, PieChart, Table as TableIcon, Trophy, Users, Coins, Layers, FileDigit, PartyPopper, Dna, Loader2, ArrowRight, BarChart3 } from "lucide-react";
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
    const [winner, setWinner] = useState<{ address: string, type: "balanced" | "weighted", herotag?: string } | null>(null);
    const [herotags, setHerotags] = useState<Record<string, string>>({});
    const [isExporting, setIsExporting] = useState(false);

    const info = data.info;
    const isToken = type === "token";
    const isSft = type === "sft";

    const tokenInfo = isToken ? (info as TokenDetailed) : null;
    const collectionInfo = type === "collection" ? (info as CollectionDetailed) : null;
    const sftInfo = isSft ? (info as NFT) : null;

    const aggregatedAccounts = useMemo(() => {
        const map = new Map<string, bigint>();
        data.accounts.forEach(acc => {
            const current = map.get(acc.address) || 0n;
            map.set(acc.address, current + BigInt(acc.balance));
        });
        return Array.from(map.entries()).map(([address, balance]) => ({
            address,
            balance: balance.toString()
        }));
    }, [data.accounts]);

    const filteredAccounts = useMemo(() => {
        let result = excludeSC
            ? aggregatedAccounts.filter(acc => !acc.address.includes("qqqqqqqqqqqq"))
            : [...aggregatedAccounts];

        return result.sort((a, b) => {
            const diff = BigInt(b.balance) - BigInt(a.balance);
            return diff > 0n ? 1 : diff < 0n ? -1 : 0;
        });
    }, [aggregatedAccounts, excludeSC]);

    const totalHeld = useMemo(() => {
        return filteredAccounts.reduce((acc, curr) => acc + BigInt(curr.balance), 0n);
    }, [filteredAccounts]);

    const chartData = useMemo(() => {
        const sorted = [...filteredAccounts].sort((a, b) =>
            Number(BigInt(b.balance) - BigInt(a.balance))
        );
        const top10 = sorted.slice(0, 10);
        const otherBalance = sorted.slice(10).reduce((acc, curr) => acc + BigInt(curr.balance), 0n);

        return { items: top10, other: otherBalance };
    }, [filteredAccounts]);

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

    useEffect(() => {
        const fetchHerotags = async () => {
            const missing = paginatedAccounts
                .map(a => a.address)
                .filter(addr => !herotags[addr] && !addr.includes("qqqqqqqqqqqq"));

            if (missing.length > 0) {
                const accounts = await getAccounts(missing);
                const updates: Record<string, string> = {};
                missing.forEach(addr => updates[addr] = "");
                accounts.forEach(acc => {
                    if (acc.username) updates[acc.address] = acc.username;
                });
                setHerotags(prev => ({ ...prev, ...updates }));
            }
        };
        const timeout = setTimeout(fetchHerotags, 500);
        return () => clearTimeout(timeout);
    }, [paginatedAccounts, herotags]);

    const handleGiveaway = async (giveawayType: "balanced" | "weighted") => {
        if (!filteredAccounts.length) return;
        let selectedWinnerAddress = "";

        if (giveawayType === "balanced") {
            const randomIndex = Math.floor(Math.random() * filteredAccounts.length);
            selectedWinnerAddress = filteredAccounts[randomIndex].address;
        } else {
            const totalBalance = filteredAccounts.reduce((acc, curr) => acc + BigInt(curr.balance), 0n);
            if (totalBalance === 0n) {
                const randomIndex = Math.floor(Math.random() * filteredAccounts.length);
                selectedWinnerAddress = filteredAccounts[randomIndex].address;
            } else {
                let r = Math.random();
                let accumulated = 0;
                for (const acc of filteredAccounts) {
                    const balance = BigInt(acc.balance);
                    const weight = Number(balance * 1000000n / totalBalance) / 1000000;
                    accumulated += weight;
                    if (r <= accumulated) {
                        selectedWinnerAddress = acc.address;
                        break;
                    }
                }
                if (!selectedWinnerAddress) selectedWinnerAddress = filteredAccounts[filteredAccounts.length - 1].address;
            }
        }

        let winnerHerotag = herotags[selectedWinnerAddress];
        if (!winnerHerotag && !selectedWinnerAddress.includes("qqqqqq")) {
            const accounts = await getAccounts([selectedWinnerAddress]);
            if (accounts.length > 0 && accounts[0].username) {
                winnerHerotag = accounts[0].username;
                setHerotags(prev => ({ ...prev, [selectedWinnerAddress]: winnerHerotag }));
            }
        }
        setWinner({ address: selectedWinnerAddress, type: giveawayType, herotag: winnerHerotag });
    };

    const handleExport = async (format: "json" | "csv") => {
        setIsExporting(true);
        try {
            const ticker = isSft && sftInfo ? sftInfo.identifier : (info as any).ticker;
            const filename = `${ticker}-snapshot-${new Date().toISOString().split('T')[0]}`;

            if (format === "json") {
                const jsonContent = JSON.stringify({
                    info, type, snapshot_date: new Date().toISOString(),
                    total_holders: filteredAccounts.length,
                    total_assets_held: totalHeld.toString(),
                    holders: filteredAccounts.map(acc => ({ ...acc, herotag: herotags[acc.address] || "" }))
                }, null, 2);
                downloadFile(jsonContent, `${filename}.json`, "application/json");
            } else {
                const headers = ["Rank,Address,Herotag,Balance,Percentage"];
                let total = 0n;
                if (isToken) total = BigInt(tokenInfo?.supply || tokenInfo?.circulatingSupply || "0");
                else if (isSft && sftInfo) total = (sftInfo as any).supply ? BigInt((sftInfo as any).supply) : totalHeld;
                else total = totalHeld;

                const rows = filteredAccounts.map((acc, index) => {
                    const decimals = isToken ? tokenInfo?.decimals || 18 : collectionInfo?.decimals || 0;
                    const readableBalance = formatBalance(acc.balance, decimals);
                    const percentage = total > 0n ? Number((BigInt(acc.balance) * 10000n) / total) / 100 : 0;
                    return `${index + 1},${acc.address},${herotags[acc.address] || ""},${readableBalance},${percentage.toFixed(4)}%`;
                });
                downloadFile(headers.concat(rows).join("\n"), `${filename}.csv`, "text/csv");
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
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    };

    let totalSupply = 0n;
    if (isToken) totalSupply = BigInt(tokenInfo?.supply || tokenInfo?.circulatingSupply || "0");
    else if (isSft && sftInfo) totalSupply = (sftInfo as any).supply ? BigInt((sftInfo as any).supply) : totalHeld;
    else totalSupply = totalHeld;

    return (
        <div className="w-full space-y-8 animate-in slide-in-from-bottom-6 duration-700">
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

            {/* Summary Card */}
            <div className="rounded-[2.5rem] bg-[#1E293B]/20 border border-white/5 p-8 backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-transparent opacity-50" />

                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    {/* Visual Section */}
                    <div className="shrink-0 h-32 w-32 rounded-[2rem] bg-black/40 border border-white/10 flex items-center justify-center p-5 shadow-2xl relative overflow-hidden group/img">
                        {(isSft && sftInfo?.url) ? (
                            <img src={sftInfo.url} alt={sftInfo.name} className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover/img:scale-110" />
                        ) : (data.info as any).assets?.pngUrl ? (
                            <img src={(data.info as any).assets?.pngUrl} alt={(data.info as any).ticker} className="h-full w-full object-contain rounded-xl transition-transform duration-500 group-hover/img:scale-110" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 opacity-40">
                                {isToken ? <Coins className="h-10 w-10" /> : <Layers className="h-10 w-10" />}
                                <span className="text-[10px] font-black uppercase tracking-tighter">No Media</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>

                    {/* Metadata Section */}
                    <div className="flex-1 min-w-0 space-y-5 w-full text-center md:text-left">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start font-black">
                                <h3 className="text-3xl text-white tracking-tighter truncate max-w-full">
                                    {info.name}
                                </h3>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 rounded-xl bg-cyan-400/10 text-cyan-400 text-[10px] uppercase tracking-widest border border-cyan-400/20">
                                        {isToken ? "ESDT" : "DIGITAL ASSET"}
                                    </span>
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm font-mono tracking-wider opacity-80 font-bold uppercase">
                                {isSft ? sftInfo?.identifier : (info as any).ticker}
                            </p>
                        </div>

                        {/* Metrics Badges */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-3 bg-black/30 border border-white/5 px-5 py-3 rounded-2xl hover:border-white/10 transition-colors">
                                <Users className="h-5 w-5 text-cyan-400" />
                                <div className="flex flex-col text-left">
                                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Holders</span>
                                    <span className="text-white font-black text-base">{filteredAccounts.length.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-black/30 border border-white/5 px-5 py-3 rounded-2xl hover:border-white/10 transition-colors">
                                <BarChart3 className="h-5 w-5 text-cyan-400" />
                                <div className="flex flex-col text-left">
                                    <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Total Asset</span>
                                    <span className="text-white font-black text-base">{formatBalance(totalSupply.toString(), isToken ? tokenInfo?.decimals : 0, 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export Section */}
                    <div className="w-full md:w-auto flex flex-row md:flex-col gap-3 shrink-0 md:pl-8 border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0">
                        <button
                            onClick={() => handleExport("csv")}
                            disabled={isExporting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-cyan-400 text-slate-400 hover:text-[#0F172A] border border-white/5 hover:border-cyan-400 transition-all font-black text-xs group"
                        >
                            <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                            <span>EXPORT CSV</span>
                        </button>
                        <button
                            onClick={() => handleExport("json")}
                            disabled={isExporting}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-cyan-400 text-slate-400 hover:text-[#0F172A] border border-white/5 hover:border-cyan-400 transition-all font-black text-xs group"
                        >
                            <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                            <span>EXPORT JSON</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Giveaway Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                    { type: "balanced", label: "Balanced Draw", desc: "Fair chance for every single holder", icon: PartyPopper, color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-500" },
                    { type: "weighted", label: "Weighted Draw", desc: "Odds tied to holding size (鲸 fish)", icon: Dna, color: "from-cyan-400/20 to-cyan-400/5 border-cyan-400/30 hover:border-cyan-400" }
                ].map(tool => (
                    <button
                        key={tool.type}
                        onClick={() => handleGiveaway(tool.type as any)}
                        className={cn("group relative overflow-hidden rounded-[2rem] bg-black/40 border p-6 flex items-center gap-5 transition-all text-left", tool.color)}
                    >
                        <div className="h-14 w-14 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                            <tool.icon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-base uppercase tracking-tight">{tool.label}</h4>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{tool.desc}</p>
                        </div>
                        <ArrowRight className="ml-auto h-5 w-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                ))}
            </div>

            {/* View Mode Switching */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setViewMode("table")}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                            viewMode === "table" ? "bg-cyan-400 text-[#0F172A] shadow-lg" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <TableIcon className="h-4 w-4" /> Holder List
                    </button>
                    <button
                        onClick={() => setViewMode("chart")}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                            viewMode === "chart" ? "bg-amber-400 text-[#0F172A] shadow-lg" : "text-slate-500 hover:text-white"
                        )}
                    >
                        <PieChart className="h-4 w-4" /> Distribution
                    </button>
                </div>
                <div className="px-4 py-2 rounded-full bg-cyan-400/5 border border-cyan-400/10">
                    <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em]">
                        {filteredAccounts.length.toLocaleString()} Wallets Handled
                    </p>
                </div>
            </div>

            {/* List/Chart Area */}
            <div className="min-h-[500px] animate-in fade-in duration-500">
                {viewMode === "table" ? (
                    <div className="bg-black/30 rounded-[2.5rem] border border-white/5 overflow-hidden backdrop-blur-3xl shadow-2xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-[#0F172A]/80 sticky top-0 z-10 backdrop-blur-md">
                                    <tr className="border-b border-white/5">
                                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest w-20 text-center">Rank</th>
                                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Address Identity</th>
                                        <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {paginatedAccounts.map((acc, i) => {
                                        const originalIndex = (currentPage - 1) * itemsPerPage + i;
                                        const herotag = herotags[acc.address];
                                        return (
                                            <tr key={acc.address} className="hover:bg-white/5 transition-all group/row">
                                                <td className="p-6 text-xs text-slate-600 font-mono text-center font-bold">
                                                    {(originalIndex + 1).toString().padStart(2, '0')}
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            {herotag ? (
                                                                <span className="text-cyan-400 font-black text-sm uppercase tracking-tight">@{herotag}</span>
                                                            ) : (
                                                                <span className="text-slate-300 font-mono text-xs">{formatAddress(acc.address, 12, 12)}</span>
                                                            )}
                                                            {acc.address.includes("qqqqqq") && <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Contract Instance</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right font-mono text-base text-white font-black tracking-tighter">
                                                    {formatBalance(acc.balance, isToken ? tokenInfo?.decimals : 0, 0)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Area */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-6 p-8 bg-black/40 border-t border-white/5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="h-12 px-6 rounded-2xl bg-white/5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/5"
                                >
                                    Prev
                                </button>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={inputPage}
                                        onChange={(e) => setInputPage(e.target.value)}
                                        onKeyDown={handleInputKeyDown}
                                        className="w-16 h-12 rounded-2xl bg-black/40 border border-white/10 text-center text-sm font-black text-cyan-400 focus:border-cyan-400 focus:outline-none transition-all"
                                    />
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">of {totalPages}</span>
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="h-12 px-6 rounded-2xl bg-white/5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border border-white/5"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-black/30 rounded-[3rem] border border-white/5 p-12 flex flex-col items-center justify-center min-h-[500px] backdrop-blur-3xl">
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
                                        cx="50%" cy="50%" innerRadius={100} outerRadius={150} paddingAngle={4} dataKey="value"
                                    >
                                        {chartData.items.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={["#22D3EE", "#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63", "#0EA5E9", "#0284C7", "#0369A1", "#075985"][index % 10]} strokeWidth={0} />
                                        ))}
                                        {chartData.other > 0n && <Cell key="cell-other" fill="#1F2937" strokeWidth={0} />}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }: any) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                const share = totalSupply > 0n ? Number((BigInt(d.balance) * 10000n) / totalSupply) / 100 : 0;
                                                return (
                                                    <div className="bg-[#0F172A] border border-white/10 p-5 rounded-[1.5rem] shadow-2xl backdrop-blur-3xl animate-in zoom-in-95">
                                                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-1.5 border-b border-white/5 pb-1.5 text-center">
                                                            {d.address === "Other" ? "Remaining Holders" : formatAddress(d.address, 6, 6)}
                                                        </p>
                                                        <p className="text-cyan-400 font-black text-2xl tracking-tighter text-center leading-none">
                                                            {share.toFixed(2)}%
                                                        </p>
                                                        <p className="text-slate-500 font-mono text-[9px] mt-2 text-center uppercase font-bold">Share of Total Supply</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Custom Legend */}
                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-8">
                            {chartData.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: ["#22D3EE", "#06B6D4", "#0891B2", "#0E7490", "#155E75", "#164E63", "#0EA5E9", "#0284C7", "#0369A1", "#075985"][i % 10] }} />
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{formatAddress(item.address, 4, 4)}</span>
                                </div>
                            ))}
                            {chartData.other > 0n && (
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-slate-800" />
                                    <span className="text-[10px] font-black uppercase text-slate-700 tracking-widest">OTHERS</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
