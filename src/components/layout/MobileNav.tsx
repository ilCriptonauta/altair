"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Coins, Image as ImageIcon, History, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
    slug: string;
}

export function MobileNav({ slug }: MobileNavProps) {
    const pathname = usePathname();

    const navItems = [
        {
            label: "Overview",
            href: `/dashboard/${slug}`,
            icon: LayoutDashboard,
        },
        {
            label: "Transactions",
            href: `/dashboard/${slug}/transactions`,
            icon: History,
        },
        {
            label: "Tokens",
            href: `/dashboard/${slug}/tokens`,
            icon: Coins,
        },
        {
            label: "NFTs",
            href: `/dashboard/${slug}/nfts`,
            icon: ImageIcon,
        },
        {
            label: "Tools",
            href: `/dashboard/${slug}/tools`,
            icon: Wrench,
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-slate-800 bg-[#0F172A]/80 px-4 backdrop-blur-xl sm:hidden">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "group relative flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all duration-300",
                            isActive ? "text-[#22D3EE]" : "text-slate-400 hover:text-white"
                        )}
                    >
                        <div className={cn(
                            "rounded-xl p-1.5 transition-all",
                            isActive && "bg-[#1E293B] shadow-lg shadow-[#22D3EE]/10"
                        )}>
                            <item.icon className={cn("h-6 w-6 transition-transform duration-300", isActive && "scale-110")} />
                        </div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {isActive && (
                            <div className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
