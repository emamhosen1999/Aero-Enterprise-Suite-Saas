import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Spinner } from "@heroui/react";
import { PlayIcon, XMarkIcon } from "@heroicons/react/24/outline";

/**
 * VideoEmbed Block
 * 
 * Displays embedded videos from YouTube, Vimeo, or custom sources
 * with responsive aspect ratios and optional poster images.
 */
const VideoEmbed = ({ content = {} }) => {
    const {
        url = '',
        title = '',
        description = '',
        provider = 'auto', // 'youtube', 'vimeo', 'custom', 'auto'
        aspectRatio = '16:9',
        poster = '',
        autoplay = false,
        muted = false,
        loop = false,
        controls = true,
        showOverlay = true, // Show poster with play button
        overlayColor = 'rgba(0,0,0,0.4)',
        maxWidth = 'full', // 'sm', 'md', 'lg', 'xl', 'full'
        alignment = 'center',
    } = content;

    const [isPlaying, setIsPlaying] = useState(autoplay);
    const [isLoading, setIsLoading] = useState(false);

    // Detect video provider and extract ID
    const videoData = useMemo(() => {
        if (!url) return null;

        // YouTube
        const youtubeMatch = url.match(
            /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
        );
        if (youtubeMatch) {
            return {
                provider: 'youtube',
                id: youtubeMatch[1],
                embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}?${new URLSearchParams({
                    autoplay: autoplay || isPlaying ? '1' : '0',
                    mute: muted ? '1' : '0',
                    loop: loop ? '1' : '0',
                    controls: controls ? '1' : '0',
                    rel: '0',
                    modestbranding: '1',
                }).toString()}`,
                thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`,
            };
        }

        // Vimeo
        const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (vimeoMatch) {
            return {
                provider: 'vimeo',
                id: vimeoMatch[1],
                embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?${new URLSearchParams({
                    autoplay: autoplay || isPlaying ? '1' : '0',
                    muted: muted ? '1' : '0',
                    loop: loop ? '1' : '0',
                    controls: controls ? '1' : '0',
                }).toString()}`,
                thumbnailUrl: poster, // Vimeo requires API call for thumbnail
            };
        }

        // Custom video URL (mp4, webm, etc.)
        if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) {
            return {
                provider: 'custom',
                url: url,
                embedUrl: null,
            };
        }

        return {
            provider: 'unknown',
            url: url,
            embedUrl: url,
        };
    }, [url, autoplay, isPlaying, muted, loop, controls]);

    // Aspect ratio styles
    const aspectRatioClasses = {
        '16:9': 'aspect-video',
        '4:3': 'aspect-4/3',
        '1:1': 'aspect-square',
        '21:9': 'aspect-[21/9]',
        '9:16': 'aspect-[9/16]',
    };

    // Max width classes
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        full: 'max-w-full',
    };

    // Alignment classes
    const alignmentClasses = {
        left: 'mr-auto',
        center: 'mx-auto',
        right: 'ml-auto',
    };

    const handlePlay = () => {
        setIsLoading(true);
        setIsPlaying(true);
        // Simulate loading
        setTimeout(() => setIsLoading(false), 500);
    };

    if (!url || !videoData) {
        return (
            <div className="aspect-video bg-default-100 rounded-xl flex items-center justify-center">
                <p className="text-default-400">No video URL provided</p>
            </div>
        );
    }

    const containerClasses = `
        w-full
        ${maxWidthClasses[maxWidth] || 'max-w-full'}
        ${alignmentClasses[alignment] || 'mx-auto'}
    `;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={containerClasses}
        >
            {/* Title & Description */}
            {(title || description) && (
                <div className="mb-4 text-center">
                    {title && (
                        <h3 className="text-xl font-semibold mb-2">{title}</h3>
                    )}
                    {description && (
                        <p className="text-default-500">{description}</p>
                    )}
                </div>
            )}

            {/* Video Container */}
            <div
                className={`
                    relative overflow-hidden rounded-xl shadow-lg
                    ${aspectRatioClasses[aspectRatio] || 'aspect-video'}
                `}
            >
                {/* Custom HTML5 Video */}
                {videoData.provider === 'custom' ? (
                    <video
                        src={videoData.url}
                        poster={poster}
                        autoPlay={autoplay}
                        muted={muted}
                        loop={loop}
                        controls={controls}
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : !isPlaying && showOverlay && (poster || videoData.thumbnailUrl) ? (
                    /* Poster Overlay with Play Button */
                    <div className="absolute inset-0">
                        <img
                            src={poster || videoData.thumbnailUrl}
                            alt={title || 'Video thumbnail'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <div
                            className="absolute inset-0 flex items-center justify-center transition-opacity hover:opacity-90"
                            style={{ backgroundColor: overlayColor }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handlePlay}
                                className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl"
                            >
                                {isLoading ? (
                                    <Spinner size="lg" />
                                ) : (
                                    <PlayIcon className="w-10 h-10 text-default-800 ml-1" />
                                )}
                            </motion.button>
                        </div>
                    </div>
                ) : (
                    /* Embedded Player */
                    <iframe
                        src={videoData.embedUrl}
                        title={title || 'Embedded video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                )}
            </div>

            {/* Provider Badge */}
            {videoData.provider !== 'custom' && videoData.provider !== 'unknown' && (
                <div className="mt-2 flex justify-center">
                    <span className="text-xs text-default-400 capitalize">
                        Powered by {videoData.provider}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default VideoEmbed;
