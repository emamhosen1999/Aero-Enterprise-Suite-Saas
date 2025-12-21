import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

/**
 * Pull-to-refresh component for mobile devices
 * Wrap your scrollable content with this component to enable pull-to-refresh gesture
 * 
 * @param {Object} props
 * @param {Function} props.onRefresh - Async function to call when refresh is triggered
 * @param {React.ReactNode} props.children - Content to wrap
 * @param {boolean} props.disabled - Whether pull-to-refresh is disabled
 * @param {number} props.threshold - Pull distance threshold to trigger refresh (default: 80)
 * @param {string} props.className - Additional CSS classes
 */
const PullToRefresh = ({ 
    onRefresh, 
    children, 
    disabled = false, 
    threshold = 80,
    className = '' 
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef(null);
    const startY = useRef(0);
    const currentY = useRef(0);
    const isAtTop = useRef(true);

    const y = useMotionValue(0);
    const rotate = useTransform(y, [0, threshold], [0, 360]);
    const opacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
    const scale = useTransform(y, [0, threshold], [0.5, 1]);

    const handleTouchStart = useCallback((e) => {
        if (disabled || isRefreshing) return;
        
        // Check if we're at the top of scroll
        const container = containerRef.current;
        if (container && container.scrollTop > 0) {
            isAtTop.current = false;
            return;
        }
        
        isAtTop.current = true;
        startY.current = e.touches[0].clientY;
    }, [disabled, isRefreshing]);

    const handleTouchMove = useCallback((e) => {
        if (disabled || isRefreshing || !isAtTop.current) return;
        
        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;
        
        // Only allow pulling down
        if (diff > 0) {
            // Apply resistance to the pull
            const resistance = 0.4;
            const newPullDistance = Math.min(diff * resistance, threshold * 1.5);
            setPullDistance(newPullDistance);
            y.set(newPullDistance);
            
            // Prevent default scroll behavior when pulling
            if (newPullDistance > 10) {
                e.preventDefault();
            }
        }
    }, [disabled, isRefreshing, threshold, y]);

    const handleTouchEnd = useCallback(async () => {
        if (disabled || isRefreshing || !isAtTop.current) return;
        
        if (pullDistance >= threshold) {
            // Trigger refresh
            setIsRefreshing(true);
            try {
                await onRefresh?.();
            } finally {
                setIsRefreshing(false);
            }
        }
        
        // Reset pull distance
        setPullDistance(0);
        y.set(0);
    }, [disabled, isRefreshing, pullDistance, threshold, onRefresh, y]);

    return (
        <div 
            ref={containerRef}
            className={`relative overflow-auto ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: pullDistance > 10 ? 'none' : 'auto' }}
        >
            {/* Pull indicator */}
            <AnimatePresence>
                {(pullDistance > 0 || isRefreshing) && (
                    <motion.div
                        className="absolute left-0 right-0 flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            top: Math.min(pullDistance, threshold) - 40,
                            height: 40,
                        }}
                    >
                        <motion.div
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center
                                ${isRefreshing 
                                    ? 'bg-primary/20 border-2 border-primary' 
                                    : pullDistance >= threshold 
                                        ? 'bg-success/20 border-2 border-success' 
                                        : 'bg-default-100 border-2 border-default-300'
                                }
                            `}
                            style={{ 
                                scale: isRefreshing ? 1 : scale,
                                opacity: isRefreshing ? 1 : opacity 
                            }}
                        >
                            <motion.div
                                animate={isRefreshing ? { rotate: 360 } : {}}
                                transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
                                style={{ rotate: isRefreshing ? undefined : rotate }}
                            >
                                <ArrowPathIcon 
                                    className={`w-5 h-5 ${
                                        isRefreshing 
                                            ? 'text-primary' 
                                            : pullDistance >= threshold 
                                                ? 'text-success' 
                                                : 'text-default-500'
                                    }`} 
                                />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <motion.div
                style={{ 
                    y: isRefreshing ? threshold / 2 : y,
                    transition: isRefreshing ? 'transform 0.2s ease-out' : undefined
                }}
            >
                {children}
            </motion.div>
        </div>
    );
};

export default PullToRefresh;
