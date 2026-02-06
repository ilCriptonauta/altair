import { useEffect, useState } from "react";
import { getMarketMovers, type MarketMover } from "@/lib/mx-api";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MarketMovers() {
    const [gainers, setGainers] = useState<MarketMover[]>([]);
    const [losers, setLosers] = useState<MarketMover[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const response = await fetch('/api/market-movers');
                if (response.ok) {
                    const data = await response.json();
                    setGainers(data.gainers || []);
                    setLosers(data.losers || []);
                } else {
                    // Fallback to direct call if API route fails
                    const data = await getMarketMovers();
                    setGainers(data.gainers);
                    setLosers(data.losers);
                }
            } catch (error) {
                console.error("Error fetching movers:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();

        // Refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const formatPrice = (price: number) => {
        if (price < 0.000001) return `<$0.000001`;
        if (price < 1) return `$${price.toFixed(6)}`;
        return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-80 w-full rounded-2xl bg-[#1E293B]/30" />
                <Skeleton className="h-80 w-full rounded-2xl bg-[#1E293B]/30" />
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Gainers */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#1E293B]/20 p-6 backdrop-blur-md transition-all duration-500 hover:bg-[#1E293B]/30 hover:border-emerald-500/20">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-colors" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Top Gainers</h3>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Last 24 Hours</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {gainers.map((token, i) => (
                        <div key={token.identifier} className="flex items-center justify-between p-3 rounded-2xl transition-all duration-200 hover:bg-white/5 group/row">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-600 w-4 font-mono">{i + 1}</span>
                                <div className="relative h-10 w-10 rounded-full bg-slate-800 p-0.5 border border-white/10 group-hover/row:border-emerald-500/30 transition-colors">
                                    <img
                                        src={token.image}
                                        alt={token.ticker}
                                        className="h-full w-full rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://tools.multiversx.com/assets-cdn/tokens/default/icon.png";
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white group-hover/row:text-emerald-400 transition-colors">{token.ticker}</p>
                                    <p className="text-xs font-medium text-slate-500">{formatPrice(token.price)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/10">
                                    +{token.change24h.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    ))}
                    {gainers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <p className="text-sm font-medium">No activity data found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Losers */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#1E293B]/20 p-6 backdrop-blur-md transition-all duration-500 hover:bg-[#1E293B]/30 hover:border-rose-500/20">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-rose-500/5 blur-3xl group-hover:bg-rose-500/10 transition-colors" />

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/10">
                            <TrendingDown className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Top Losers</h3>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Last 24 Hours</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    {losers.map((token, i) => (
                        <div key={token.identifier} className="flex items-center justify-between p-3 rounded-2xl transition-all duration-200 hover:bg-white/5 group/row">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-600 w-4 font-mono">{i + 1}</span>
                                <div className="relative h-10 w-10 rounded-full bg-slate-800 p-0.5 border border-white/10 group-hover/row:border-rose-500/30 transition-colors">
                                    <img
                                        src={token.image}
                                        alt={token.ticker}
                                        className="h-full w-full rounded-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://tools.multiversx.com/assets-cdn/tokens/default/icon.png";
                                        }}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white group-hover/row:text-rose-400 transition-colors">{token.ticker}</p>
                                    <p className="text-xs font-medium text-slate-500">{formatPrice(token.price)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-rose-400 bg-rose-400/10 border border-rose-400/10">
                                    {token.change24h.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    ))}
                    {losers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <p className="text-sm font-medium">No activity data found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
