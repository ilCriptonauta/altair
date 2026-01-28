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
                    className="relative w-full rounded-2xl border bg-[#1E293B]/80 p-4 backdrop-blur-sm mb-8 flex items-center gap-4 shadow-[0_0_15px_rgba(0,0,0,0.2)] group overflow-hidden perspective-1000"
                    style={{ borderColor: currentBanner.color }}
                >
                    {/* Background Glow */}
                    <div
                        className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 blur-[50px] rounded-full pointer-events-none transition-colors duration-500"
                        style={{ backgroundColor: `${currentBanner.color}20` }} // 10-20% opacity
                    />

                    {/* Logo Area */}
                    <div className="shrink-0 relative z-10 bg-white/5 rounded-xl p-2 h-14 w-14 flex items-center justify-center">
                        {currentBanner.isImage && currentBanner.logo ? (
                            <Image
                                src={currentBanner.logo}
                                alt={`${currentBanner.name} Logo`}
                                width={48}
                                height={48}
                                className="h-full w-full object-contain rounded-lg"
                            />
                        ) : (
                            <HelpCircle className="h-8 w-8 text-slate-400" />
                        )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 relative z-10">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg leading-tight">
                                {currentBanner.name}
                            </h3>
                            <span
                                className="px-2 py-0.5 rounded text-[10px] text-white font-bold uppercase tracking-wider transition-colors duration-500"
                                style={{ backgroundColor: currentBanner.color }}
                            >
                                Sponsor
                            </span>
                        </div>
                        <p className="text-slate-300 text-sm mt-0.5">
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

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="relative z-10 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 shrink-0"
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
