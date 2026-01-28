"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "./StatsCard";
import {
    getEgldPrice,
    getNetworkStats,
    getValidatorCount,
    getDelegations,
    getProviderDetails,
    getIdentity,
    type NetworkStats,
    type EgldPrice,
    type Delegation,
    type ProviderDetails,
    type Identity
} from "@/lib/mx-api";
import { DollarSign, Activity, Users, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ValidatorModal } from "./ValidatorModal";
import { cn } from "@/lib/utils";

interface NetworkStatsWidgetProps {
    address?: string;
}

export function NetworkStatsWidget({ address }: NetworkStatsWidgetProps) {
    const [stats, setStats] = useState<NetworkStats | null>(null);
    const [price, setPrice] = useState<EgldPrice | null>(null);
    const [validators, setValidators] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // Validator Modal Logic
    const [showValidatorModal, setShowValidatorModal] = useState(false);
    const [userDelegation, setUserDelegation] = useState<Delegation | null>(null);
    const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
    const [providerIdentity, setProviderIdentity] = useState<Identity | null>(null);
    const [loadingValidator, setLoadingValidator] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            try {
                // Parallel fetch for speed
                const [networkStats, priceData, validatorCount] = await Promise.all([
                    getNetworkStats(),
                    getEgldPrice(),
                    getValidatorCount()
                ]);

                setStats(networkStats);
                setPrice(priceData);
                setValidators(validatorCount);
            } catch (error) {
                console.error("Failed to fetch network stats", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    // Fetch user delegation if address is present
    useEffect(() => {
        async function checkDelegation() {
            if (!address) return;
            const delegations = await getDelegations(address);
            // Just take the first active delegation for now
            const mainDelegation = delegations.find(d => Number(d.userActiveStake) > 0);
            if (mainDelegation) {
                setUserDelegation(mainDelegation);
            }
        }
        checkDelegation();
    }, [address]);

    const handleValidatorsClick = async () => {
        if (!userDelegation) return;

        setShowValidatorModal(true);

        if (!providerDetails) {
            setLoadingValidator(true);
            try {
                const details = await getProviderDetails(userDelegation.contract);
                setProviderDetails(details);

                if (details?.identity) {
                    const id = await getIdentity(details.identity);
                    setProviderIdentity(id);
                }
            } catch (e) {
                console.error("Error fetching validator details", e);
            } finally {
                setLoadingValidator(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-2xl bg-[#1E293B]/50" />
                ))}
            </div>
        );
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("en-US").format(num);
    };

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <StatsCard
                    label="EGLD Price"
                    value={price ? `$${price.usd.toFixed(2)}` : "N/A"}
                    trend={price ? `${price.usd_24h_change >= 0 ? "+" : ""}${price.usd_24h_change.toFixed(2)}% (24h)` : undefined}
                    icon={DollarSign}
                />
                <StatsCard
                    label="Total Transactions"
                    value={stats ? formatNumber(stats.transactions) : "0"}
                    subValue="Lifetime on-chain"
                    icon={Activity}
                />
                <StatsCard
                    label="Total Accounts"
                    value={stats ? formatNumber(stats.accounts) : "0"}
                    subValue="Active addresses"
                    icon={Users}
                />
                <StatsCard
                    label="Active Validators"
                    value={formatNumber(validators)}
                    subValue={userDelegation ? "Click to view your Validator" : "Securing the network"}
                    icon={Globe}
                    onClick={userDelegation ? handleValidatorsClick : undefined}
                    className={cn(userDelegation && "cursor-pointer hover:border-[#22D3EE]/50 active:scale-95")}
                />
            </div>

            {userDelegation && (
                <ValidatorModal
                    isOpen={showValidatorModal}
                    onClose={() => setShowValidatorModal(false)}
                    validator={{
                        contract: userDelegation.contract,
                        provider: providerDetails,
                        identity: providerIdentity
                    }}
                />
            )}
        </>
    );
}
