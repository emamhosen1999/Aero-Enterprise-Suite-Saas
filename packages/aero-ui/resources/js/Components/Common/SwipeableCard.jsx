import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { 
    PencilIcon, 
    TrashIcon, 
    CheckCircleIcon,
    ArrowPathIcon 
} from '@heroicons/react/24/outline';

/**
 * Swipeable wrapper component for mobile cards
 * Enables swipe left/right gestures to reveal quick actions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {Function} props.onEdit - Callback when edit action is triggered
 * @param {Function} props.onDelete - Callback when delete action is triggered
 * @param {Function} props.onStatusChange - Callback when status change is triggered
 * @param {boolean} props.disabled - Whether swipe actions are disabled
 * @param {string} props.className - Additional CSS classes
 */
const SwipeableCard = ({ 
    children, 
    onEdit, 
    onDelete, 
    onStatusChange,
    disabled = false,
    className = '' 
}) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null); // 'left' or 'right'
    const containerRef = useRef(null);
    const startX = useRef(0);
    
    const x = useMotionValue(0);
    const swipeThreshold = 80;

    // Action button opacity based on swipe distance
    const leftActionsOpacity = useTransform(x, [-swipeThreshold, -40, 0], [1, 0.5, 0]);
    const rightActionsOpacity = useTransform(x, [0, 40, swipeThreshold], [0, 0.5, 1]);

    const handleTouchStart = useCallback((e) => {
        if (disabled) return;
        startX.current = e.touches[0].clientX;
    }, [disabled]);

    const handleTouchMove = useCallback((e) => {
        if (disabled) return;
        
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        
        // Limit the swipe distance
        const clampedDiff = Math.max(-swipeThreshold * 1.5, Math.min(swipeThreshold * 1.5, diff));
        x.set(clampedDiff);
        
        if (Math.abs(clampedDiff) > 20) {
            setSwipeDirection(clampedDiff < 0 ? 'left' : 'right');
        }
    }, [disabled, x]);

    const handleTouchEnd = useCallback(() => {
        if (disabled) return;
        
        const currentX = x.get();
        
        if (Math.abs(currentX) >= swipeThreshold) {
            // Snap to revealed position
            if (currentX < 0) {
                x.set(-swipeThreshold);
                setIsRevealed(true);
                setSwipeDirection('left');
            } else {
                x.set(swipeThreshold);
                setIsRevealed(true);
                setSwipeDirection('right');
            }
        } else {
            // Snap back to closed
            x.set(0);
            setIsRevealed(false);
            setSwipeDirection(null);
        }
    }, [disabled, x]);

    const handleReset = useCallback(() => {
        x.set(0);
        setIsRevealed(false);
        setSwipeDirection(null);
    }, [x]);

    const handleAction = useCallback((action) => {
        action?.();
        handleReset();
    }, [handleReset]);

    // Close when clicking outside
    const handleClickOutside = useCallback((e) => {
        if (isRevealed && containerRef.current && !containerRef.current.contains(e.target)) {
            handleReset();
        }
    }, [isRevealed, handleReset]);

    // Add click outside listener
    React.useEffect(() => {
        if (isRevealed) {
            document.addEventListener('touchstart', handleClickOutside);
            return () => document.removeEventListener('touchstart', handleClickOutside);
        }
    }, [isRevealed, handleClickOutside]);

    return (
        <div 
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
        >
            {/* Left actions (revealed on swipe right) - Edit/Status */}
            <AnimatePresence>
                {(swipeDirection === 'right' || x.get() > 0) && (
                    <motion.div 
                        className="absolute left-0 top-0 bottom-0 flex items-stretch"
                        style={{ width: swipeThreshold, opacity: rightActionsOpacity }}
                    >
                        <button
                            onClick={() => handleAction(onEdit)}
                            className="flex-1 flex flex-col items-center justify-center gap-1 bg-primary text-white active:bg-primary/80 transition-colors"
                            aria-label="Edit"
                        >
                            <PencilIcon className="w-5 h-5" />
                            <span className="text-xs font-medium">Edit</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right actions (revealed on swipe left) - Delete/Status */}
            <AnimatePresence>
                {(swipeDirection === 'left' || x.get() < 0) && (
                    <motion.div 
                        className="absolute right-0 top-0 bottom-0 flex items-stretch"
                        style={{ width: swipeThreshold, opacity: leftActionsOpacity }}
                    >
                        {onStatusChange && (
                            <button
                                onClick={() => handleAction(onStatusChange)}
                                className="flex-1 flex flex-col items-center justify-center gap-1 bg-success text-white active:bg-success/80 transition-colors"
                                aria-label="Complete"
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                                <span className="text-xs font-medium">Done</span>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => handleAction(onDelete)}
                                className="flex-1 flex flex-col items-center justify-center gap-1 bg-danger text-white active:bg-danger/80 transition-colors"
                                aria-label="Delete"
                            >
                                <TrashIcon className="w-5 h-5" />
                                <span className="text-xs font-medium">Delete</span>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content */}
            <motion.div
                style={{ x }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative bg-content1"
            >
                {children}
            </motion.div>

            {/* Swipe hint indicator */}
            {!isRevealed && !disabled && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                    <ArrowPathIcon className="w-4 h-4 text-default-400" />
                </div>
            )}
        </div>
    );
};

export default SwipeableCard;
