"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Globe, Shield, Wallet } from "lucide-react";
import { ProviderFactory } from "@multiversx/sdk-dapp/out/providers/ProviderFactory";
import { ProviderTypeEnum } from "@multiversx/sdk-dapp/out/providers/types/providerFactory.types";
import { useState } from "react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isConnecting, setIsConnecting] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleLogin = async (type: "extension" | "walletConnect" | "crossWindow") => {
        setIsConnecting(type);
        try {
            const provider = await ProviderFactory.create({
                type: type === "crossWindow" ? ProviderTypeEnum.crossWindow :
                    type === "walletConnect" ? ProviderTypeEnum.walletConnect :
                        ProviderTypeEnum.extension
            });

            await provider.login();
            onClose();
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setIsConnecting(null);
        }
    };

    const loginMethods = [
        {
            type: "extension" as const,
            name: "MultiversX DeFi Wallet",
            description: "Extension for Chrome & Brave",
            icon: Shield,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            border: "border-emerald-400/20",
        },
        {
            type: "walletConnect" as const,
            name: "xPortal App",
            description: "Mobile Wallet (WalletConnect)",
            icon: Smartphone,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20",
        },
        {
            type: "crossWindow" as const,
            name: "Web Wallet",
            description: "No installation required",
            icon: Globe,
            color: "text-orange-400",
            bg: "bg-orange-400/10",
            border: "border-orange-400/20",
        }
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0F172A] p-8 shadow-2xl"
                >
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 rounded-xl bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="mb-8 flex flex-col items-center text-center">
                        <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4 text-emerald-400">
                            <Wallet className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Connect Wallet</h2>
                        <p className="mt-2 text-sm font-medium text-slate-400">
                            Choose your preferred connection method to interact with MultiversX
                        </p>
                    </div>

                    <div className="space-y-4">
                        {loginMethods.map((method, idx) => (
                            <button
                                key={idx}
                                disabled={isConnecting !== null}
                                onClick={() => handleLogin(method.type)}
                                className={`flex w-full items-center gap-4 rounded-3xl border ${method.border} bg-white/[0.02] p-4 text-left transition-all hover:bg-white/[0.05] hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50 disabled:scale-100`}
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${method.bg} ${method.color}`}>
                                    {isConnecting === method.type ? (
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : (
                                        <method.icon className="h-6 w-6" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black uppercase tracking-tighter text-white group-hover:text-emerald-400 transition-colors">
                                        {method.name}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 italic">
                                        {method.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        Securely Powered by MultiversX
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
