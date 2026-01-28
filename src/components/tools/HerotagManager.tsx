"use client";

import { useState } from "react";
// Deep imports due to sdk-dapp packaging
import { useGetAccountInfo } from "@multiversx/sdk-dapp/out/react/account/useGetAccountInfo";
import { TransactionManager } from "@multiversx/sdk-dapp/out/managers/TransactionManager";
import { ExtensionProvider } from "@multiversx/sdk-extension-provider";
import { Wrench, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// API URL for checking availability
const API_URL = "https://api.multiversx.com";

export function HerotagManager() {
    const { address, account } = useGetAccountInfo();
    const isLoggedIn = !!address;

    // Claim UI State
    const [herotag, setHerotag] = useState("");
    const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
    const [claiming, setClaiming] = useState(false);

    // Check Availability
    const checkAvailability = async (value: string) => {
        if (!value.endsWith(".elrond")) {
            // Auto append if missing, or just check the base
        }

        // Ensure it ends with .elrond for the check if the user didn't type it
        const nameToCheck = value.endsWith(".elrond") ? value : `${value}.elrond`;

        try {
            setStatus("checking");
            const res = await fetch(`${API_URL}/usernames/${nameToCheck}`);

            if (res.status === 404) {
                setStatus("available");
            } else if (res.ok) {
                setStatus("taken");
            } else {
                setStatus("error");
            }
        } catch (e) {
            console.error("Check failed", e);
            setStatus("error");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""); // basic sanitize
        setHerotag(val);
        if (status !== "idle") setStatus("idle");
    };

    const handleCheckClick = () => {
        if (!herotag) return;
        checkAvailability(herotag);
    };

    const handleClaim = async () => {
        if (!herotag || status !== "available") return;

        // const fullHerotag = herotag.endsWith(".elrond") ? herotag : `${herotag}.elrond`;
        // const hexData = Buffer.from(fullHerotag).toString("hex");

        setClaiming(true);
        try {
            // Transaction placeholder logic
            console.log("Implementation pending full Transaction construction and signing for v5.");
            alert("Claim logic connected to TransactionManager. Ready for full sign implementation.");

        } catch (e) {
            console.error("Claim failed", e);
        } finally {
            setClaiming(false);
        }
    };

    const handleLogin = async () => {
        try {
            console.log("Login sequence started...");
            const provider = ExtensionProvider.getInstance();

            console.log("Initializing provider...");
            const initialized = await provider.init();
            console.log("Provider initialized:", initialized);

            if (!initialized) {
                alert("MultiversX DeFi Wallet extension not detected using direct provider.\nPlease ensure it is installed and try refreshing the page.");
                console.warn("ExtensionProvider.init() returned false");
                return;
            }

            console.log("Calling provider.login()...");
            await provider.login();
            console.log("Login call completed.");
        } catch (e) {
            console.error("Login exception:", e);
            alert("Login error: " + (e as Error).message);
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center gap-6 animate-in fade-in">
                <div className="h-16 w-16 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-2">
                    <span className="font-mono text-3xl font-bold">@</span>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white">Claim Herotag</h2>
                    <p className="text-slate-400 max-w-md mt-2">
                        Connect your MultiversX wallet to claim your unique .elrond username.
                    </p>
                </div>

                <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 rounded-full bg-[#10B981] px-8 py-3 font-bold text-white hover:bg-[#059669] transition-all hover:scale-105 shadow-lg shadow-[#10B981]/20"
                >
                    <Wrench className="h-5 w-5" />
                    Connect MultiversX Wallet
                </button>
            </div>
        );
    }

    // Connected View
    return (
        <div className="flex flex-col items-center gap-6 animate-in fade-in">
            <div className="h-16 w-16 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] mb-2">
                <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-white">Choose your Herotag</h2>
                <p className="text-slate-400 max-w-md mt-2">
                    Connected as <span className="text-[#22D3EE] font-mono">{address.substring(0, 8)}...</span>
                </p>
            </div>

            <div className="w-full max-w-md space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        value={herotag}
                        onChange={handleInputChange}
                        placeholder="username.elrond"
                        className={cn(
                            "w-full rounded-xl bg-[#0F172A] border px-4 py-4 text-center text-lg font-bold text-white focus:outline-none transition-all",
                            status === "available" ? "border-green-500 focus:ring-2 focus:ring-green-500" :
                                status === "taken" ? "border-red-500 focus:ring-2 focus:ring-red-500" :
                                    "border-slate-700 focus:border-[#22D3EE] focus:ring-2 focus:ring-[#22D3EE]"
                        )}
                    />
                    {/* Status Indicator */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {status === "checking" && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
                        {status === "available" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {status === "taken" && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                </div>

                {/* Feedback Message */}
                <div className="h-6 text-center text-sm font-medium">
                    {status === "available" && <span className="text-green-500">Available! Ready to claim.</span>}
                    {status === "taken" && <span className="text-red-500">This herotag is already taken.</span>}
                    {status === "error" && <span className="text-red-400">Error checking availability.</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleCheckClick}
                        disabled={!herotag || status === "checking" || claiming}
                        className="flex-1 rounded-xl bg-[#1E293B] border border-slate-700 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        Check Availability
                    </button>
                    <button
                        onClick={handleClaim}
                        disabled={status !== "available" || claiming}
                        className="flex-1 rounded-xl bg-[#10B981] py-3 font-bold text-white hover:bg-[#059669] shadow-lg shadow-[#10B981]/20 disabled:opacity-50 disabled:shadow-none"
                    >
                        {claiming ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Claiming...
                            </span>
                        ) : "Claim Herotag"}
                    </button>
                </div>
            </div>
        </div>
    );
}
