import React, { useState } from 'react';
import { Tabs as HeroTabs, Tab } from "@heroui/react";
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from '@heroicons/react/24/outline';

/**
 * Tabs Block
 * Tabbed content sections with icon support
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {Array} props.tabs - Array of tab objects { title, icon, content, image }
 * @param {string} props.variant - Tab variant: 'underlined', 'bordered', 'solid', 'light'
 * @param {string} props.color - Tab color: 'primary', 'secondary', 'success', 'warning', 'danger'
 * @param {string} props.size - Tab size: 'sm', 'md', 'lg'
 * @param {string} props.alignment - Tab alignment: 'start', 'center', 'end'
 * @param {string} props.orientation - Tab orientation: 'horizontal', 'vertical'
 * @param {boolean} props.showIcons - Whether to show tab icons
 * @param {boolean} props.animated - Whether to animate tab content transitions
 */
const TabsBlock = ({
    title = '',
    subtitle = '',
    tabs = [
        { 
            title: 'Features', 
            icon: 'SparklesIcon',
            content: 'Our platform offers a comprehensive set of features designed to streamline your workflow and boost productivity.',
            image: ''
        },
        { 
            title: 'Benefits', 
            icon: 'StarIcon',
            content: 'Experience increased efficiency, better collaboration, and significant cost savings with our solution.',
            image: ''
        },
        { 
            title: 'Pricing', 
            icon: 'CurrencyDollarIcon',
            content: 'Flexible pricing plans to suit businesses of all sizes. Start with a free trial and upgrade as you grow.',
            image: ''
        }
    ],
    variant = 'underlined',
    color = 'primary',
    size = 'md',
    alignment = 'center',
    orientation = 'horizontal',
    showIcons = true,
    animated = true
}) => {
    const [selectedTab, setSelectedTab] = useState(tabs[0]?.title || '');

    // Get icon component
    const getIcon = (iconName) => {
        if (!iconName) return null;
        const IconComponent = Icons[iconName];
        return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
    };

    // Tab alignment classes
    const alignmentClasses = {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end'
    };

    // Render tab content with optional image
    const renderTabContent = (tab) => (
        <div className={`py-6 ${orientation === 'vertical' ? 'px-6' : ''}`}>
            {animated ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {tab.image && (
                            <div className="mb-6">
                                <img
                                    src={tab.image}
                                    alt={tab.title}
                                    className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                                    loading="lazy"
                                />
                            </div>
                        )}
                        <div 
                            className="prose prose-lg dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: tab.content }}
                        />
                    </motion.div>
                </AnimatePresence>
            ) : (
                <>
                    {tab.image && (
                        <div className="mb-6">
                            <img
                                src={tab.image}
                                alt={tab.title}
                                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                                loading="lazy"
                            />
                        </div>
                    )}
                    <div 
                        className="prose prose-lg dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: tab.content }}
                    />
                </>
            )}
        </div>
    );

    // Find currently selected tab content
    const selectedTabContent = tabs.find(tab => tab.title === selectedTab) || tabs[0];

    return (
        <section className="py-12 lg:py-16 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                {(title || subtitle) && (
                    <div className="text-center mb-10">
                        {title && (
                            <motion.h2
                                className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                {title}
                            </motion.h2>
                        )}
                        {subtitle && (
                            <motion.p
                                className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                {subtitle}
                            </motion.p>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {orientation === 'vertical' ? (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Vertical tab list */}
                            <div className="lg:w-64 shrink-0">
                                <div className="flex flex-col gap-2">
                                    {tabs.map((tab, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedTab(tab.title)}
                                            className={`
                                                flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                                                ${selectedTab === tab.title 
                                                    ? 'bg-primary text-white shadow-lg' 
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }
                                            `}
                                        >
                                            {showIcons && getIcon(tab.icon)}
                                            <span className="font-medium">{tab.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Vertical tab content */}
                            <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                                {renderTabContent(selectedTabContent)}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Horizontal HeroUI Tabs */}
                            <div className={`flex ${alignmentClasses[alignment]}`}>
                                <HeroTabs
                                    selectedKey={selectedTab}
                                    onSelectionChange={setSelectedTab}
                                    variant={variant}
                                    color={color}
                                    size={size}
                                    classNames={{
                                        tabList: "gap-6",
                                        tab: "h-12 px-6",
                                        tabContent: "group-data-[selected=true]:text-primary"
                                    }}
                                >
                                    {tabs.map((tab, index) => (
                                        <Tab
                                            key={tab.title}
                                            title={
                                                <div className="flex items-center gap-2">
                                                    {showIcons && getIcon(tab.icon)}
                                                    <span>{tab.title}</span>
                                                </div>
                                            }
                                        />
                                    ))}
                                </HeroTabs>
                            </div>

                            {/* Horizontal tab content */}
                            <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                                {renderTabContent(selectedTabContent)}
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </section>
    );
};

export default TabsBlock;
