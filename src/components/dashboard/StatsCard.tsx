import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    subValue?: string;
    trend?: string;
    className?: string;
    onClick?: () => void;
}

export function StatsCard({ label, value, icon: Icon, subValue, trend, className, onClick }: StatsCardProps) {
    const isPositive = trend?.startsWith("+");
    const isNegative = trend?.startsWith("-");

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-slate-800 bg-[#1E293B]/50 p-6 backdrop-blur-sm transition-all hover:bg-[#1E293B]",
                onClick && "cursor-pointer hover:border-[#22D3EE]/50 active:scale-95",
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-400">{label}</p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">{value}</h3>
                    {subValue && (
                        <p className="mt-1 text-sm text-[#22D3EE]">{subValue}</p>
                    )}
                    {trend && (
                        <p className={cn(
                            "mt-1 text-sm font-medium",
                            isPositive && "text-green-400",
                            isNegative && "text-red-400",
                            !isPositive && !isNegative && "text-slate-400"
                        )}>
                            {trend}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="rounded-xl bg-slate-800/50 p-3 text-[#22D3EE]">
                        <Icon className="h-6 w-6" />
                    </div>
                )}
            </div>
        </div>
    );
}
