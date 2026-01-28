"use client";

import { useEffect, useState } from "react";
import { getMarketMovers, type MarketMover } from "@/lib/mx-api";
import { TrendingUp, TrendingDown, RefreshCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MarketMovers() {
    const [gainers, setGainers] = useState<MarketMover[]>([]);
    const [losers, setLosers] = useState<MarketMover[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const data = await getMarketMovers();
            setGainers(data.gainers);
            setLosers(data.losers);
            setLoading(false);
        }
        fetchData();
    }, []);

    const formatPrice = (price: number) => {
        if (price < 0.01) return `<$0.01`;
        return `$${price.toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-64 w-full rounded-2xl bg-[#1E293B]/50" />
                <Skeleton className="h-64 w-full rounded-2xl bg-[#1E293B]/50" />
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Gainers */}
            <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/50 p-5 backdrop-blur-xl transition-all duration-300 hover:border-[#22D3EE]/30 group">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Top Gainers <span className="text-xs text-slate-500 font-normal ml-2">(24h)</span></h3>
                </div>

                <div className="space-y-4">
                    {gainers.map((token, i) => (
                        <div key={token.identifier} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-800">
                                    <img src={token.image} alt={token.ticker} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{token.ticker}</p>
                                    <p className="text-xs text-slate-500">{formatPrice(token.price)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-emerald-400">+{token.change24h.toFixed(2)}%</span>
                            </div>
                        </div>
                    ))}
                    {gainers.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No data available</p>}
                </div>
            </div>

            {/* Top Losers */}
            <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/50 p-5 backdrop-blur-xl transition-all duration-300 hover:border-pink-500/30 group">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                        <TrendingDown className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Top Losers <span className="text-xs text-slate-500 font-normal ml-2">(24h)</span></h3>
                </div>

                <div className="space-y-4">
                    {losers.map((token, i) => (
                        <div key={token.identifier} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 w-4">{i + 1}</span>
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-800">
                                    <img src={token.image} alt={token.ticker} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{token.ticker}</p>
                                    <p className="text-xs text-slate-500">{formatPrice(token.price)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-bold text-pink-400">{token.change24h.toFixed(2)}%</span>
                            </div>
                        </div>
                    ))}
                    {losers.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No data available</p>}
                </div>
            </div>
        </div>
    );
}
