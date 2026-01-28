"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLaunch = () => {
    if (!input.trim()) return;

    setIsLoading(true);
    // basic sanitization: remove whitespace
    const cleanInput = input.trim();
    router.push(`/dashboard/${cleanInput}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLaunch();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] p-4 text-white selection:bg-[#22D3EE] selection:text-[#0F172A]">
      <div className="flex w-full max-w-md flex-col items-center space-y-12 text-center">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            {/* Custom Rounded Star Icon */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              <path
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                stroke="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="relative">
            <h1 className="text-6xl font-black tracking-tight text-white drop-shadow-sm">
              Altair
            </h1>
            <div className="absolute -right-6 -top-2 rotate-12 rounded-full bg-[#22D3EE] px-2 py-0.5 text-xs font-bold text-white shadow-lg ring-2 ring-[#0F172A]">
              2.0
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-4">
          <p className="text-lg font-light text-slate-300">
            The <span className="font-bold text-white">premium</span> explorer for the <span className="font-bold text-white">MultiversX</span> network.
          </p>
        </div>

        {/* Interactive Section */}
        <div className="w-full space-y-4">
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-[#22D3EE] to-[#A78BFA] opacity-30 blur transition duration-500 group-hover:opacity-75"></div>
            <input
              type="text"
              placeholder="Enter any Herotag or erd"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="relative w-full rounded-lg bg-[#1E293B] px-4 py-4 text-center text-white placeholder-slate-400 shadow-xl outline-none ring-1 ring-slate-700/50 transition-all focus:ring-2 focus:ring-[#22D3EE] disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleLaunch}
            disabled={isLoading}
            className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] p-[1px] shadow-lg transition-transform active:scale-95 disabled:pointer-events-none disabled:opacity-75"
          >
            <div className="relative flex items-center justify-center gap-2 rounded-lg bg-[#1E293B]/50 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all hover:bg-transparent">
              {isLoading ? "Launching..." : "Launch Explorer"}
              {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </div>
          </button>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-8 opacity-80">
            {["Fast Execution", "User Focused", "Explorer Deep Dive"].map((badge, i) => (
              <div
                key={i}
                className="rounded-full border border-slate-700 bg-[#1E293B]/50 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-slate-400 backdrop-blur-sm transition-colors hover:border-[#22D3EE]/50 hover:text-[#22D3EE]"
              >
                {badge}
              </div>
            ))}
          </div>

          {/* Footer Credits */}
          <div className="pt-8 text-xs text-slate-500 font-medium tracking-wide">
            Powered by <a href="https://multiversx.com" target="_blank" rel="noopener noreferrer" className="font-bold text-[#22D3EE] hover:underline">MultiversX</a>
            <span className="mx-2">-</span>
            Made with ❤️ by <a href="https://x.com/onionxlabs" target="_blank" rel="noopener noreferrer" className="font-bold text-[#A78BFA] hover:underline">OnionXLabs</a>
          </div>
        </div>
      </div>
    </main>
  );
}
