"use client";

import { useState } from "react";
import { type Token } from "@/lib/mx-api";
import { ChevronDown, Globe, Twitter, FileText, CheckCircle2, MessageCircle, Copy, Check, ExternalLink, BarChart2, LayoutGrid } from "lucide-react";
import { cn, formatBalance as utilsFormatBalance } from "@/lib/utils";

interface TokenCardProps {
    token: Token;
}

export function TokenCard({ token }: TokenCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    // Format balance using centralized utility
    const formatBalance = (balance: string, decimals: number) => {
        return utilsFormatBalance(balance, decimals, 4);
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
                "group relative w-full overflow-hidden rounded-2xl border border-white/5 bg-[#1E293B]/20 transition-all duration-500",
                "hover:bg-[#1E293B]/40 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20 cursor-pointer",
                isExpanded && "border-white/20 bg-[#1E293B]/60 shadow-2xl"
            )}
        >
            <div className="flex items-center justify-between p-5 gap-6">
                <div className="flex items-center gap-5 flex-1 overflow-hidden">
                    {/* Token Icon */}
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-800 border border-white/10 p-1 group-hover:border-amber-400/30 transition-colors">
                        {token.assets?.pngUrl ? (
                            <img
                                src={token.assets.pngUrl}
                                alt={token.name}
                                className="h-full w-full object-cover rounded-xl"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://tools.multiversx.com/assets-cdn/tokens/default/icon.png";
                                }}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-500">
                                {token.ticker.substring(0, 2)}
                            </div>
                        )}
                        {isVerified && (
                            <div className="absolute -bottom-1 -right-1 rounded-full bg-amber-400 p-0.5 text-[#0F172A] border-2 border-[#1E293B]">
                                <CheckCircle2 className="h-2.5 w-2.5 fill-current" />
                            </div>
                        )}
                    </div>

                    {/* Main Info */}
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg tracking-tight group-hover:text-amber-400 transition-colors truncate">
                                {token.name}
                            </span>
                            {isVerified && (
                                <span className="hidden sm:inline-block rounded-lg bg-amber-400/10 px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-400 border border-amber-400/20">
                                    VERIFIED
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-sm font-bold text-slate-300 font-mono">
                                {formatBalance(token.balance, token.decimals)} <span className="text-slate-600 ml-1">{token.ticker}</span>
                            </span>

                            {/* Identifier with Direct Copy */}
                            <div
                                className="flex items-center gap-1.5 cursor-pointer group/id"
                                onClick={handleCopyId}
                            >
                                <span className={cn(
                                    "text-[10px] font-mono tracking-tight transition-colors",
                                    copied ? "text-emerald-400 font-bold" : "text-slate-600 group-hover/id:text-amber-400"
                                )}>
                                    {copied ? "COPIED!" : token.identifier}
                                </span>
                                {!copied && <Copy className="h-3 w-3 text-slate-700 group-hover/id:text-amber-400 transition-colors" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Value & Price */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="font-black font-mono text-white text-xl tracking-tighter">
                        {formatValue(token.valueUsd)}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        <span>PRICE: {token.price ? `$${token.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}` : "-"}</span>
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-300 text-slate-700", isExpanded && "rotate-180 text-amber-400")} />
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-white/5 bg-black/20 p-6 text-sm animate-in slide-in-from-top-4 duration-300 backdrop-blur-3xl">
                    <div className="grid gap-8">

                        {/* 1. Market & On-Chain Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-2xl bg-white/5 p-6 border border-white/5">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <BarChart2 className="h-3 w-3" /> Market Cap
                                </div>
                                <span className="font-black font-mono text-white text-base">{formatLargeNumber(token.marketCap)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <LayoutGrid className="h-3 w-3" /> Circulating
                                </div>
                                <span className="font-black font-mono text-white text-base">
                                    {token.circulatingSupply
                                        ? formatLargeNumber(Number(token.circulatingSupply) / 10 ** token.decimals)
                                        : "N/A"
                                    }
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <BarChart2 className="h-3 w-3 rotate-90" /> Holders
                                </div>
                                <span className="font-black font-mono text-white text-base">{formatCount(token.accounts)}</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <BarChart2 className="h-3 w-3" /> Txs
                                </div>
                                <span className="font-black font-mono text-white text-base">{formatCount(token.transactions)}</span>
                            </div>
                        </div>

                        {/* 2. Description & Properties */}
                        <div className="flex flex-col md:flex-row gap-10">
                            {/* Description */}
                            <div className="flex-1 space-y-3">
                                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">About {token.ticker}</h4>
                                {token.assets?.description ? (
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                        {token.assets.description}
                                    </p>
                                ) : (
                                    <p className="text-slate-600 text-sm italic">No official description available for this asset.</p>
                                )}
                            </div>

                            {/* Properties Badges */}
                            {properties.length > 0 && (
                                <div className="md:w-1/3 space-y-3">
                                    <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Token Properties</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {properties.map(p => (
                                            <span key={p.label} className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105", p.color)}>
                                                {p.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Links */}
                        <div className="flex flex-wrap gap-3 pt-6 border-t border-white/5">
                            {token.assets?.website && (
                                <a href={token.assets.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-400 transition-all" onClick={(e) => e.stopPropagation()}>
                                    <Globe className="h-4 w-4" /> Website
                                </a>
                            )}
                            {token.assets?.social?.twitter && (
                                <a href={token.assets.social.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-400 transition-all" onClick={(e) => e.stopPropagation()}>
                                    <Twitter className="h-4 w-4" /> Twitter
                                </a>
                            )}
                            <a
                                href={`https://explorer.multiversx.com/tokens/${token.identifier}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-400 transition-all ml-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="h-4 w-4" /> Explorer
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
