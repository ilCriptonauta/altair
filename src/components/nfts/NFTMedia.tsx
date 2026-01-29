"use client";

import { useState, useRef, useEffect } from "react";
import { type NFT } from "@/lib/mx-api";
import { Image as ImageIcon, Play, FileAudio, FileVideo } from "lucide-react";
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

    // Determine media sources
    const mediaItem = nft.media?.[0];
    const srcUrl = mediaItem?.url || nft.url || mediaItem?.originalUrl;

    // Determine type based on file extension or metadata
    const fileType = mediaItem?.fileType || "";
    // Robust check for video extensions
    const isVideoUrl = (url?: string) => /\.(mp4|webm|ogg|mov)$/i.test(url || "");
    const isVideo = fileType.startsWith("video") || isVideoUrl(srcUrl);
    const isAudio = fileType.startsWith("audio") || /\.(mp3|wav|ogg)$/i.test(srcUrl || "");

    // Determine Thumbnail
    // If thumbnail is same as video URL, it's invalid as an image source
    let thumbnailUrl = mediaItem?.thumbnailUrl;
    if (!thumbnailUrl && !isVideoUrl(nft.url)) {
        // If main NFT url is NOT a video, we can use it as thumbnail
        thumbnailUrl = nft.url;
    }
    // Final fallback: if we have no thumbnail and main is video, we have NO image.

    // Handle Video Playback on Hover
    useEffect(() => {
        if (!videoRef.current || !isVideo) return;

        if (isHovered || autoPlay) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch((err) => {
                        // console.warn("Autoplay prevented:", err); // Suppress common autoplay errors
                        setIsPlaying(false);
                    });
            }
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0; // Reset to start
            setIsPlaying(false);
        }
    }, [isHovered, isVideo, autoPlay]);

    if (mediaError) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-slate-900 text-slate-600", className)}>
                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-[10px] uppercase tracking-wider">No Media</span>
            </div>
        );
    }

    // VIDEO RENDERER
    if (isVideo) {
        return (
            <div
                className={cn("relative overflow-hidden bg-slate-900", className)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <video
                    ref={videoRef}
                    src={srcUrl}
                    poster={thumbnailUrl} // Can be undefined, browser shows black or first frame
                    className={cn("h-full w-full transition-opacity duration-300",
                        objectFit === "cover" ? "object-cover" : "object-contain",
                        // If we have a thumbnail, we toggle opacity. If no thumbnail, we just show video always (but paused)
                        // If no thumbnail, we want opacity-100 always so we see the video frame.
                        (isPlaying || !thumbnailUrl) ? "opacity-100" : "opacity-0 absolute inset-0"
                    )}
                    muted
                    loop
                    playsInline
                    onError={() => setMediaError(true)}
                />

                {/* Poster Image (Visible when not playing AND we have a valid thumbnail) */}
                {thumbnailUrl && (
                    <div className={cn("absolute inset-0 transition-opacity duration-300 pointer-events-none", isPlaying ? "opacity-0" : "opacity-100")}>
                        <img
                            src={thumbnailUrl}
                            alt={nft.name}
                            className={cn("h-full w-full", objectFit === "cover" ? "object-cover" : "object-contain")}
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        {/* Play Badge Overlay on Thumbnail */}
                        <div className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 backdrop-blur-md text-white/80">
                            <Play className="h-3 w-3 fill-current" />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // AUDIO RENDERER (Simple placeholder for now)
    if (isAudio) {
        return (
            <div className={cn("flex flex-col items-center justify-center bg-slate-900 text-[#22D3EE]", className)}>
                <div className="relative z-10 p-4 rounded-full bg-[#22D3EE]/10 mb-2 animate-pulse">
                    <FileAudio className="h-8 w-8" />
                </div>
                <span className="text-xs font-bold text-slate-400">Audio NFT</span>
                {/* Could add mini player here */}
            </div>
        );
    }

    // STANDARD IMAGE RENDERER
    return (
        <div className={cn("relative bg-slate-900", className)}>
            <img
                src={srcUrl}
                alt={nft.name}
                className={cn("h-full w-full transition-transform duration-500",
                    objectFit === "cover" ? "object-cover" : "object-contain"
                    // Group hover scale handled by parent usually, but we can add utility class if passed in props
                )}
                onError={() => setMediaError(true)}
                loading="lazy"
            />
        </div>
    );
}
