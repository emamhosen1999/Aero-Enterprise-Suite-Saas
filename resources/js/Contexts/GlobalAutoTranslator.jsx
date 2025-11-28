import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from './TranslationContext';

/**
 * GlobalAutoTranslator
 * 
 * Automatically translates text nodes in the DOM using MutationObserver.
 * Properly handles locale changes without page reload.
 */

// Patterns to skip (emails, phones, numbers, etc.)
const SKIP_PATTERNS = [
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i, // Email
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/, // Phone
    /^(https?:\/\/|www\.|\/)/i, // URL
    /^[$€£¥₹]?[\d,]+\.?\d*%?$/, // Numbers
    /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/, // Dates
    /^.{0,2}$/, // Too short
    /[\u0980-\u09FF\u0600-\u06FF\u4E00-\u9FFF]/, // Already non-Latin
];

// Name-related field patterns
const NAME_PATTERNS = [/name/i, /author/i, /user/i, /employee/i, /member/i, /owner/i, /assignee/i];
const EMAIL_PATTERNS = [/email/i, /mail/i];
const PHONE_PATTERNS = [/phone/i, /mobile/i, /cell/i, /tel/i];

// Elements and attributes to skip
const SKIP_ELEMENTS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE', 'INPUT', 'TEXTAREA', 'SELECT', 'SVG']);
const SKIP_ATTRS = ['data-no-translate', 'data-name', 'data-email', 'data-phone', 'notranslate'];

/**
 * Check if text should be translated
 */
const shouldTranslateText = (text) => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) return false;
    if (!/[a-zA-Z]{2,}/.test(trimmed)) return false; // Must have at least 2 letters
    
    for (const pattern of SKIP_PATTERNS) {
        if (pattern.test(trimmed)) return false;
    }
    return true;
};

/**
 * Check if element should be skipped
 */
const shouldSkipElement = (element) => {
    if (!element) return true;
    
    // Check element itself
    if (SKIP_ELEMENTS.has(element.tagName)) return true;
    if (element.classList?.contains('notranslate')) return true;
    
    // Check skip attributes
    for (const attr of SKIP_ATTRS) {
        if (element.hasAttribute?.(attr)) return true;
    }
    
    // Check for name/email/phone fields by class/id
    const classAndId = (element.className || '') + ' ' + (element.id || '');
    const allPatterns = [...NAME_PATTERNS, ...EMAIL_PATTERNS, ...PHONE_PATTERNS];
    for (const pattern of allPatterns) {
        if (pattern.test(classAndId)) return true;
    }
    
    // Check parents (up to 3 levels)
    let parent = element.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
        if (SKIP_ELEMENTS.has(parent.tagName)) return true;
        if (parent.classList?.contains('notranslate')) return true;
        for (const attr of SKIP_ATTRS) {
            if (parent.hasAttribute?.(attr)) return true;
        }
        parent = parent.parentElement;
        depth++;
    }
    
    return false;
};

export function GlobalAutoTranslator({ children }) {
    const { locale, translateAsync, translationVersion } = useTranslation();
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const originalTexts = useRef(new Map()); // node -> original text
    const translatedNodes = useRef(new Set());
    const processingRef = useRef(false);
    const prevLocaleRef = useRef(locale);

    /**
     * Translate a single text node
     */
    const translateNode = useCallback(async (node, targetLocale) => {
        if (!node || node.nodeType !== Node.TEXT_NODE) return;
        if (shouldSkipElement(node.parentElement)) return;
        
        // Get or store original text
        let originalText = originalTexts.current.get(node);
        if (!originalText) {
            originalText = node.textContent;
            if (!shouldTranslateText(originalText)) return;
            originalTexts.current.set(node, originalText);
        }
        
        // If English, restore original
        if (targetLocale === 'en') {
            if (node.textContent !== originalText) {
                node.textContent = originalText;
            }
            translatedNodes.current.delete(node);
            return;
        }
        
        // Translate
        try {
            const translated = await translateAsync(originalText);
            if (translated && translated !== originalText && translated !== node.textContent) {
                node.textContent = translated;
                translatedNodes.current.add(node);
            }
        } catch (e) {
            // Silent fail
        }
    }, [translateAsync]);

    /**
     * Process all text nodes in container
     */
    const processAllNodes = useCallback(async (targetLocale) => {
        if (!containerRef.current || processingRef.current) return;
        
        processingRef.current = true;
        
        const walker = document.createTreeWalker(
            containerRef.current,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (shouldSkipElement(node.parentElement)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    const text = node.textContent?.trim();
                    if (!text || text.length < 3) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];
        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }

        // Process in batches
        const batchSize = 20;
        for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize);
            await Promise.all(batch.map(node => translateNode(node, targetLocale)));
            
            // Yield to main thread
            if (i + batchSize < nodes.length) {
                await new Promise(r => requestAnimationFrame(r));
            }
        }
        
        processingRef.current = false;
    }, [translateNode]);

    /**
     * Handle locale changes
     */
    useEffect(() => {
        if (locale !== prevLocaleRef.current) {
            prevLocaleRef.current = locale;
            
            // Clear translated state
            translatedNodes.current.clear();
            
            // Re-translate all nodes
            processAllNodes(locale);
        }
    }, [locale, processAllNodes]);

    /**
     * Re-process when translations are fetched
     */
    useEffect(() => {
        if (translationVersion > 0 && locale !== 'en') {
            processAllNodes(locale);
        }
    }, [translationVersion, locale, processAllNodes]);

    /**
     * Initial setup and MutationObserver
     */
    useEffect(() => {
        // Initial translation
        if (locale !== 'en') {
            setTimeout(() => processAllNodes(locale), 500);
        }

        // Watch for new content
        observerRef.current = new MutationObserver((mutations) => {
            if (locale === 'en') return;
            
            for (const mutation of mutations) {
                // New nodes added
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        translateNode(node, locale);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // Process new element's text nodes
                        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
                        while (walker.nextNode()) {
                            translateNode(walker.currentNode, locale);
                        }
                    }
                }
            }
        });

        if (containerRef.current) {
            observerRef.current.observe(containerRef.current, {
                childList: true,
                subtree: true,
            });
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [locale, translateNode, processAllNodes]);

    return (
        <div ref={containerRef} style={{ display: 'contents' }}>
            {children}
        </div>
    );
}

/**
 * Helper components for marking content that should not be translated
 */
export function NoTranslate({ children, ...props }) {
    return <span data-no-translate="true" {...props}>{children}</span>;
}

export function UserName({ children, ...props }) {
    return <span data-name="true" className="notranslate" {...props}>{children}</span>;
}

export function Email({ children, ...props }) {
    return <span data-email="true" className="notranslate" {...props}>{children}</span>;
}

export function Phone({ children, ...props }) {
    return <span data-phone="true" className="notranslate" {...props}>{children}</span>;
}

export default GlobalAutoTranslator;
