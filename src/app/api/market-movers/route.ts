
import { NextResponse } from 'next/server';

// Simple in-memory cache for market movers
let cache: { data: any, timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute

export async function GET() {
    try {
        const now = Date.now();
        if (cache && (now - cache.timestamp) < CACHE_DURATION) {
            return NextResponse.json(cache.data);
        }

        // Fetch tokens from MEX API
        const response = await fetch('https://api.multiversx.com/mex/tokens?size=1000', {
            next: { revalidate: 60 } // Also use Next.js fetch cache if available
        });

        if (!response.ok) {
            throw new Error('Failed to fetch from MultiversX API');
        }

        const data = await response.json();

        const movers = data
            .filter((t: any) => t.price > 0 && t.previous24hPrice > 0 && (t.volume24h > 1000 || t.previous24hVolume > 1000))
            .map((t: any) => {
                const change = ((t.price - t.previous24hPrice) / t.previous24hPrice) * 100;
                return {
                    identifier: t.id,
                    ticker: t.symbol,
                    price: t.price,
                    change24h: change,
                    volume24h: t.volume24h || t.previous24hVolume,
                    image: `https://tools.multiversx.com/assets-cdn/tokens/${t.id}/icon.png`
                };
            });

        // Filter and Sort
        const sorted = movers.sort((a: any, b: any) => b.change24h - a.change24h);

        const result = {
            gainers: sorted.slice(0, 5),
            losers: sorted.slice(-5).reverse()
        };

        cache = { data: result, timestamp: now };
        return NextResponse.json(result);

    } catch (error) {
        console.error('Market movers error:', error);
        return NextResponse.json({ gainers: [], losers: [] }, { status: 500 });
    }
}
