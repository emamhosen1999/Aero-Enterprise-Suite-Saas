import React from 'react';

// Import all block components
import HeroStandard from './Blocks/HeroStandard';
import FeatureGrid from './Blocks/FeatureGrid';
import CTASection from './Blocks/CTASection';
import TextBlock from './Blocks/TextBlock';
import PricingCards from './Blocks/PricingCards';
import StatsSection from './Blocks/StatsSection';
import Testimonials from './Blocks/Testimonials';
import TeamGrid from './Blocks/TeamGrid';
import Accordion from './Blocks/Accordion';
import Newsletter from './Blocks/Newsletter';
import ImageGallery from './Blocks/ImageGallery';
import VideoEmbed from './Blocks/VideoEmbed';
import Timeline from './Blocks/Timeline';
import Divider from './Blocks/Divider';
import CodeBlock from './Blocks/CodeBlock';
import LogoCloud from './Blocks/LogoCloud';
import TabsBlock from './Blocks/TabsBlock';
import ContactForm from './Blocks/ContactForm';

/**
 * Block Component Registry
 * 
 * Maps block type identifiers to their React components.
 * Add new blocks here as they are created.
 */
const blockRegistry = {
    // Hero blocks
    hero_standard: HeroStandard,
    hero: HeroStandard, // Alias
    
    // Content blocks
    text_block: TextBlock,
    text: TextBlock, // Alias
    
    // Feature blocks
    feature_grid: FeatureGrid,
    features: FeatureGrid, // Alias
    
    // CTA blocks
    cta_section: CTASection,
    cta: CTASection, // Alias
    
    // Pricing blocks
    pricing_cards: PricingCards,
    pricing: PricingCards, // Alias
    
    // Stats blocks
    stats_section: StatsSection,
    stats: StatsSection, // Alias
    
    // Social proof blocks
    testimonials: Testimonials,
    
    // Team blocks
    team_grid: TeamGrid,
    team: TeamGrid, // Alias
    
    // Interactive blocks
    accordion: Accordion,
    faq: Accordion, // Alias
    tabs_block: TabsBlock,
    tabs: TabsBlock, // Alias
    
    // Form blocks
    newsletter: Newsletter,
    contact_form: ContactForm,
    contact: ContactForm, // Alias
    
    // Media blocks
    image_gallery: ImageGallery,
    gallery: ImageGallery, // Alias
    video_embed: VideoEmbed,
    video: VideoEmbed, // Alias
    logo_cloud: LogoCloud,
    logos: LogoCloud, // Alias
    
    // Timeline blocks
    timeline: Timeline,
    
    // Utility blocks
    divider: Divider,
    separator: Divider, // Alias
    
    // Code blocks
    code_block: CodeBlock,
    code: CodeBlock, // Alias
};

/**
 * BlockRenderer Component
 * 
 * Renders a CMS block based on its type.
 * Falls back to an error display for unknown block types.
 */
const BlockRenderer = ({ block }) => {
    const { block_type, content = {}, settings = {} } = block;
    
    // Get the component for this block type
    const BlockComponent = blockRegistry[block_type];
    
    if (!BlockComponent) {
        // Development warning for unknown block types
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Unknown block type: ${block_type}`);
        }
        
        return (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 my-4">
                <p className="text-warning-700 text-sm">
                    Unknown block type: <code className="bg-warning-100 px-1 rounded">{block_type}</code>
                </p>
            </div>
        );
    }
    
    // Merge content with any settings
    const mergedContent = {
        ...content,
        _settings: settings,
    };
    
    return <BlockComponent content={mergedContent} />;
};

/**
 * Register a custom block component
 * 
 * @param {string} type - The block type identifier
 * @param {React.Component} component - The React component to render
 */
export const registerBlock = (type, component) => {
    blockRegistry[type] = component;
};

/**
 * Check if a block type is registered
 * 
 * @param {string} type - The block type identifier
 * @returns {boolean}
 */
export const hasBlock = (type) => {
    return type in blockRegistry;
};

/**
 * Get all registered block types
 * 
 * @returns {string[]}
 */
export const getRegisteredBlocks = () => {
    return Object.keys(blockRegistry);
};

export default BlockRenderer;
