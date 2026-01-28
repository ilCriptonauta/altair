"use client";

import { useState } from "react";
import { type Transaction } from "@/lib/mx-api";
import { Copy, Check, ArrowRight, Clock, ShieldCheck, AlertCircle, FileText, Database, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TransactionDetailProps {
    transaction: Transaction;
}

export function TransactionDetail({ transaction }: TransactionDetailProps) {
    const [isCopied, setIsCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(label);
        setTimeout(() => setIsCopied(null), 2000);
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatHash = (hash: string) => {
        return `${hash.substring(0, 12)}...${hash.substring(hash.length - 12)}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "success": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            case "fail": return "text-red-400 bg-red-500/10 border-red-500/20";
            case "pending": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
        }
    };

    // Calculate value display
    const value = parseFloat(transaction.value) / 10 ** 18;
    const fee = parseFloat(transaction.fee || "0") / 10 ** 18;

    // Check for operations/transfers
    const hasOperations = transaction.operations && transaction.operations.length > 0;

    // Decode data if looks like text
    let decodedData = "";
    try {
        if (transaction.data) {
            decodedData = atob(transaction.data);
            if (!/^[\x20-\x7E]*$/.test(decodedData)) {
                // If contains non-printable, fallback to showing raw base64 or hex? 
                // Actually the API returns base64 usually. explorer renders it as text if possible.
                // Let's assume for now we show raw unless it decodes cleanly.
            }
        }
    } catch (e) {
        decodedData = transaction.data || "";
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/80 p-6 backdrop-blur-xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-white">Transaction Details</h2>
                            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border", getStatusColor(transaction.status))}>
                                {transaction.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-sm font-mono break-all">
                            <span>{transaction.txHash}</span>
                            <button
                                onClick={() => copyToClipboard(transaction.txHash, "hash")}
                                className="p-1 hover:text-white transition-colors"
                            >
                                {isCopied === "hash" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 bg-[#1E293B]/50 px-3 py-1.5 rounded-lg border border-slate-800">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{formatTime(transaction.timestamp)}</span>
                    </div>
                </div>
            </div>

            {/* Flow Card */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Sender */}
                <div className="rounded-xl border border-slate-800 bg-[#1E293B]/30 p-5">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Sender (Shard {transaction.senderShard})</h3>
                    <div className="flex items-center justify-between">
                        <Link href={`/dashboard/${transaction.sender}`} className="text-[#22D3EE] font-mono hover:underline truncate mr-2">
                            {formatHash(transaction.sender)}
                        </Link>
                        <button
                            onClick={() => copyToClipboard(transaction.sender, "sender")}
                            className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            {isCopied === "sender" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Receiver */}
                <div className="rounded-xl border border-slate-800 bg-[#1E293B]/30 p-5">
                    <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Receiver (Shard {transaction.receiverShard})</h3>
                    <div className="flex items-center justify-between">
                        <Link href={`/dashboard/${transaction.receiver}`} className="text-[#22D3EE] font-mono hover:underline truncate mr-2">
                            {formatHash(transaction.receiver)}
                        </Link>
                        <button
                            onClick={() => copyToClipboard(transaction.receiver, "receiver")}
                            className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                            {isCopied === "receiver" ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Value & Metrics */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-[#1E293B]/30 p-5">
                    <h3 className="text-sm font-semibold text-slate-400 mb-1">Value</h3>
                    <p className="text-2xl font-bold text-white">{value.toLocaleString()} <span className="text-sm font-normal text-slate-500">EGLD</span></p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#1E293B]/30 p-5">
                    <h3 className="text-sm font-semibold text-slate-400 mb-1">Fee</h3>
                    <p className="text-lg font-medium text-white">{fee.toFixed(5)} <span className="text-sm font-normal text-slate-500">EGLD</span></p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#1E293B]/30 p-5">
                    <h3 className="text-sm font-semibold text-slate-400 mb-1">Gas Used</h3>
                    <div className="flex items-end gap-2">
                        <p className="text-lg font-medium text-white">{transaction.gasUsed.toLocaleString()}</p>
                        <span className="text-xs text-slate-500 mb-1">/ {transaction.gasLimit.toLocaleString()} Limit</span>
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                            className="bg-[#22D3EE] h-full"
                            style={{ width: `${Math.min((transaction.gasUsed / transaction.gasLimit) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Data Field */}
            {decodedData && (
                <div className="rounded-xl border border-slate-800 bg-[#1E293B]/30 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Database className="h-4 w-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Input Data</h3>
                    </div>
                    <div className="bg-[#0F172A] rounded-lg p-4 border border-slate-800 font-mono text-xs text-slate-300 break-all leading-relaxed max-h-40 overflow-y-auto">
                        {decodedData}
                    </div>
                </div>
            )}

            {/* Operations / Logs */}
            {hasOperations && (
                <div className="rounded-xl border border-slate-800 bg-[#1E293B]/30 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers className="h-4 w-4 text-slate-400" />
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Smart Contract Results</h3>
                    </div>
                    <div className="space-y-3">
                        {transaction.operations!.map((op) => (
                            <div key={op.id} className="flex flex-col md:flex-row md:items-center gap-4 p-3 rounded-lg bg-[#0F172A]/50 border border-slate-800/50">
                                <div className="min-w-[80px]">
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                        {op.action}
                                    </span>
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="font-mono text-[#22D3EE]">{formatHash(op.sender)}</span>
                                        <ArrowRight className="h-3 w-3" />
                                        <span className="font-mono text-[#22D3EE]">{formatHash(op.receiver)}</span>
                                    </div>
                                    {op.identifier && (
                                        <div className="text-xs text-white">
                                            {op.action === "transfer" ? `Sent ` : ``}
                                            <span className="font-bold">{op.identifier}</span>
                                            {op.value && ` (${(Number(op.value) / 10 ** 18).toFixed(4)})`}
                                        </div>
                                    )}
                                    {op.data && (
                                        <div className="text-[10px] font-mono text-slate-500 break-all">
                                            {atob(op.data)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
