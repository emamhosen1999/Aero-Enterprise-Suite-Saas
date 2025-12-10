import { useState, useEffect } from 'react';

/**
 * Custom hook to replace MUI's useScrollTrigger
 * Detects scroll position and returns true when scrolled past threshold
 */
export const useScrollTrigger = (options = {}) => {
    const { threshold = 100, disableHysteresis = false } = options;
    const [trigger, setTrigger] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (disableHysteresis) {
                setTrigger(scrollTop > threshold);
            } else {
                // With hysteresis: different thresholds for scrolling up vs down
                setTrigger(prev => {
                    if (scrollTop > threshold + 10) return true;
                    if (scrollTop < threshold - 10) return false;
                    return prev;
                });
            }
        };

        // Set initial value
        handleScroll();

        // Listen for scroll events
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [threshold, disableHysteresis]);

    return trigger;
};

export default useScrollTrigger;
