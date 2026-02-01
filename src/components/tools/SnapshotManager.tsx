"use client";

import { useState } from "react";
import { Camera, Layers, Coins, FileDigit, Loader2, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToken, getTokenAccounts, getCollection, getCollectionAccounts, getNFT, getSftAccounts, TokenDetailed, TokenAccount, CollectionDetailed, CollectionAccount, NFT, SftAccount } from "@/lib/mx-api";
import { SnapshotResults } from "./SnapshotResults";

export function SnapshotManager() {
    const [activeTab, setActiveTab] = useState<"token" | "collection" | "sft">("token");

    const [inputs, setInputs] = useState({
        token: "",
        collection: "",
        sft: ""
    });

    const [results, setResults] = useState<{
        token: { info: TokenDetailed; accounts: TokenAccount[] } | null;
        collection: { info: CollectionDetailed; accounts: CollectionAccount[] } | null;
        sft: { info: NFT; accounts: SftAccount[] } | null;
    }>({
        token: null,
        collection: null,
        sft: null
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [excludeSC, setExcludeSC] = useState(false);

    const handleInputChange = (value: string) => {
        setInputs(prev => ({ ...prev, [activeTab]: value }));
    };

    const handleTakeSnapshot = async () => {
        const currentInput = inputs[activeTab];

        if (!currentInput.trim()) {
            setError("Please enter a valid identifier.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const identifiers = currentInput.split(",").map(t => t.trim()).filter(Boolean);
            const target = identifiers[0];

            if (activeTab === "token") {
                const [info, accounts] = await Promise.all([
                    getToken(target),
                    getTokenAccounts(target)
                ]);

                if (!info) throw new Error(`Token ${target} not found.`);

                setResults(prev => ({ ...prev, token: { info, accounts } }));
            } else if (activeTab === "collection") {
                const [info, accounts] = await Promise.all([
                    getCollection(target),
                    getCollectionAccounts(target)
                ]);

                if (!info) throw new Error(`Collection ${target} not found.`);

                setResults(prev => ({ ...prev, collection: { info, accounts } }));
            } else {
                const info = await getNFT(target);
                if (!info) throw new Error(`SFT ${target} not found.`);
                if (!info.nonce) throw new Error("Invalid SFT identifier. Nonce missing.");

                const accounts = await getSftAccounts(target, info.nonce);

                setResults(prev => ({ ...prev, sft: { info, accounts } }));
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to take snapshot.");
        } finally {
            setLoading(false);
        }
    };

    const currentResult = results[activeTab];

    return (
        <div className="flex flex-col items-center gap-8 animate-in fade-in w-full pb-20">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 shadow-2xl shadow-cyan-400/10 mb-2">
                    <Camera className="h-10 w-10" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Snapshot Tool</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest">
                        Index and analyze any MultiversX asset state
                    </p>
                </div>
            </div>

            {/* Premium Tab Navigation */}
            <div className="flex p-1.5 bg-white/5 border border-white/5 rounded-2xl w-full max-w-lg backdrop-blur-xl">
                {[
                    { id: "token", label: "Tokens", icon: Coins },
                    { id: "collection", label: "Collections", icon: Layers },
                    { id: "sft", label: "Single SFT", icon: FileDigit }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setError(null); }}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                            activeTab === tab.id
                                ? "bg-cyan-400 text-[#0F172A] shadow-xl shadow-cyan-400/20"
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <tab.icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Configuration Area */}
            <div className="w-full max-w-lg space-y-5 bg-[#1E293B]/20 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-amber-400/5 blur-[80px] pointer-events-none group-hover:bg-amber-400/10 transition-colors" />

                {/* Ticker Input */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                        {activeTab === "token" ? "Token Identifier" :
                            activeTab === "collection" ? "Collection Ticker" : "Full SFT Identifier"}
                    </label>
                    <div className="relative group/input">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within/input:text-cyan-400 transition-colors" />
                        <input
                            type="text"
                            value={inputs[activeTab]}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={
                                activeTab === "token" ? "E.g. EGLD or MEX-455c57" :
                                    activeTab === "collection" ? "E.g. CHBONK-123456" :
                                        "E.g. TICKET-123456-01"
                            }
                            className="w-full rounded-2xl bg-black/40 border border-white/5 pl-12 pr-4 py-4 text-white font-bold placeholder:text-slate-700 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all text-sm"
                            onKeyDown={(e) => e.key === "Enter" && handleTakeSnapshot()}
                        />
                    </div>
                </div>

                {/* SC Exclusion Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 group/toggle hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white tracking-tight">Exclude Smart Contracts</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Show only user wallets</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setExcludeSC(!excludeSC)}
                        className={cn(
                            "relative h-6 w-12 rounded-full transition-all duration-300",
                            excludeSC ? "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" : "bg-slate-800"
                        )}
                    >
                        <span
                            className={cn(
                                "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 shadow-inner",
                                excludeSC ? "translate-x-6" : "translate-x-0"
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="w-full max-w-lg bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-4 border border-red-500/20 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-bold uppercase tracking-tight">{error}</p>
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleTakeSnapshot}
                disabled={loading}
                className="w-full max-w-lg rounded-2xl bg-cyan-400 px-6 py-5 font-black uppercase tracking-[0.2em] text-[#0F172A] hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-cyan-400/20 flex items-center justify-center gap-3"
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Camera className="h-5 w-5" />
                )}
                {loading ? "Capturing Data..." : "Run Snapshot"}
            </button>

            {/* Results Section */}
            {currentResult && (
                <div className="w-full max-w-5xl mt-12 pt-12 border-t border-white/5">
                    <SnapshotResults
                        key={activeTab}
                        type={activeTab as "token" | "collection" | "sft"}
                        data={currentResult}
                        excludeSC={excludeSC}
                    />
                </div>
            )}
        </div>
    );
}
