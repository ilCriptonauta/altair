"use client";

import { useEffect, useState, use } from "react";
import { getTransactions, type Transaction, getAccountDetails, getTransaction } from "@/lib/mx-api";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { TransactionDetail } from "@/components/transactions/TransactionDetail";
import { ArrowLeft, Search, X } from "lucide-react";
import Link from "next/link";

export default function TransactionsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState<string>("");

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchedTransaction, setSearchedTransaction] = useState<Transaction | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [inputPage, setInputPage] = useState("1");
    const itemsPerPage = 25;

    useEffect(() => {
        async function fetchInitData() {
            try {
                setLoading(true);
                // First resolve address and get count
                let targetAddress = slug;
                let txCount = 0;

                const account = await getAccountDetails(slug);
                if (account) {
                    targetAddress = account.address;
                    txCount = account.txCount || 0;
                }

                setAddress(targetAddress);
                setTotalCount(txCount);

                // Initial fetch for page 1
                const txs = await getTransactions(targetAddress, itemsPerPage, 0);
                setTransactions(txs);
            } catch (err) {
                console.error("Failed to load initial data", err);
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            fetchInitData();
        }
    }, [slug]);

    // Fetch on page change
    useEffect(() => {
        async function fetchPage() {
            if (!address) return;
            try {
                setLoading(true);
                const from = (currentPage - 1) * itemsPerPage;
                const txs = await getTransactions(address, itemsPerPage, from);
                setTransactions(txs);
                setInputPage(currentPage.toString());
            } catch (err) {
                console.error("Failed to fetch transactions page", err);
            } finally {
                setLoading(false);
            }
        }

        // Skip initial run as it's handled by fetchInitData (or better, make fetchInitData just set Address/Count and let this run? 
        // Better to allow this to run for updates. But address must be set.
        if (address) {
            fetchPage();
        }
    }, [currentPage, address]);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            // Scroll to top
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputPage(e.target.value);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        // Basic validation for hash (64 hex chars)
        if (query.length !== 64) {
            setSearchError("Invalid transaction hash length (must be 64 characters)");
            return;
        }

        try {
            setIsSearching(true);
            setSearchError("");
            const tx = await getTransaction(query);
            if (tx) {
                setSearchedTransaction(tx);
            } else {
                setSearchError("Transaction not found");
                setSearchedTransaction(null);
            }
        } catch (err) {
            setSearchError("Error fetching transaction");
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        setSearchedTransaction(null);
        setSearchError("");
        setIsSearchOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/dashboard/${slug}`}
                        className="rounded-full bg-[#1E293B]/50 p-2 text-slate-400 hover:bg-[#1E293B] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-white md:text-3xl">
                            Transactions
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {searchedTransaction ? "Search Result" : `Latest activity on the network (${totalCount.toLocaleString()} total)`}
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex items-center rounded-full bg-[#1E293B]/50 border border-slate-800 p-1 relative overflow-hidden transition-all duration-300 h-10 self-start md:self-auto">
                    {isSearchOpen ? (
                        <form onSubmit={handleSearch} className="flex items-center w-full px-2 animate-in fade-in slide-in-from-right-5 duration-300">
                            <Search className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search transaction hash..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-white text-sm w-48 md:w-80 placeholder:text-slate-500"
                            />
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="ml-2 p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="flex items-center justify-center h-8 w-8 rounded-full text-slate-400 hover:text-white transition-colors hover:bg-white/5"
                            title="Search Transaction"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {isSearching ? (
                <div className="space-y-4">
                    <div className="h-32 w-full animate-pulse rounded-2xl bg-[#1E293B]/50 border border-slate-800/50" />
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="h-40 w-full animate-pulse rounded-xl bg-[#1E293B]/30" />
                        <div className="h-40 w-full animate-pulse rounded-xl bg-[#1E293B]/30" />
                    </div>
                </div>
            ) : searchedTransaction ? (
                // Show Detail View
                <TransactionDetail transaction={searchedTransaction} />
            ) : searchError ? (
                // Show Error
                <div className="p-12 text-center rounded-2xl border border-red-500/20 bg-red-500/5">
                    <p className="text-red-400 font-bold mb-2">Search Failed</p>
                    <p className="text-slate-400 text-sm">{searchError}</p>
                    <button
                        onClick={clearSearch}
                        className="mt-4 px-4 py-2 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                    >
                        Return to List
                    </button>
                </div>
            ) : (
                // Show Default List
                <>
                    {loading ? (
                        <div className="flex flex-col gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-20 animate-pulse rounded-xl bg-[#1E293B]/30 border border-slate-800/50" />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <TransactionCard
                                        key={tx.txHash}
                                        transaction={tx}
                                        currentAddress={address}
                                    />
                                ))
                            ) : (
                                <div className="py-12 text-center text-slate-500">
                                    No transactions found.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-800/50">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
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
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const page = parseInt(inputPage);
                                            if (!isNaN(page) && page >= 1 && page <= totalPages) {
                                                handlePageChange(page);
                                            } else {
                                                setInputPage(currentPage.toString());
                                            }
                                        }
                                    }}
                                    className="w-12 rounded-md bg-[#0F172A] border border-slate-700 px-2 py-1 text-center text-sm text-white focus:border-[#22D3EE] focus:outline-none"
                                />
                                <span className="text-sm text-slate-400">of {totalPages}</span>
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || loading}
                                className="rounded-lg bg-[#1E293B] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
