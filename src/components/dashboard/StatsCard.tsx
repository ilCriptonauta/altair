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
                "group relative overflow-hidden rounded-2xl border border-white/5 bg-[#1E293B]/30 p-6 backdrop-blur-md transition-all duration-300",
                "hover:bg-[#1E293B]/50 hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20",
                onClick && "cursor-pointer active:scale-[0.98]",
                className
            )}
        >
            {/* Background Glow */}
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#22D3EE]/5 blur-3xl transition-opacity group-hover:bg-[#22D3EE]/10" />

            <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold tracking-tight text-white md:text-3xl bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
                            {value}
                        </h3>
                    </div>

                    {trend && (
                        <div className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm",
                            isPositive && "text-emerald-400 bg-emerald-400/5 border border-emerald-400/10",
                            isNegative && "text-rose-400 bg-rose-400/5 border border-rose-400/10",
                            !isPositive && !isNegative && "text-slate-400 bg-slate-400/5 border border-slate-400/10"
                        )}>
                            {trend}
                        </div>
                    )}

                    {subValue && (
                        <p className="text-sm font-medium text-slate-400/80">{subValue}</p>
                    )}
                </div>

                {Icon && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#22D3EE]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative rounded-xl bg-slate-800/80 p-3 text-[#22D3EE] border border-white/5 shadow-inner group-hover:border-[#22D3EE]/30 transition-colors">
                            <Icon className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:scale-110" />
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Progress/Status Line */}
            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
    );
}
