import { useState, useEffect } from "react";
import { useGetAccountInfo } from "@multiversx/sdk-dapp/out/react/account/useGetAccountInfo";
import { useGetNetworkConfig } from "@multiversx/sdk-dapp/out/react/network/useGetNetworkConfig";
import { Wrench, CheckCircle2, XCircle, Loader2, Sparkles, UserCheck, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoginModal } from "@/components/ui/LoginModal";
import { refreshAccount } from "@multiversx/sdk-dapp/out/utils/account/refreshAccount";
import { Transaction, Address } from "@multiversx/sdk-core/out/core";
import { TransactionManager } from "@multiversx/sdk-dapp/out/managers/TransactionManager";
import { getAccountProvider } from "@multiversx/sdk-dapp/out/providers/helpers/accountProvider";
import { GAS_PRICE } from "@multiversx/sdk-dapp/out/constants/mvx.constants";

const API_URL = "https://api.multiversx.com";
// xPortal DNS Contract is the modern standard for herotags
const DNS_CONTRACT = "erd1qqqqqqqqqqqqqpgq3dswlnnlkfd3gqrcv3dhzgnvh8ryf27g5rfsecnn2s";

export function HerotagManager() {
    const { address, account } = useGetAccountInfo();
    const { network } = useGetNetworkConfig();
    const isLoggedIn = !!address;

    const [herotag, setHerotag] = useState("");
    const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
    const [claiming, setClaiming] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const checkAvailability = async (value: string) => {
        if (!value) return;
        const nameToCheck = value.endsWith(".elrond") ? value : `${value}.elrond`;

        try {
            setStatus("checking");
            const res = await fetch(`${API_URL}/usernames/${nameToCheck}`);
            if (res.status === 404) setStatus("available");
            else if (res.ok) setStatus("taken");
            else setStatus("error");
        } catch (e) {
            console.error("Check failed", e);
            setStatus("error");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
        setHerotag(val);
        if (status !== "idle") setStatus("idle");

        // Auto check if long enough
        if (val.length > 2) {
            const timeout = setTimeout(() => checkAvailability(val), 500);
            return () => clearTimeout(timeout);
        }
    };

    const handleClaim = async () => {
        if (!herotag || status !== "available" || !address) return;
        setClaiming(true);
        try {
            // 1. Prepare Herotag Hex (including .elrond suffix if missing)
            const herotagWithSuffix = herotag.endsWith(".elrond") ? herotag : `${herotag}.elrond`;
            const herotagHex = Array.from(herotagWithSuffix)
                .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('');

            // 2. Create Transaction object (explicit v5 pattern)
            const tx = new Transaction({
                value: BigInt(0),
                data: new TextEncoder().encode(`register@${herotagHex}`),
                receiver: Address.newFromBech32(DNS_CONTRACT),
                sender: Address.newFromBech32(address),
                gasLimit: BigInt(6000000),
                gasPrice: BigInt(GAS_PRICE),
                chainID: network.chainId,
                nonce: BigInt(account.nonce),
                version: 1
            });

            // 3. Get Provider and Sign
            const provider = getAccountProvider();
            const signedTransactions = await provider.signTransactions([tx]);

            // 4. Send and Track
            const txManager = TransactionManager.getInstance();
            const sentTransactions = await txManager.send(signedTransactions);

            const sessionId = await txManager.track(sentTransactions, {
                transactionsDisplayInfo: {
                    processingMessage: "Processing Herotag Registration",
                    errorMessage: "Registration failed",
                    successMessage: "Herotag successfully reserved!"
                }
            });

            if (sessionId) {
                console.log("Transaction initiated. Session ID:", sessionId);
                // Refresh account after a short delay or based on session outcome
                setTimeout(() => refreshAccount(), 5000);
            }
        } catch (e) {
            console.error("Claim failed", e);
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-10 animate-in fade-in duration-700 w-full max-w-xl mx-auto pb-20">
            <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-2xl shadow-emerald-500/10 mb-2">
                    <Sparkles className="h-10 w-10" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Herotag Hub</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest leading-relaxed">
                        Reserve your unique identity in the MultiversX ecosystem
                    </p>
                </div>
            </div>

            <div className="w-full space-y-8 bg-[#1E293B]/20 p-10 rounded-[3rem] border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

                {!isLoggedIn ? (
                    <div className="flex flex-col items-center text-center space-y-6 py-6">
                        <div className="h-20 w-20 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-400/40">
                            <UserCheck className="h-10 w-10" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs">
                            Authentication required. Link your MultiversX wallet to begin the reservation protocol.
                        </p>
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="w-full rounded-2xl bg-emerald-500 px-8 py-4 font-black uppercase tracking-[0.2em] text-white hover:bg-emerald-400 transition-all hover:scale-[1.02] shadow-2xl shadow-emerald-500/20 active:scale-95"
                        >
                            Connect Wallet
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                <span className="text-xs font-black uppercase tracking-[0.1em] text-emerald-300">Vault Connected</span>
                            </div>
                            <span className="text-xs font-mono text-emerald-400/60 font-bold">{address.substring(0, 12)}...{address.substring(address.length - 4)}</span>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group/input">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-700 transition-colors group-focus-within/input:text-emerald-500">@</span>
                                <input
                                    type="text"
                                    value={herotag}
                                    onChange={handleInputChange}
                                    placeholder="your-unique-id"
                                    className={cn(
                                        "w-full rounded-3xl bg-black/40 border-2 px-14 py-6 text-2xl font-black text-white focus:outline-none transition-all placeholder:text-slate-800",
                                        status === "available" ? "border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10" :
                                            status === "taken" ? "border-red-500/50 focus:ring-4 focus:ring-red-500/10" :
                                                "border-white/5 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                    )}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    {status === "checking" && <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />}
                                    {status === "available" && <CheckCircle2 className="h-7 w-7 text-emerald-400 animate-in zoom-in" />}
                                    {status === "taken" && <XCircle className="h-7 w-7 text-red-500 animate-in zoom-in" />}
                                </div>
                            </div>

                            <div className="flex justify-center min-h-[24px]">
                                {status === "available" && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">ID Secure & Available</span>}
                                {status === "taken" && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">ID Already Reserved</span>}
                                {status === "error" && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Protocol Link Failed</span>}
                            </div>
                        </div>

                        <button
                            onClick={handleClaim}
                            disabled={status !== "available" || claiming}
                            className="w-full relative group overflow-hidden"
                        >
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-400 transition-transform duration-500 group-hover:scale-105",
                                (status !== "available" || claiming) && "grayscale"
                            )} />
                            <div className="relative flex items-center justify-center gap-3 py-5 px-8 font-black uppercase tracking-[0.3em] text-white">
                                {claiming ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Signing Node...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirm Reservation</span>
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                {[
                    { label: "Universal ID", desc: "One name for all apps" },
                    { label: "On-Chain", desc: "No central database" },
                    { label: "Verified", desc: "Secured by Validator" }
                ].map((item, i) => (
                    <div key={i} className="text-center p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-[11px] text-slate-500 font-bold uppercase">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
