import React, { useMemo } from 'react';
import HeroBlock from './Blocks/HeroBlock';
import RichTextBlock from './Blocks/RichTextBlock';
import CTABlock from './Blocks/CTABlock';
import ImageGalleryBlock from './Blocks/ImageGalleryBlock';
import TestimonialsBlock from './Blocks/TestimonialsBlock';
import FAQBlock from './Blocks/FAQBlock';
import VideoBlock from './Blocks/VideoBlock';
import FeaturesBlock from './Blocks/FeaturesBlock';
import PricingBlock from './Blocks/PricingBlock';
import StatsBlock from './Blocks/StatsBlock';
import ContactFormBlock from './Blocks/ContactFormBlock';
import AccordionBlock from './Blocks/AccordionBlock';
import TabsBlock from './Blocks/TabsBlock';
import NewsletterBlock from './Blocks/NewsletterBlock';
import BannerBlock from './Blocks/BannerBlock';
import CodeBlockComponent from './Blocks/CodeBlock';
import AdvancedTestimonialBlock from './Blocks/AdvancedTestimonialBlock';
import AdvancedPricingBlock from './Blocks/AdvancedPricingBlock';
import AdvancedFeatureListBlock from './Blocks/AdvancedFeatureListBlock';
import AdvancedContactFormBlock from './Blocks/AdvancedContactFormBlock';
import FAQSectionBlock from './Blocks/FAQSectionBlock';
import StatsCounterBlock from './Blocks/StatsCounterBlock';
import TeamMembersBlock from './Blocks/TeamMembersBlock';
import CallToActionBlock from './Blocks/CallToActionBlock';

const componentMap = {
    HeroBlock,
    RichTextBlock,
    CTABlock,
    ImageGalleryBlock,
    TestimonialsBlock,
    FAQBlock,
    VideoBlock,
    FeaturesBlock,
    PricingBlock,
    StatsBlock,
    ContactFormBlock,
    AccordionBlock,
    TabsBlock,
    NewsletterBlock,
    BannerBlock,
    CodeBlockComponent,
    AdvancedTestimonialBlock,
    AdvancedPricingBlock,
    AdvancedFeatureListBlock,
    AdvancedContactFormBlock,
    FAQSectionBlock,
    StatsCounterBlock,
    TeamMembersBlock,
    CallToActionBlock,
};

/**
 * Universal block renderer for page blocks
 * Renders appropriate component based on block type
 */
const BlockRenderer = ({ block }) => {
    if (!block) return null;

    const Component = componentMap[block.frontend_component];

    if (!Component) {
        console.warn(`Block component not found: ${block.frontend_component}`);
        return (
            <div className="p-4 border border-warning rounded bg-warning/10">
                <p className="text-sm text-warning">Block type not supported: {block.type}</p>
            </div>
        );
    }

    // Handle visibility conditions
    if (block.conditions) {
        const conditions = typeof block.conditions === 'string' ? JSON.parse(block.conditions) : block.conditions;
        
        // Check mobile visibility
        if (conditions.visibility && typeof window !== 'undefined') {
            const isMobile = window.innerWidth < 640;
            if (conditions.visibility === 'desktop' && isMobile) return null;
            if (conditions.visibility === 'mobile' && !isMobile) return null;
        }
    }

    // Apply custom CSS classes
    const customClasses = block.data?.customClasses || '';

    return (
        <div className={`block-renderer ${customClasses}`} data-block-id={block.id} data-block-type={block.type}>
            <Component block={block} data={block.data || {}} />
        </div>
    );
};

export default BlockRenderer;
