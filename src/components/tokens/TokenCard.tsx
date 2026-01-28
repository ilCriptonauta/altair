"use client";

import { useState } from "react";
import { type Token } from "@/lib/mx-api";
import { ChevronDown, Globe, Twitter, FileText, CheckCircle2, MessageCircle, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenCardProps {
    token: Token;
}

export function TokenCard({ token }: TokenCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    // Format balance
    const formatBalance = (balance: string, decimals: number) => {
        const val = Number(balance) / 10 ** decimals;
        return val.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

    // Format USD Value
    const formatValue = (val?: number) => {
        if (!val) return "$0.00";
        if (val < 0.01) return "<$0.01";
        return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format Large Numbers
    const formatLargeNumber = (num?: number | string) => {
        if (!num) return "-";
        const val = Number(num);
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
        if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
        return val.toLocaleString();
    };

    // Format Integer (Holders, Txs)
    const formatCount = (num?: number) => {
        if (!num) return "-";
        return num.toLocaleString();
    };

    const handleCopyId = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(token.identifier);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isVerified = token.assets?.status === "active";

    // Properties Helpers
    const properties = [
        { label: "Mintable", value: token.canMint, color: "bg-green-500/10 text-green-500 border-green-500/20" },
        { label: "Burnable", value: token.canBurn, color: "bg-red-500/10 text-red-500 border-red-500/20" },
        { label: "Upgradable", value: token.canUpgrade, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
        { label: "Pausable", value: token.canPause, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
        // { label: "Freezable", value: token.canFreeze, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
    ].filter(p => p.value);

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
                "group relative w-full overflow-hidden rounded-xl border border-slate-800 bg-[#1E293B]/40 transition-all hover:bg-[#1E293B]/60 cursor-pointer",
                isExpanded && "border-[#22D3EE]/30 bg-[#1E293B]/80"
            )}
        >
            <div className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                    {/* Token Icon */}
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-800 border border-slate-700">
                        {token.assets?.pngUrl ? (
                            <img src={token.assets.pngUrl} alt={token.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-500">
                                {token.ticker.substring(0, 2)}
                            </div>
                        )}
                        {isVerified && (
                            <div className="absolute bottom-0 right-0 rounded-full bg-[#0F172A] p-0.5 ring-1 ring-[#0F172A]">
                                <CheckCircle2 className="h-3 w-3 text-[#22D3EE] fill-[#0F172A]" />
                            </div>
                        )}
                    </div>

                    {/* Main Info */}
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{token.name}</span>
                            {isVerified && (
                                <span className="hidden sm:inline-block rounded-full bg-[#22D3EE]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#22D3EE]">
                                    VERIFIED
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                                {formatBalance(token.balance, token.decimals)} <span className="text-slate-500">{token.ticker}</span>
                            </span>

                            <span className="text-slate-700">|</span>

                            {/* Identifier with Direct Copy */}
                            <div
                                className="flex items-center gap-1 cursor-pointer hover:text-[#22D3EE] transition-colors group/id"
                                onClick={handleCopyId}
                            >
                                <span className={cn(
                                    "text-[10px]",
                                    copied ? "text-green-500 font-bold" : "text-slate-500 group-hover/id:text-[#22D3EE]"
                                )}>
                                    {copied ? "Copied!" : token.identifier}
                                </span>
                                {!copied && <Copy className="h-3 w-3 opacity-50 group-hover/id:opacity-100" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Value & Price */}
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="font-mono font-medium text-white text-base">
                        {formatValue(token.valueUsd)}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="hidden sm:inline-block">Price:</span>
                        <span>{token.price ? `$${token.price.toFixed(4)}` : "-"}</span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform text-slate-600", isExpanded && "rotate-180")} />
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-slate-800/50 bg-[#0F172A]/30 p-4 text-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="grid gap-6">

                        {/* 1. Market & On-Chain Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-xl bg-[#1E293B]/50 p-4 border border-slate-800/50">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Market Cap</span>
                                <span className="font-mono text-white text-sm">{formatLargeNumber(token.marketCap)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Circulating Supply</span>
                                <span className="font-mono text-white text-sm">
                                    {token.circulatingSupply
                                        ? formatLargeNumber(Number(token.circulatingSupply) / 10 ** token.decimals)
                                        : "N/A"
                                    }
                                </span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Holders</span>
                                <span className="font-mono text-white text-sm">{formatCount(token.accounts)}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Transactions</span>
                                <span className="font-mono text-white text-sm">{formatCount(token.transactions)}</span>
                            </div>
                        </div>

                        {/* 2. Description & Properties */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Description */}
                            <div className="flex-1 space-y-2">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">About {token.ticker}</h4>
                                {token.assets?.description ? (
                                    <p className="text-slate-400 text-xs leading-relaxed">
                                        {token.assets.description}
                                    </p>
                                ) : (
                                    <p className="text-slate-600 text-xs italic">No description available.</p>
                                )}
                            </div>

                            {/* Properties Badges */}
                            {properties.length > 0 && (
                                <div className="md:w-1/3 space-y-2">
                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Properties</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {properties.map(p => (
                                            <span key={p.label} className={cn("px-2 py-1 rounded text-[10px] font-bold border", p.color)}>
                                                {p.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Links */}
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800/50">
                            {token.assets?.website && (
                                <a href={token.assets.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-[#22D3EE]/50 hover:text-[#22D3EE] transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <Globe className="h-3 w-3" /> Website
                                </a>
                            )}
                            {token.assets?.social?.twitter && (
                                <a href={token.assets.social.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-[#22D3EE]/50 hover:text-[#22D3EE] transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <Twitter className="h-3 w-3" /> Twitter
                                </a>
                            )}
                            {token.assets?.social?.telegram && (
                                <a href={token.assets.social.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-[#22D3EE]/50 hover:text-[#22D3EE] transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <MessageCircle className="h-3 w-3" /> Telegram
                                </a>
                            )}
                            {token.assets?.social?.discord && (
                                <a href={token.assets.social.discord} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-[#22D3EE]/50 hover:text-[#22D3EE] transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <MessageCircle className="h-3 w-3" /> Discord
                                </a>
                            )}
                            {token.assets?.social?.whitepaper && (
                                <a href={token.assets.social.whitepaper} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-[#22D3EE]/50 hover:text-[#22D3EE] transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <FileText className="h-3 w-3" /> Whitepaper
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
