"use client";

import { useState, useEffect } from "react";
import { X, HelpCircle } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const BANNERS = [
    {
        id: 'oox',
        name: 'OOX',
        description: 'The simplest and fastest marketplace on MultiversX.',
        link: 'https://oox.art',
        logo: '/oox-logo.png',
        color: '#EF4444', // Red
        isImage: true
    },
    {
        id: 'onionx',
        name: 'OnionXLabs',
        description: 'MultiversX builders.',
        link: 'https://x.com/onionxlabs',
        logo: '/onionx-logo.jpg',
        color: '#22D3EE', // Cyan
        isImage: true
    },
    {
        id: 'your-project',
        name: 'You Project Here',
        description: 'Contact us to partner.',
        link: '#',
        logo: null,
        color: '#FBBF24', // Amber
        isImage: false
    }
];

export function SponsorshipBanner() {
    const [isVisible, setIsVisible] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsVisible(false);
    };

    useEffect(() => {
        if (!isVisible) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isVisible]);

    const currentBanner = BANNERS[currentIndex];

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    key={currentBanner.id}
                    initial={{ rotateX: 90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: -90, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="relative w-full rounded-2xl border bg-[#1E293B]/80 p-3 sm:p-4 backdrop-blur-sm mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4 shadow-[0_0_15px_rgba(0,0,0,0.2)] group overflow-hidden perspective-1000"
                    style={{ borderColor: currentBanner.color }}
                >
                    {/* Background Glow */}
                    <div
                        className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32 blur-[40px] sm:blur-[50px] rounded-full pointer-events-none transition-colors duration-500"
                        style={{ backgroundColor: `${currentBanner.color}20` }} // 10-20% opacity
                    />

                    {/* Logo Area */}
                    <div className="shrink-0 relative z-10 bg-white/5 rounded-xl p-1.5 sm:p-2 h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center">
                        {currentBanner.isImage && currentBanner.logo ? (
                            <Image
                                src={currentBanner.logo}
                                alt={`${currentBanner.name} Logo`}
                                width={48}
                                height={48}
                                className="h-full w-full object-contain rounded-lg"
                            />
                        ) : (
                            <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400" />
                        )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 relative z-10 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
                                {currentBanner.name}
                            </h3>
                            <span
                                className="px-1.5 py-0.5 sm:px-2 rounded text-[9px] sm:text-[10px] text-white font-bold uppercase tracking-wider transition-colors duration-500 shrink-0"
                                style={{ backgroundColor: currentBanner.color }}
                            >
                                Sponsor
                            </span>
                        </div>
                        <p className="text-slate-300 text-xs sm:text-sm mt-0.5 sm:mt-1 truncate sm:whitespace-normal line-clamp-1 sm:line-clamp-none">
                            {currentBanner.description}
                        </p>
                    </div>

                    {/* Full Link Overlay */}
                    <a
                        href={currentBanner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-0"
                        aria-label={`Visit ${currentBanner.name}`}
                    />

                    {/* Close Button - Larger touch target */}
                    <button
                        onClick={handleClose}
                        className="relative z-10 -mr-1 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 shrink-0"
                        title="Dismiss"
                        style={{ zIndex: 20 }}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
