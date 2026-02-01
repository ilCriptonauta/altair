"use client";

import { useState, useRef, useEffect } from "react";
import { type NFT } from "@/lib/mx-api";
import { Image as ImageIcon, Play, FileAudio, FileVideo, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NFTMediaProps {
    nft: NFT;
    className?: string;
    objectFit?: "cover" | "contain";
    autoPlay?: boolean;
}

export function NFTMedia({ nft, className, objectFit = "cover", autoPlay = false }: NFTMediaProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaError, setMediaError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Determine media sources
    const mediaItem = nft.media?.[0];
    const srcUrl = mediaItem?.url || nft.url || nft.uris?.[0] || mediaItem?.originalUrl;

    // Determine type robustly
    const fileType = mediaItem?.fileType || "";
    const isVideoUrl = (url?: string) => /\.(mp4|webm|ogg|mov)$/i.test(url || "");
    const isVideo = fileType.startsWith("video") || isVideoUrl(srcUrl);
    const isAudio = fileType.startsWith("audio") || /\.(mp3|wav|ogg)$/i.test(srcUrl || "");

    let thumbnailUrl = mediaItem?.thumbnailUrl;
    if (!thumbnailUrl && !isVideoUrl(nft.url)) {
        thumbnailUrl = nft.url;
    }

    useEffect(() => {
        if (!videoRef.current || !isVideo) return;

        if (isHovered || autoPlay) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    }, [isHovered, isVideo, autoPlay]);

    if (mediaError) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-slate-900/50 text-slate-600 border border-white/5", className)}>
                <AlertCircle className="h-6 w-6 mb-2 opacity-30" />
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Error Loading</span>
            </div>
        );
    }

    const renderPlaceholder = () => (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-slate-900 animate-pulse", className)}>
            <ImageIcon className="h-8 w-8 text-slate-800" />
        </div>
    );

    if (isVideo) {
        return (
            <div
                className={cn("relative overflow-hidden bg-black", className)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <video
                    ref={videoRef}
                    src={srcUrl}
                    poster={thumbnailUrl}
                    className={cn("h-full w-full transition-opacity duration-500",
                        objectFit === "cover" ? "object-cover" : "object-contain",
                        (isPlaying || !thumbnailUrl) ? "opacity-100" : "opacity-0 absolute inset-0"
                    )}
                    muted
                    loop
                    playsInline
                    onLoadedData={() => setIsLoading(false)}
                    onError={() => setMediaError(true)}
                />

                {thumbnailUrl && (
                    <div className={cn("absolute inset-0 transition-opacity duration-500", isPlaying ? "opacity-0" : "opacity-100")}>
                        <img
                            src={thumbnailUrl}
                            alt={nft.name}
                            className={cn("h-full w-full", objectFit === "cover" ? "object-cover" : "object-contain")}
                            onLoad={() => setIsLoading(false)}
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-2 right-2 rounded-full bg-white/10 p-1.5 backdrop-blur-xl border border-white/10 text-white shadow-lg">
                            <Play className="h-3 w-3 fill-current" />
                        </div>
                    </div>
                )}
                {isLoading && renderPlaceholder()}
            </div>
        );
    }

    if (isAudio) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5", className)}>
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-400/20 blur-2xl animate-pulse" />
                    <div className="relative h-16 w-16 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 border border-amber-400/20">
                        <FileAudio className="h-8 w-8" />
                    </div>
                </div>
                <span className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500">Audio Collectible</span>
            </div>
        );
    }

    return (
        <div className={cn("relative bg-slate-900 overflow-hidden", className)}>
            <img
                src={srcUrl}
                alt={nft.name}
                className={cn("h-full w-full transition-all duration-700",
                    objectFit === "cover" ? "object-cover" : "object-contain",
                    isLoading ? "scale-110 blur-xl opacity-0" : "scale-100 blur-0 opacity-100"
                )}
                onLoad={() => setIsLoading(false)}
                onError={() => setMediaError(true)}
                loading="lazy"
            />
            {isLoading && renderPlaceholder()}
        </div>
    );
}
