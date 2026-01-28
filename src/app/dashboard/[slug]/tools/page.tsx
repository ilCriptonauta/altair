"use client";

import { use, useState } from "react";
import { Wrench, Camera, Shuffle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { HerotagManager } from "@/components/tools/HerotagManager";
import { SnapshotManager } from "@/components/tools/SnapshotManager";
import { ShuffleTool } from "@/components/tools/ShuffleTool";

export default function ToolsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [activeTab, setActiveTab] = useState<"screenshot" | "shuffle" | "herotag">("screenshot");

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href={`/dashboard/${slug}`}
                    className="rounded-full bg-[#1E293B]/50 p-2 text-slate-400 hover:bg-[#1E293B] hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-white md:text-3xl flex items-center gap-2">
                        Tools Suite <Wrench className="h-6 w-6 text-[#22D3EE] opacity-50" />
                    </h1>
                    <p className="text-slate-400 text-sm">Utilities for your workflow</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex justify-center mb-10">
                <div className="flex rounded-full bg-[#1E293B] p-1 border border-slate-800/50">
                    <button
                        onClick={() => setActiveTab("screenshot")}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all",
                            activeTab === "screenshot"
                                ? "bg-[#22D3EE] text-[#0F172A] shadow-md"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Camera className="h-4 w-4" />
                        Screenshot
                    </button>

                    <button
                        onClick={() => setActiveTab("shuffle")}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all",
                            activeTab === "shuffle"
                                ? "bg-purple-500 text-white shadow-md"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <Shuffle className="h-4 w-4" />
                        Shuffle
                    </button>

                    <button
                        onClick={() => setActiveTab("herotag")}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all",
                            activeTab === "herotag"
                                ? "bg-[#10B981] text-white shadow-md"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <span className="font-mono text-xs">@</span>
                        Claim Herotag
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[300px]">
                {activeTab === "screenshot" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/30 p-8 py-12 backdrop-blur-sm max-w-2xl mx-auto">
                            <SnapshotManager />
                        </div>
                    </div>
                )}

                {activeTab === "shuffle" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/30 p-8 text-center backdrop-blur-sm flex flex-col items-center gap-4 max-w-2xl mx-auto">
                            <div className="w-full">
                                <ShuffleTool />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "herotag" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/30 p-8 py-12 backdrop-blur-sm max-w-2xl mx-auto">
                            <HerotagManager />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
