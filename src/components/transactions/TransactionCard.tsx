"use client";

import { useState } from "react";
import { type Transaction } from "@/lib/mx-api";
import { ArrowDownLeft, ArrowUpRight, Repeat, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionCardProps {
    transaction: Transaction;
    currentAddress: string;
}

export function TransactionCard({ transaction, currentAddress }: TransactionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Helper: Copy to clipboard
    const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    // Determine direction
    const isSender = transaction.sender === currentAddress;
    const isReceiver = transaction.receiver === currentAddress;
    const isSelf = isSender && isReceiver;

    let direction = "in";
    if (isSelf) direction = "self";
    else if (isSender) direction = "out";

    // Parse Token Transfer if available
    const tokenTransfer = transaction.action?.arguments?.transfers?.[0];
    const isTokenTx = !!tokenTransfer;

    // Format value (EGLD or Token)
    const formatDisplayValue = () => {
        if (isTokenTx && tokenTransfer) {
            const decimals = tokenTransfer.decimals ?? 0;
            const val = Number(tokenTransfer.value) / 10 ** decimals;

            if (tokenTransfer.type.includes("NonFungible") || tokenTransfer.type.includes("SemiFungible")) {
                // NFTs usually have 0 decimals, so val equals raw value, which is correct (e.g. 1)
                return `${val.toLocaleString()} ${tokenTransfer.ticker}`;
            }

            // For Fungible Tokens
            return `${val.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${tokenTransfer.ticker}`;
        }

        const amount = Number(transaction.value) / 10 ** 18;
        if (amount === 0) return "0 EGLD";
        return `${amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} EGLD`;
    };

    // Fee Calculation
    const fee = Number(transaction.fee || 0) / 10 ** 18;

    // Format time relative
    const timeAgo = (timestamp: number) => {
        const seconds = Math.floor(Date.now() / 1000 - timestamp);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getStatusInfo = (status: string) => {
        if (status === "success") return { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, text: "Success", color: "text-green-500" };
        if (status === "fail") return { icon: <XCircle className="h-4 w-4 text-red-500" />, text: "Failed", color: "text-red-500" };
        return { icon: <AlertCircle className="h-4 w-4 text-[#FBBF24]" />, text: status, color: "text-[#FBBF24]" };
    };

    const statusInfo = getStatusInfo(transaction.status);

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-slate-800 bg-[#1E293B]/40 transition-all hover:bg-[#1E293B]/60 cursor-pointer",
                isExpanded && "border-[#22D3EE]/30 bg-[#1E293B]/80"
            )}
        >
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    {/* Icon Box */}
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border",
                        direction === "in" && "border-green-500/20 bg-green-500/10 text-green-500",
                        direction === "out" && "border-slate-700 bg-slate-800/50 text-slate-400",
                        direction === "self" && "border-[#22D3EE]/20 bg-[#22D3EE]/10 text-[#22D3EE]"
                    )}>
                        {direction === "in" && <ArrowDownLeft className="h-5 w-5" />}
                        {direction === "out" && <ArrowUpRight className="h-5 w-5" />}
                        {direction === "self" && <Repeat className="h-5 w-5" />}
                    </div>

                    {/* Main Info */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white">
                                {isTokenTx ? transaction.action?.name || "Token Transfer" : (transaction.action?.name || (direction === "in" ? "Received" : "Sent"))}
                            </span>
                            <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800/50", statusInfo.color)}>
                                {statusInfo.text}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <span>{transaction.txHash.substring(0, 6)}...{transaction.txHash.substring(transaction.txHash.length - 6)}</span>
                            {/* Simple Shard Badge */}
                            <span className="text-slate-600">|</span>
                            <span className="text-slate-500" title={`Shard ${transaction.senderShard} to ${transaction.receiverShard}`}>
                                S:{transaction.senderShard} → R:{transaction.receiverShard}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                        "font-mono font-medium",
                        direction === "in" ? "text-green-400" : "text-white"
                    )}>
                        {direction === "in" && !isTokenTx ? "+" : ""}{formatDisplayValue()}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo(transaction.timestamp)}</span>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-slate-800/50 bg-[#0F172A]/30 p-4 text-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="grid gap-4 text-slate-400">
                        {/* Hashes Row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Transaction Hash</span>
                                {copied === "hash" && <span className="text-[10px] text-green-500 font-bold">Copied!</span>}
                            </div>
                            <div
                                className="flex items-center justify-between rounded bg-[#0F172A] p-2 font-mono text-white group/copy hover:bg-slate-900 transition-colors"
                                onClick={(e) => handleCopy(e, transaction.txHash, "hash")}
                            >
                                <span className="break-all text-xs">{transaction.txHash}</span>
                                <div className="p-1 rounded hover:bg-slate-800 text-slate-500 group-hover/copy:text-white transition-colors">
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Addresses Grid */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">From (Shard {transaction.senderShard})</span>
                                    {copied === "sender" && <span className="text-[10px] text-green-500">Copied!</span>}
                                </div>
                                <div
                                    className="flex items-center justify-between rounded bg-[#0F172A] p-2 font-mono text-[#22D3EE] group/copy hover:bg-slate-900 transition-colors"
                                    onClick={(e) => handleCopy(e, transaction.sender, "sender")}
                                >
                                    <span className="truncate text-xs">{transaction.sender}</span>
                                    <svg className="h-3 w-3 flex-shrink-0 text-slate-600 group-hover/copy:text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">To (Shard {transaction.receiverShard})</span>
                                    {copied === "receiver" && <span className="text-[10px] text-green-500">Copied!</span>}
                                </div>
                                <div
                                    className="flex items-center justify-between rounded bg-[#0F172A] p-2 font-mono text-[#22D3EE] group/copy hover:bg-slate-900 transition-colors"
                                    onClick={(e) => handleCopy(e, transaction.receiver, "receiver")}
                                >
                                    <span className="truncate text-xs">{transaction.receiver}</span>
                                    <svg className="h-3 w-3 flex-shrink-0 text-slate-600 group-hover/copy:text-[#22D3EE]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Fees & Gas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/50 pt-3">
                            <div>
                                <span className="block text-[10px] uppercase tracking-wider text-slate-500">Fee</span>
                                <span className="text-xs font-mono text-white">{fee.toFixed(6)} EGLD</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase tracking-wider text-slate-500">Gas Used</span>
                                <span className="text-xs font-mono text-white">{transaction.gasUsed?.toLocaleString() || "-"}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase tracking-wider text-slate-500">Gas Price</span>
                                <span className="text-xs font-mono text-white">{transaction.gasPrice?.toLocaleString() || "-"}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase tracking-wider text-slate-500">Nonce</span>
                                <span className="text-xs font-mono text-white">{transaction.nonce}</span>
                            </div>
                        </div>

                        {/* Footer: Function & Link */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-800/50 mt-2">
                            <div className="flex flex-col">
                                {transaction.miniBlockHash && (
                                    <span className="text-[10px] font-mono text-slate-600" title="MiniBlock Hash">
                                        MB: {transaction.miniBlockHash.substring(0, 8)}...
                                    </span>
                                )}
                                <span className="text-xs">
                                    Method: <span className="text-white font-mono bg-slate-800 px-1 rounded">{transaction.function || "Transfer"}</span>
                                </span>
                            </div>

                            <a
                                href={`https://explorer.multiversx.com/transactions/${transaction.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[#22D3EE] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                            >
                                View on Explorer <ArrowUpRight className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
