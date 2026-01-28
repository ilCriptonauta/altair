"use client";

import { useState } from "react";
import { Camera, Layers, Coins, Image as ImageIcon, FileDigit, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToken, getTokenAccounts, getCollection, getCollectionAccounts, getNFT, getSftAccounts, TokenDetailed, TokenAccount, CollectionDetailed, CollectionAccount, NFT, SftAccount } from "@/lib/mx-api";
import { SnapshotResults } from "./SnapshotResults";

export function SnapshotManager() {
    const [activeTab, setActiveTab] = useState<"token" | "collection" | "sft">("token");

    // Persist inputs per tab
    const [inputs, setInputs] = useState({
        token: "",
        collection: "",
        sft: ""
    });

    // Persist results per tab
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
        // Do not clear previous result immediately to avoid flickering if we just re-fetch, 
        // but maybe we want to? Let's just keep old one until new one loads or strictly replace.
        // User wants persistence, usually that implies "don't lose what I had". 
        // If I'm fetching new data, maybe I should clear? 
        // For now, let's allow re-fetching to overwrite.

        try {
            const identifiers = currentInput.split(",").map(t => t.trim()).filter(Boolean);
            const target = identifiers[0];

            if (activeTab === "token") {
                const [info, accounts] = await Promise.all([
                    getToken(target),
                    getTokenAccounts(target)
                ]);

                if (!info) throw new Error(`Token ${target} not found.`);

                setResults(prev => ({
                    ...prev,
                    token: { info, accounts }
                }));
            } else if (activeTab === "collection") {
                const [info, accounts] = await Promise.all([
                    getCollection(target),
                    getCollectionAccounts(target)
                ]);

                if (!info) throw new Error(`Collection ${target} not found.`);

                setResults(prev => ({
                    ...prev,
                    collection: { info, accounts }
                }));
            } else {
                // SFT Logic
                const info = await getNFT(target);
                if (!info) throw new Error(`SFT ${target} not found.`);

                if (!info.nonce) throw new Error("Invalid SFT identifier. Nonce missing.");

                // Check type briefly
                if (info.type !== "SemiFungibleESDT" && info.type !== "NonFungibleESDT") {
                    // warn?
                }

                const accounts = await getSftAccounts(target, info.nonce);

                setResults(prev => ({
                    ...prev,
                    sft: { info, accounts }
                }));
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
        <div className="flex flex-col items-center gap-6 animate-in fade-in w-full pb-20">
            {/* Header Icon */}
            <div className="h-16 w-16 rounded-full bg-[#22D3EE]/10 flex items-center justify-center text-[#22D3EE] mb-2">
                <Camera className="h-8 w-8" />
            </div>

            <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">Snapshot Tool</h2>
                <p className="text-slate-400 max-w-md mt-2">
                    Capture your portfolio state. Select asset type and configure filters.
                </p>
            </div>

            {/* Sub-Tabs Navigation */}
            <div className="flex p-1 bg-[#0F172A] border border-slate-700 rounded-xl w-full max-w-lg">
                <button
                    onClick={() => { setActiveTab("token"); setError(null); }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                        activeTab === "token"
                            ? "bg-[#1E293B] text-[#22D3EE] shadow-sm ring-1 ring-[#22D3EE]/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                >
                    <Coins className="h-4 w-4" />
                    Tokens
                </button>
                <button
                    onClick={() => { setActiveTab("collection"); setError(null); }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                        activeTab === "collection"
                            ? "bg-[#1E293B] text-[#22D3EE] shadow-sm ring-1 ring-[#22D3EE]/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                >
                    <Layers className="h-4 w-4" />
                    Collections
                </button>
                <button
                    onClick={() => { setActiveTab("sft"); setError(null); }}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                        activeTab === "sft"
                            ? "bg-[#1E293B] text-[#22D3EE] shadow-sm ring-1 ring-[#22D3EE]/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    )}
                >
                    <FileDigit className="h-4 w-4" />
                    Single SFT
                </button>
            </div>

            {/* Configuration Area */}
            <div className="w-full max-w-lg space-y-4 bg-[#0F172A]/50 p-6 rounded-2xl border border-slate-800/50">
                {/* Ticker Input */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                        {activeTab === "token" ? "Token Ticker" :
                            activeTab === "collection" ? "Collection Identifiers" : "SFT Identifier"}
                    </label>
                    <input
                        type="text"
                        value={inputs[activeTab]}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder={
                            activeTab === "token" ? "EGLD, MEX, USDC-c76f1..." :
                                activeTab === "collection" ? "CHBONK-1234, ALTAIR-5678..." :
                                    "SFT-ID-1234-01"
                        }
                        className="w-full rounded-xl bg-[#1E293B] border border-slate-700 px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all"
                        onKeyDown={(e) => e.key === "Enter" && handleTakeSnapshot()}
                    />
                    <p className="text-[10px] text-slate-500 ml-1">
                        Enter a single identifier for now.
                    </p>
                </div>

                {/* SC Exclusion Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#1E293B]/50 border border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                            <Layers className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-medium text-slate-200">Exclude Smart Contracts</p>
                            <p className="text-[10px] text-slate-500">Hide assets held by SC addresses</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setExcludeSC(!excludeSC)}
                        className={cn(
                            "relative h-6 w-11 rounded-full transition-colors",
                            excludeSC ? "bg-[#22D3EE]" : "bg-slate-700"
                        )}
                    >
                        <span
                            className={cn(
                                "absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                                excludeSC ? "translate-x-5" : "translate-x-0"
                            )}
                        />
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="w-full max-w-lg bg-red-500/10 text-red-500 p-4 rounded-xl flex items-center gap-3 border border-red-500/20 animate-in shake">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleTakeSnapshot}
                disabled={loading}
                className="w-full max-w-lg mt-2 rounded-xl bg-[#22D3EE] px-6 py-4 font-bold text-[#0F172A] hover:bg-[#67e8f9] disabled:bg-slate-700 disabled:text-slate-500 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#22D3EE]/20 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Camera className="h-5 w-5" />
                )}
                {loading ? "Taking Snapshot..." : "Take Snapshot"}
            </button>

            {/* Results Section */}
            {currentResult && (
                <div className="w-full max-w-5xl mt-8 pt-8 border-t border-slate-800/50">
                    <SnapshotResults
                        key={activeTab} // Force re-render on tab change to reset table/chart view mode if desired, or remove to persist view state
                        type={activeTab as "token" | "collection" | "sft"}
                        data={currentResult}
                        excludeSC={excludeSC}
                    />
                </div>
            )}
        </div>
    );
}
