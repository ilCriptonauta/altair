"use client";

import { X, Globe, Twitter, Shield, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { formatAddress } from "@/lib/utils";
import type { Identity, ProviderDetails } from "@/lib/mx-api";

interface ValidatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    validator: {
        identity?: Identity | null;
        provider?: ProviderDetails | null;
        contract: string;
    };
}

export function ValidatorModal({ isOpen, onClose, validator }: ValidatorModalProps) {
    if (!isOpen) return null;

    const { identity, provider, contract } = validator;
    const name = identity?.name || provider?.identity || "Unknown Validator";
    const avatar = identity?.avatar;
    const description = identity?.description;
    const website = identity?.website;
    const twitter = identity?.twitter;
    const apr = provider?.apr || 0;
    const fee = provider?.serviceFee || 0;
    const cap = provider?.delegationCap;
    const isUncapped = cap === "0" || !cap;
    // Assuming if provider fetch succeeded, it's active. Feature flag in provider details helps too.
    const isActive = true;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Header Background */}
                <div className="h-32 w-full bg-gradient-to-r from-slate-900 to-slate-800 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-slate-300 hover:text-white transition-colors backdrop-blur-md z-10"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    {/* Abstract Grid/Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22D3EE_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
                </div>

                <div className="px-8 pb-8 -mt-12 relative">
                    {/* Avatar & Title Row */}
                    <div className="flex flex-col items-center text-center">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full border-4 border-[#0F172A] bg-slate-800 overflow-hidden shadow-xl">
                                {avatar ? (
                                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-slate-700 text-slate-500">
                                        <Shield className="h-10 w-10" />
                                    </div>
                                )}
                            </div>
                            {provider?.featured && (
                                <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-4 border-[#0F172A]" title="Featured">
                                    <CheckCircle2 className="h-4 w-4" />
                                </div>
                            )}
                        </div>

                        <div className="mt-4 space-y-1">
                            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                {name}
                                {provider?.featured && <CheckCircle2 className="h-5 w-5 text-[#22D3EE] fill-[#22D3EE]/20" />}
                            </h2>
                            {website && (
                                <a
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#22D3EE] hover:underline flex items-center justify-center gap-1"
                                >
                                    {website.replace(/^https?:\/\//, '')}
                                    <Globe className="h-3 w-3" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {description && (
                        <p className="mt-6 text-sm text-slate-400 text-center leading-relaxed line-clamp-3">
                            {description}
                        </p>
                    )}

                    {/* Metrics Grid */}
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-slate-800 flex flex-col items-center">
                            <span className="text-sm text-slate-500 font-medium">APR</span>
                            <span className="text-2xl font-bold text-green-400">{apr.toFixed(2)}%</span>
                        </div>
                        <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-slate-800 flex flex-col items-center">
                            <span className="text-sm text-slate-500 font-medium">Service Fee</span>
                            <span className="text-2xl font-bold text-white">{fee.toFixed(2)}%</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-slate-800 flex flex-col items-center text-center">
                            <div className="flex items-center gap-1 text-sm text-slate-500 font-medium">
                                Cap
                                <Info className="h-3 w-3" />
                            </div>
                            <span className="text-lg font-semibold text-white truncate w-full">
                                {isUncapped ? "Uncapped" : "Capped"}
                            </span>
                        </div>
                        <div className="bg-[#1E293B]/50 rounded-xl p-4 border border-slate-800 flex flex-col items-center">
                            <span className="text-sm text-slate-500 font-medium">Validators</span>
                            <span className="text-lg font-semibold text-white">{identity?.providers?.length || 1} Nodes</span>
                        </div>
                    </div>

                    {/* Footer / Link */}
                    <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center">
                        <a
                            href={`https://explorer.multiversx.com/providers/${contract}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 text-[#22D3EE] px-6 py-2 rounded-full font-medium transition-colors text-sm"
                        >
                            View on Explorer
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
