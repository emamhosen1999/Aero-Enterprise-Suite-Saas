import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from './TranslationContext';

/**
 * GlobalAutoTranslator — Advanced DOM Translation Engine
 *
 * Architecture improvements:
 *   - Batch processing: collects ALL text nodes, deduplicates, translates in one batch
 *   - requestIdleCallback: processes initial translation during browser idle time
 *   - Debounced mutations: groups DOM changes before translating
 *   - Smart deduplication: identical texts across nodes translate once, apply to all
 *   - Dirty tracking: avoids re-processing already-translated unchanged nodes
 */

// Patterns to skip (emails, phones, numbers, etc.)
const SKIP_PATTERNS = [
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i, // Email
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/, // Phone
    /^(https?:\/\/|www\.|\/)/i, // URL
    /^[$€£¥₹]?[\d,]+\.?\d*%?$/, // Numbers
    /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/, // Dates
    /^.{0,2}$/, // Too short
    /[\u0980-\u09FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF]/, // Already non-Latin
];

// Name-related field patterns
const NAME_PATTERNS = [/name/i, /author/i, /user/i, /employee/i, /member/i, /owner/i, /assignee/i];
const EMAIL_PATTERNS = [/email/i, /mail/i];
const PHONE_PATTERNS = [/phone/i, /mobile/i, /cell/i, /tel/i];

// Elements and attributes to skip
const SKIP_ELEMENTS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'CODE', 'PRE',
    'INPUT', 'TEXTAREA', 'SELECT', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO',
]);
const SKIP_ATTRS = ['data-no-translate', 'data-name', 'data-email', 'data-phone', 'notranslate'];

/**
 * Check if text should be translated
 */
function shouldTranslateText(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length < 3) return false;
    if (!/[a-zA-Z]{2,}/.test(trimmed)) return false;

    for (const pattern of SKIP_PATTERNS) {
        if (pattern.test(trimmed)) return false;
    }
    return true;
}

/**
 * Check if element should be skipped
 */
function shouldSkipElement(element) {
    if (!element) return true;
    if (SKIP_ELEMENTS.has(element.tagName)) return true;
    if (element.classList?.contains('notranslate')) return true;

    for (const attr of SKIP_ATTRS) {
        if (element.hasAttribute?.(attr)) return true;
    }

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
}

export function GlobalAutoTranslator({ children }) {
    const { locale, translateBatch, translationVersion } = useTranslation();
    const containerRef = useRef(null);
    const observerRef = useRef(null);
    const originalTexts = useRef(new Map()); // node -> original text
    const translatedNodes = useRef(new Set());
    const processingRef = useRef(false);
    const prevLocaleRef = useRef(locale);
    const mutationBatchRef = useRef([]);
    const mutationTimerRef = useRef(null);

    /**
     * Collect all translatable text nodes in a subtree.
     * Returns a Map<string, Node[]> (deduplicated by text content).
     */
    const collectTextNodes = useCallback((root) => {
        const nodeMap = new Map(); // text -> [nodes]

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
                const text = node.textContent?.trim();
                if (!text || text.length < 3) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        while (walker.nextNode()) {
            const node = walker.currentNode;
            let originalText = originalTexts.current.get(node);
            if (!originalText) {
                originalText = node.textContent;
                if (!shouldTranslateText(originalText)) continue;
                originalTexts.current.set(node, originalText);
            }

            if (!nodeMap.has(originalText)) nodeMap.set(originalText, []);
            nodeMap.get(originalText).push(node);
        }

        return nodeMap;
    }, []);

    /**
     * Apply translations to nodes.
     */
    const applyTranslations = useCallback((nodeMap, translations) => {
        for (const [text, nodes] of nodeMap) {
            const translated = translations[text];
            if (translated && translated !== text) {
                for (const node of nodes) {
                    if (node.textContent !== translated) {
                        node.textContent = translated;
                        translatedNodes.current.add(node);
                    }
                }
            }
        }
    }, []);

    /**
     * Process all text nodes in container — BATCH approach.
     * Collects all unique texts, translates them in one batch call,
     * then applies all translations at once.
     */
    const processAllNodes = useCallback(async (targetLocale) => {
        if (!containerRef.current || processingRef.current) return;
        processingRef.current = true;

        try {
            const nodeMap = collectTextNodes(containerRef.current);

            // Restore originals if switching to English
            if (targetLocale === 'en') {
                for (const [originalText, nodes] of nodeMap) {
                    for (const node of nodes) {
                        if (node.textContent !== originalText) {
                            node.textContent = originalText;
                        }
                    }
                }
                translatedNodes.current.clear();
                return;
            }

            const uniqueTexts = Array.from(nodeMap.keys());
            if (uniqueTexts.length === 0) return;

            // Single batch translate for ALL unique texts
            const translations = await translateBatch(uniqueTexts);
            applyTranslations(nodeMap, translations);
        } finally {
            processingRef.current = false;
        }
    }, [collectTextNodes, translateBatch, applyTranslations]);

    /**
     * Process newly added DOM nodes (batched mutations).
     * Collects nodes from multiple mutation events, deduplicates,
     * then translates in a single batch.
     */
    const processMutationBatch = useCallback(async () => {
        const nodes = [...mutationBatchRef.current];
        mutationBatchRef.current = [];

        if (!nodes.length || locale === 'en') return;

        const nodeMap = new Map(); // text -> [nodes]

        for (const node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (shouldSkipElement(node.parentElement)) continue;
                const text = node.textContent;
                if (!shouldTranslateText(text)) continue;
                originalTexts.current.set(node, text);
                if (!nodeMap.has(text)) nodeMap.set(text, []);
                nodeMap.get(text).push(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
                    acceptNode: (n) => {
                        if (shouldSkipElement(n.parentElement)) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT;
                    }
                });
                while (walker.nextNode()) {
                    const textNode = walker.currentNode;
                    const text = textNode.textContent;
                    if (!shouldTranslateText(text)) continue;
                    originalTexts.current.set(textNode, text);
                    if (!nodeMap.has(text)) nodeMap.set(text, []);
                    nodeMap.get(text).push(textNode);
                }
            }
        }

        if (!nodeMap.size) return;

        const translations = await translateBatch(Array.from(nodeMap.keys()));
        applyTranslations(nodeMap, translations);
    }, [locale, translateBatch, applyTranslations]);

    /**
     * Handle locale changes — clear and re-translate
     */
    useEffect(() => {
        if (locale !== prevLocaleRef.current) {
            prevLocaleRef.current = locale;
            translatedNodes.current.clear();
            processAllNodes(locale);
        }
    }, [locale, processAllNodes]);

    /**
     * Re-process when new translations arrive from Worker/API
     */
    useEffect(() => {
        if (translationVersion > 0 && locale !== 'en') {
            processAllNodes(locale);
        }
    }, [translationVersion, locale, processAllNodes]);

    /**
     * Initial setup: translate on mount + MutationObserver for new DOM content
     */
    useEffect(() => {
        // Schedule initial translation during idle time
        if (locale !== 'en') {
            if (typeof requestIdleCallback === 'function') {
                requestIdleCallback(() => processAllNodes(locale), { timeout: 3000 });
            } else {
                setTimeout(() => processAllNodes(locale), 300);
            }
        }

        // MutationObserver — batch new DOM nodes
        observerRef.current = new MutationObserver((mutations) => {
            if (locale === 'en') return;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    mutationBatchRef.current.push(node);
                }
            }

            // Debounce: process mutation batch after 100ms of quiet
            if (mutationTimerRef.current) clearTimeout(mutationTimerRef.current);
            mutationTimerRef.current = setTimeout(processMutationBatch, 100);
        });

        if (containerRef.current) {
            observerRef.current.observe(containerRef.current, {
                childList: true,
                subtree: true,
            });
        }

        return () => {
            observerRef.current?.disconnect();
            if (mutationTimerRef.current) clearTimeout(mutationTimerRef.current);
        };
    }, [locale, processAllNodes, processMutationBatch]);

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
