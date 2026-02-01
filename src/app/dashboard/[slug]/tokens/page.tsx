"use client";

import { useEffect, useState, use } from "react";
import { getTokens, type Token, getAccountDetails } from "@/lib/mx-api";
import { TokenCard } from "@/components/tokens/TokenCard";
import { ArrowLeft, Coins, Search, X, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { cn, isValidAddress } from "@/lib/utils";

export default function TokensPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [inputPage, setInputPage] = useState("1");
    const itemsPerPage = 25;

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                // First resolve address if it's a herotag
                let targetAddress = slug;
                if (!slug.startsWith("erd1")) {
                    const account = await getAccountDetails(slug);
                    if (account) targetAddress = account.address;
                }

                // Fetch a large chunk to allow client-side sorting by value
                const tokensData = await getTokens(targetAddress, 2000);
                const sortedTokens = tokensData.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
                setTokens(sortedTokens);
            } catch (err) {
                console.error("Failed to load tokens", err);
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            fetchData();
        }
    }, [slug]);

    // Filtering Logic
    const filteredTokens = tokens.filter(token => {
        const query = searchQuery.toLowerCase();
        return (
            token.name.toLowerCase().includes(query) ||
            token.ticker.toLowerCase().includes(query) ||
            token.identifier.toLowerCase().includes(query)
        );
    });

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1);
        setInputPage("1");
    }, [searchQuery]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredTokens.length / itemsPerPage);
    const paginatedTokens = filteredTokens.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            setInputPage(newPage.toString());
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputPage(e.target.value);
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-5">
                    <Link
                        href={`/dashboard/${slug}`}
                        className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-300"
                    >
                        <ArrowLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            Assets <Coins className="h-8 w-8 text-amber-400 dropdown-shadow-amber" />
                        </h1>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">{tokens.length} ESDT TOKENS FOUND</p>
                    </div>
                </div>

                {/* Premium Search Bar */}
                <div className="flex items-center w-full md:w-auto gap-3">
                    <div className="relative group flex-grow md:flex-grow-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter by name or ticker..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 w-full md:w-72 bg-white/5 border border-white/5 rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-xl bg-[#1E293B]/30 border border-slate-800/50" />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {paginatedTokens.length > 0 ? (
                        paginatedTokens.map((token) => (
                            <TokenCard
                                key={token.identifier}
                                token={token}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            No tokens found.
                        </div>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-800/50">
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
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            className="w-12 rounded-md bg-[#0F172A] border border-slate-700 px-2 py-1 text-center text-sm text-white focus:border-[#22D3EE] focus:outline-none"
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
    );
}
