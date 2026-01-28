"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Coins, Image as ImageIcon, History, Wrench, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getXSpotlightProfile, getAccountDetails } from "@/lib/mx-api";

interface SidebarProps {
    slug: string;
}

export function Sidebar({ slug }: SidebarProps) {
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
        <aside className="fixed left-0 top-0 h-screen w-20 flex-col items-center border-r border-slate-800 bg-[#0F172A] py-8 flex max-sm:hidden z-50">
            <div className="mb-12">
                <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] shadow-lg shadow-[#22D3EE]/20 transition-transform hover:scale-105 active:scale-95">
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    >
                        <path
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            stroke="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </Link>
            </div>

            <nav className="flex flex-1 flex-col gap-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
                                isActive
                                    ? "bg-[#1E293B] text-[#22D3EE] shadow-lg shadow-black/20"
                                    : "text-slate-400 hover:bg-[#1E293B] hover:text-white"
                            )}
                            title={item.label}
                        >
                            <item.icon className={cn("h-6 w-6 transition-transform duration-300 group-hover:scale-110", isActive && "scale-110")} />
                            {isActive && (
                                <div className="absolute -right-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l-full bg-[#22D3EE]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-4">
                <AvatarWithFallback slug={slug} />
            </div>
        </aside>
    );
}

function AvatarWithFallback({ slug }: { slug: string }) {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchAvatar = async () => {
            try {
                let targetAddress = slug;
                if (!slug.startsWith("erd1")) {
                    const account = await getAccountDetails(slug);
                    if (account) targetAddress = account.address;
                }

                // Fallback default: Robohash
                const robohashUrl = `https://robohash.org/${targetAddress}?set=set1&bgset=bg2`;

                const profile = await getXSpotlightProfile(targetAddress);
                if (profile?.image) {
                    setAvatarUrl(profile.image);
                } else {
                    setAvatarUrl(robohashUrl);
                }
            } catch (e) {
                console.error("Failed to load avatar", e);
                // Even on error, try to show a robohash for the slug
                setAvatarUrl(`https://robohash.org/${slug}?set=set1&bgset=bg2`);
            }
        };
        fetchAvatar();
    }, [slug]);

    if (avatarUrl) {
        /* Using img tag to avoid next.config.js domain checklist issues for now */
        return (
            <img
                src={avatarUrl}
                alt="User Avatar"
                className="h-10 w-10 rounded-full object-cover border-2 border-slate-700 shadow-md transition-transform hover:scale-110 cursor-pointer"
            />
        );
    }

    return (
        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-500 shadow-inner animate-pulse">
            <User className="h-5 w-5" />
        </div>
    );
}
