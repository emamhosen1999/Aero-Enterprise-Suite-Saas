import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

/**
 * Smooth Animation Components for Better UX
 * 
 * Features:
 * - Fade-in animations on component mount
 * - Scroll-triggered animations with Intersection Observer
 * - Smooth hover effects
 * - Staggered animations for multiple items
 * - Customizable animation variants
 */

// Fade In Animation Component
export const FadeIn = ({ 
    children, 
    delay = 0, 
    duration = 0.6, 
    direction = 'up',
    distance = 20,
    className = '',
    ...props 
}) => {
    const directions = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { y: 0, x: distance },
        right: { y: 0, x: -distance }
    };

    const variants = {
        hidden: {
            opacity: 0,
            ...directions[direction],
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
                duration,
                delay,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Scroll Triggered Animation Component
export const ScrollFadeIn = ({ 
    children, 
    delay = 0, 
    duration = 0.6,
    direction = 'up',
    distance = 30,
    threshold = 0.1,
    className = '',
    once = true,
    ...props 
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { 
        threshold, 
        once,
        margin: "-50px 0px -50px 0px"
    });

    const directions = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { y: 0, x: distance },
        right: { y: 0, x: -distance }
    };

    const variants = {
        hidden: {
            opacity: 0,
            ...directions[direction],
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
                duration,
                delay,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            ref={ref}
            variants={variants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Staggered Container Animation
export const StaggerContainer = ({ 
    children, 
    staggerDelay = 0.1, 
    className = '',
    ...props 
}) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: staggerDelay,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Stagger Item Animation
export const StaggerItem = ({ 
    children, 
    delay = 0, 
    duration = 0.5,
    direction = 'up',
    distance = 20,
    className = '',
    ...props 
}) => {
    const directions = {
        up: { y: distance, x: 0 },
        down: { y: -distance, x: 0 },
        left: { y: 0, x: distance },
        right: { y: 0, x: -distance }
    };

    const variants = {
        hidden: {
            opacity: 0,
            ...directions[direction],
            scale: 0.9
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            transition: {
                duration,
                delay,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            variants={variants}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Hover Scale Animation
export const HoverScale = ({ 
    children, 
    scale = 1.02, 
    duration = 0.2,
    className = '',
    ...props 
}) => {
    return (
        <motion.div
            whileHover={{ 
                scale,
                transition: { duration, ease: "easeOut" }
            }}
            whileTap={{ 
                scale: scale * 0.98,
                transition: { duration: 0.1 }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Card with smooth animations
export const AnimatedCard = ({ 
    children, 
    delay = 0,
    hoverScale = 1.02,
    direction = 'up',
    className = '',
    ...props 
}) => {
    return (
        <ScrollFadeIn
            delay={delay}
            direction={direction}
            className={className}
        >
            <HoverScale scale={hoverScale} {...props}>
                {children}
            </HoverScale>
        </ScrollFadeIn>
    );
};

// Page transition wrapper
export const PageTransition = ({ 
    children, 
    className = '',
    ...props 
}) => {
    const variants = {
        hidden: { 
            opacity: 0, 
            y: 20,
            scale: 0.98
        },
        visible: { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        },
        exit: { 
            opacity: 0, 
            y: -10,
            scale: 1.02,
            transition: {
                duration: 0.3,
                ease: "easeIn"
            }
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Smooth slide in from edges
export const SlideIn = ({ 
    children, 
    direction = 'left',
    distance = 100,
    delay = 0,
    duration = 0.6,
    className = '',
    ...props 
}) => {
    const directions = {
        left: { x: -distance, y: 0 },
        right: { x: distance, y: 0 },
        up: { x: 0, y: -distance },
        down: { x: 0, y: distance }
    };

    const variants = {
        hidden: {
            opacity: 0,
            ...directions[direction]
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: {
                duration,
                delay,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

// Loading state with smooth transitions
export const LoadingTransition = ({ 
    isLoading, 
    children, 
    loadingComponent,
    className = '',
    ...props 
}) => {
    const variants = {
        hidden: { 
            opacity: 0, 
            scale: 0.95 
        },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        }
    };

    return (
        <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            className={className}
            {...props}
        >
            {isLoading ? loadingComponent : children}
        </motion.div>
    );
};

export default {
    FadeIn,
    ScrollFadeIn,
    StaggerContainer,
    StaggerItem,
    HoverScale,
    AnimatedCard,
    PageTransition,
    SlideIn,
    LoadingTransition
};
