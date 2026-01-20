import React, { useMemo } from 'react';

// Import all block components
import HeroStandard from './HeroStandard';
import FeatureGrid from './FeatureGrid';
import CTASection from './CTASection';
import TextBlock from './TextBlock';
import PricingCards from './PricingCards';
import StatsSection from './StatsSection';
import Testimonials from './Testimonials';
import TeamGrid from './TeamGrid';
import Accordion from './Accordion';
import Newsletter from './Newsletter';
import ImageGallery from './ImageGallery';
import VideoEmbed from './VideoEmbed';
import Timeline from './Timeline';
import Divider from './Divider';
import CodeBlock from './CodeBlock';
import LogoCloud from './LogoCloud';
import TabsBlock from './TabsBlock';
import ContactForm from './ContactForm';

/**
 * Block Component Registry
 * 
 * Maps block type identifiers to their React components.
 * Add new blocks here as they are created.
 */
const BLOCK_COMPONENTS = {
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

const BlockRenderer = ({ block }) => {
  const Component = BLOCK_COMPONENTS[block.block_type];

  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="p-8 bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 font-semibold">
            Unknown block type: {block.block_type}
          </p>
          <pre className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 overflow-auto">
            {JSON.stringify(block, null, 2)}
          </pre>
        </div>
      );
    }
    return null;
  }

  // Apply display settings
  const visibilityClass = useMemo(() => {
    const visibility = block.settings?.visibility;
    switch (visibility) {
      case 'desktop':
        return 'hidden md:block';
      case 'tablet':
        return 'hidden lg:block';
      case 'mobile':
        return 'md:hidden';
      default:
        return '';
    }
  }, [block.settings?.visibility]);

  return (
    <div
      id={block.settings?.blockId}
      className={`transition-all duration-300 ${visibilityClass} ${block.settings?.customClass || ''}`}
      {...(block.settings?.customAttrs ? parseCustomAttrs(block.settings.customAttrs) : {})}
    >
      <Component content={block.content} settings={block.settings} />
    </div>
  );
};

/**
 * Parse custom HTML attributes from string format
 * Example: 'data-test="block" aria-label="Features"'
 */
const parseCustomAttrs = (attrString) => {
  const attrs = {};
  if (!attrString) return attrs;

  try {
    const regex = /(\w+(?:-\w+)*)="([^"]*)"/g;
    let match;
    while ((match = regex.exec(attrString)) !== null) {
      attrs[match[1]] = match[2];
    }
  } catch (e) {
    console.warn('Failed to parse custom attributes:', e);
  }

  return attrs;
};

/**
 * Register a new block component
 * Used by plugins or additional modules to add custom blocks
 */
export const registerBlockComponent = (blockType, component) => {
  BLOCK_COMPONENTS[blockType] = component;
};

/**
 * Get all registered block components
 */
export const getRegisteredBlocks = () => Object.keys(BLOCK_COMPONENTS);

export default BlockRenderer;
