import React from 'react';
import { motion } from 'framer-motion';

/**
 * LogoCloud Block
 * Display partner, client, or sponsor logos in various layouts
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {Array} props.logos - Array of logo objects { image, name, url }
 * @param {string} props.layout - Layout style: 'grid', 'row', 'marquee'
 * @param {number} props.columns - Number of columns for grid layout (3-6)
 * @param {string} props.logoStyle - Logo styling: 'default', 'grayscale', 'color-on-hover'
 * @param {string} props.size - Logo size: 'sm', 'md', 'lg'
 * @param {boolean} props.showDividers - Whether to show dividers between logos
 * @param {string} props.background - Background style: 'transparent', 'light', 'dark'
 * @param {string} props.alignment - Text alignment: 'left', 'center', 'right'
 */
const LogoCloud = ({
    title = 'Trusted by industry leaders',
    subtitle = '',
    logos = [
        { image: '/images/logos/logo1.svg', name: 'Company 1', url: '' },
        { image: '/images/logos/logo2.svg', name: 'Company 2', url: '' },
        { image: '/images/logos/logo3.svg', name: 'Company 3', url: '' },
        { image: '/images/logos/logo4.svg', name: 'Company 4', url: '' },
        { image: '/images/logos/logo5.svg', name: 'Company 5', url: '' },
        { image: '/images/logos/logo6.svg', name: 'Company 6', url: '' },
    ],
    layout = 'row',
    columns = 6,
    logoStyle = 'grayscale',
    size = 'md',
    showDividers = false,
    background = 'transparent',
    alignment = 'center'
}) => {
    // Size classes for logos
    const sizeClasses = {
        sm: 'h-6 max-w-[80px]',
        md: 'h-10 max-w-[120px]',
        lg: 'h-14 max-w-[160px]'
    };

    // Background classes
    const backgroundClasses = {
        transparent: 'bg-transparent',
        light: 'bg-gray-50 dark:bg-gray-900',
        dark: 'bg-gray-900 dark:bg-gray-100'
    };

    // Text color based on background
    const textColorClasses = {
        transparent: 'text-gray-900 dark:text-white',
        light: 'text-gray-900 dark:text-white',
        dark: 'text-white dark:text-gray-900'
    };

    // Logo filter classes
    const getLogoClasses = () => {
        const base = `${sizeClasses[size]} object-contain transition-all duration-300`;
        
        switch (logoStyle) {
            case 'grayscale':
                return `${base} grayscale opacity-50 hover:grayscale-0 hover:opacity-100`;
            case 'color-on-hover':
                return `${base} grayscale hover:grayscale-0`;
            default:
                return base;
        }
    };

    // Alignment classes
    const alignmentClasses = {
        left: 'text-left items-start',
        center: 'text-center items-center',
        right: 'text-right items-end'
    };

    // Column classes for grid
    const columnClasses = {
        3: 'grid-cols-2 sm:grid-cols-3',
        4: 'grid-cols-2 sm:grid-cols-4',
        5: 'grid-cols-3 sm:grid-cols-5',
        6: 'grid-cols-3 sm:grid-cols-6'
    };

    // Render single logo
    const renderLogo = (logo, index) => {
        const LogoWrapper = logo.url ? 'a' : 'div';
        const wrapperProps = logo.url ? { href: logo.url, target: '_blank', rel: 'noopener noreferrer' } : {};

        return (
            <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
            >
                <LogoWrapper
                    {...wrapperProps}
                    className={`
                        flex items-center justify-center p-4 
                        ${logo.url ? 'cursor-pointer' : ''}
                        ${showDividers && layout === 'row' ? 'border-r border-gray-200 dark:border-gray-700 last:border-r-0' : ''}
                    `}
                >
                    {logo.image ? (
                        <img
                            src={logo.image}
                            alt={logo.name}
                            className={getLogoClasses()}
                            loading="lazy"
                        />
                    ) : (
                        <div className={`${sizeClasses[size]} flex items-center justify-center`}>
                            <span className={`text-lg font-bold ${
                                background === 'dark' 
                                    ? 'text-gray-300 dark:text-gray-600' 
                                    : 'text-gray-400 dark:text-gray-500'
                            }`}>
                                {logo.name}
                            </span>
                        </div>
                    )}
                </LogoWrapper>
            </motion.div>
        );
    };

    // Render marquee layout
    const renderMarquee = () => (
        <div className="relative overflow-hidden">
            {/* Left fade gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
            
            {/* Right fade gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
            
            <div className="flex animate-marquee gap-8">
                {/* Duplicate logos for seamless loop */}
                {[...logos, ...logos].map((logo, index) => (
                    <div key={index} className="flex-shrink-0">
                        {logo.image ? (
                            <img
                                src={logo.image}
                                alt={logo.name}
                                className={getLogoClasses()}
                                loading="lazy"
                            />
                        ) : (
                            <span className="text-lg font-bold text-gray-400">
                                {logo.name}
                            </span>
                        )}
                    </div>
                ))}
            </div>
            
            {/* CSS for marquee animation */}
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );

    return (
        <section className={`py-12 lg:py-16 ${backgroundClasses[background]}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                {(title || subtitle) && (
                    <div className={`mb-10 ${alignmentClasses[alignment]}`}>
                        {title && (
                            <motion.h2
                                className={`text-sm font-semibold uppercase tracking-wide ${textColorClasses[background]} opacity-60`}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 0.6, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                            >
                                {title}
                            </motion.h2>
                        )}
                        {subtitle && (
                            <motion.p
                                className={`mt-2 text-lg ${textColorClasses[background]} opacity-70`}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 0.7, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>
                )}

                {/* Logos */}
                {layout === 'marquee' ? (
                    renderMarquee()
                ) : layout === 'grid' ? (
                    <div className={`grid gap-8 ${columnClasses[columns]} items-center justify-items-center`}>
                        {logos.map((logo, index) => renderLogo(logo, index))}
                    </div>
                ) : (
                    <div className={`
                        flex flex-wrap justify-center items-center gap-8 lg:gap-12
                        ${showDividers ? 'divide-x divide-gray-200 dark:divide-gray-700' : ''}
                    `}>
                        {logos.map((logo, index) => renderLogo(logo, index))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default LogoCloud;
