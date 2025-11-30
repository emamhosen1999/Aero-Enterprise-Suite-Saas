import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Loading Indicator for Inertia.js navigation
 * Provides a highly visible, modern loading experience
 */
const LoadingIndicator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    let progressInterval;
    let slowTimeout;

    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);
      setShowSlowWarning(false);

      // Simulate progress
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress > 90) currentProgress = 90;
        setProgress(currentProgress);
      }, 200);

      // Show slow loading warning after 3 seconds
      slowTimeout = setTimeout(() => {
        setShowSlowWarning(true);
      }, 3000);
    };

    const stopLoading = () => {
      setProgress(100);
      clearInterval(progressInterval);
      clearTimeout(slowTimeout);
      
      // Delay hiding to show 100% completion
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        setShowSlowWarning(false);
      }, 300);
    };

    // Listen to Inertia navigation events
    const removeStartListener = router.on('start', startLoading);
    const removeFinishListener = router.on('finish', stopLoading);

    return () => {
      removeStartListener();
      removeFinishListener();
      clearInterval(progressInterval);
      clearTimeout(slowTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <>
          {/* Top Progress Bar - Thick and visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[99999]"
          >
            {/* Background track */}
            <div 
              className="h-1 w-full"
              style={{ backgroundColor: 'rgba(0, 111, 238, 0.15)' }}
            />
            
            {/* Progress bar */}
            <motion.div
              className="h-1 absolute top-0 left-0"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                background: 'linear-gradient(90deg, var(--theme-primary, #006FEE) 0%, #00C8FF 50%, var(--theme-primary, #006FEE) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
                boxShadow: '0 0 10px var(--theme-primary, #006FEE), 0 0 20px rgba(0, 111, 238, 0.5)'
              }}
            />

            {/* Animated glow effect at the end */}
            <motion.div
              className="absolute top-0 h-1 w-20"
              style={{
                left: `calc(${progress}% - 80px)`,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                filter: 'blur(2px)'
              }}
              animate={{
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          </motion.div>

          {/* Full screen overlay with spinner for slow loads */}
          <AnimatePresence>
            {showSlowWarning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99998] flex items-center justify-center pointer-events-none"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(2px)' }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl"
                  style={{
                    backgroundColor: 'var(--theme-content1, #FFFFFF)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {/* Animated spinner */}
                  <div className="relative w-12 h-12">
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-transparent"
                      style={{
                        borderTopColor: 'var(--theme-primary, #006FEE)',
                        borderRightColor: 'var(--theme-primary, #006FEE)'
                      }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                    <motion.div
                      className="absolute inset-1 rounded-full border-4 border-transparent"
                      style={{
                        borderBottomColor: 'rgba(0, 111, 238, 0.3)',
                        borderLeftColor: 'rgba(0, 111, 238, 0.3)'
                      }}
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                  </div>

                  <div className="text-center">
                    <p 
                      className="text-sm font-medium"
                      style={{ color: 'var(--theme-foreground, #11181C)' }}
                    >
                      Loading...
                    </p>
                    <p 
                      className="text-xs mt-1"
                      style={{ color: 'var(--theme-foreground, #666)' }}
                    >
                      This is taking longer than usual
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulsing dots indicator at bottom right */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: 'var(--theme-primary, #006FEE)',
              boxShadow: '0 4px 20px rgba(0, 111, 238, 0.4)'
            }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
            <span className="text-white text-xs font-medium ml-1">
              Loading
            </span>
          </motion.div>

          {/* CSS for shimmer animation */}
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

export default LoadingIndicator;
