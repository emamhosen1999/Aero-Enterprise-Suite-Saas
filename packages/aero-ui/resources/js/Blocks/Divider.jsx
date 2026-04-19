import React from 'react';
import { motion } from 'framer-motion';
import { Divider as HeroUIDivider } from "@heroui/react";

/**
 * Divider Block
 * 
 * A versatile section divider with multiple styles and decorative options.
 */
const Divider = ({ content = {} }) => {
    const {
        style = 'line', // 'line', 'dashed', 'dotted', 'gradient', 'icon', 'text', 'wave', 'zigzag'
        color = '#E4E4E7',
        thickness = 1,
        spacing = 'md', // 'sm', 'md', 'lg', 'xl'
        width = 'full', // '1/4', '1/3', '1/2', '2/3', '3/4', 'full'
        alignment = 'center',
        text = '',
        icon = '',
        animate = true,
    } = content;

    // Spacing classes
    const spacingClasses = {
        sm: 'py-4',
        md: 'py-8',
        lg: 'py-12',
        xl: 'py-16',
    };

    // Width classes
    const widthClasses = {
        '1/4': 'w-1/4',
        '1/3': 'w-1/3',
        '1/2': 'w-1/2',
        '2/3': 'w-2/3',
        '3/4': 'w-3/4',
        'full': 'w-full',
    };

    // Alignment classes
    const alignmentClasses = {
        left: 'mr-auto',
        center: 'mx-auto',
        right: 'ml-auto',
    };

    // Animation variants
    const lineVariants = {
        hidden: { scaleX: 0, opacity: 0 },
        visible: {
            scaleX: 1,
            opacity: 1,
            transition: { duration: 0.6, ease: 'easeOut' },
        },
    };

    const fadeVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } },
    };

    // Render based on style
    const renderDivider = () => {
        switch (style) {
            case 'line':
            case 'dashed':
            case 'dotted':
                return (
                    <motion.div
                        variants={animate ? lineVariants : undefined}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className={`${widthClasses[width]} ${alignmentClasses[alignment]}`}
                        style={{
                            height: thickness,
                            backgroundColor: style === 'line' ? color : 'transparent',
                            borderBottom: style !== 'line' ? `${thickness}px ${style} ${color}` : undefined,
                            transformOrigin: alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'center',
                        }}
                    />
                );

            case 'gradient':
                return (
                    <motion.div
                        variants={animate ? fadeVariants : undefined}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className={`${widthClasses[width]} ${alignmentClasses[alignment]}`}
                        style={{
                            height: thickness,
                            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                        }}
                    />
                );

            case 'icon':
                return (
                    <motion.div
                        variants={animate ? fadeVariants : undefined}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className={`flex items-center gap-4 ${alignmentClasses[alignment]} ${widthClasses[width]}`}
                    >
                        <div
                            className="flex-1"
                            style={{ height: thickness, backgroundColor: color }}
                        />
                        <div
                            className="shrink-0 text-2xl"
                            style={{ color }}
                        >
                            {icon || '✦'}
                        </div>
                        <div
                            className="flex-1"
                            style={{ height: thickness, backgroundColor: color }}
                        />
                    </motion.div>
                );

            case 'text':
                return (
                    <motion.div
                        variants={animate ? fadeVariants : undefined}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className={`flex items-center gap-4 ${alignmentClasses[alignment]} ${widthClasses[width]}`}
                    >
                        <div
                            className="flex-1"
                            style={{ height: thickness, backgroundColor: color }}
                        />
                        <span
                            className="shrink-0 px-4 text-sm font-medium uppercase tracking-wider"
                            style={{ color }}
                        >
                            {text || 'Section'}
                        </span>
                        <div
                            className="flex-1"
                            style={{ height: thickness, backgroundColor: color }}
                        />
                    </motion.div>
                );

            case 'wave':
                return (
                    <motion.div
                        variants={animate ? fadeVariants : undefined}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className={`${widthClasses[width]} ${alignmentClasses[alignment]}`}
                    >
                        <svg
                            viewBox="0 0 1200 40"
                            preserveAspectRatio="none"
                            className="w-full"
                            style={{ height: 40 }}
                        >
                            <path
                                d="M0,20 Q150,0 300,20 T600,20 T900,20 T1200,20"
                                fill="none"
                                stroke={color}
                                strokeWidth={thickness}
                            />
                        </svg>
                    </motion.div>
                );

            case 'zigzag':
                return (
                    <motion.div
                        variants={animate ? fadeVariants : undefined}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className={`${widthClasses[width]} ${alignmentClasses[alignment]}`}
                    >
                        <svg
                            viewBox="0 0 1200 30"
                            preserveAspectRatio="none"
                            className="w-full"
                            style={{ height: 30 }}
                        >
                            <path
                                d="M0,15 L30,5 L60,25 L90,5 L120,25 L150,5 L180,25 L210,5 L240,25 L270,5 L300,25 L330,5 L360,25 L390,5 L420,25 L450,5 L480,25 L510,5 L540,25 L570,5 L600,25 L630,5 L660,25 L690,5 L720,25 L750,5 L780,25 L810,5 L840,25 L870,5 L900,25 L930,5 L960,25 L990,5 L1020,25 L1050,5 L1080,25 L1110,5 L1140,25 L1170,5 L1200,15"
                                fill="none"
                                stroke={color}
                                strokeWidth={thickness}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </motion.div>
                );

            case 'dots':
                return (
                    <motion.div
                        variants={animate ? fadeVariants : undefined}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className={`flex justify-center gap-2 ${alignmentClasses[alignment]} ${widthClasses[width]}`}
                    >
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={animate ? { scale: 0 } : false}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="rounded-full"
                                style={{
                                    width: 8 + (i === 2 ? 4 : 0),
                                    height: 8 + (i === 2 ? 4 : 0),
                                    backgroundColor: color,
                                    opacity: i === 2 ? 1 : 0.5,
                                }}
                            />
                        ))}
                    </motion.div>
                );

            case 'stars':
                return (
                    <motion.div
                        variants={animate ? fadeVariants : undefined}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className={`flex items-center gap-4 ${alignmentClasses[alignment]} ${widthClasses[width]}`}
                    >
                        <div
                            className="flex-1"
                            style={{ height: thickness, backgroundColor: color }}
                        />
                        <div className="flex gap-1" style={{ color }}>
                            <span>★</span>
                            <span>★</span>
                            <span>★</span>
                        </div>
                        <div
                            className="flex-1"
                            style={{ height: thickness, backgroundColor: color }}
                        />
                    </motion.div>
                );

            default:
                return <HeroUIDivider className={widthClasses[width]} />;
        }
    };

    return (
        <div className={`${spacingClasses[spacing] || 'py-8'}`}>
            {renderDivider()}
        </div>
    );
};

export default Divider;
