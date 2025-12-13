import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { getGlossaryTranslation, isInGlossary } from './BusinessGlossary';

/**
 * Translation Context with Business Glossary + Google Translate API
 * 
 * Uses a curated glossary for domain-specific terms (HR, ERP, etc.)
 * Falls back to Google Translate for general text
 */

const TranslationContext = createContext(null);

// Cache configuration - reduced TTL to prevent stale translations
const CACHE_KEY = 'translations_cache_v5'; // Bumped version to invalidate old cache
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours (was 30 days)

// Google Translate language codes
const LANG_CODES = {
    'en': 'en', 'bn': 'bn', 'ar': 'ar', 'es': 'es',
    'fr': 'fr', 'de': 'de', 'hi': 'hi', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW',
};

/**
 * Load cache from localStorage
 */
const loadCache = () => {
    try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (stored) {
            const { data, timestamp } = JSON.parse(stored);
            if (Date.now() - timestamp < CACHE_EXPIRY) {
                return data || {};
            }
        }
    } catch (e) {}
    return {};
};

/**
 * Save cache to localStorage
 */
const saveCache = (data) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now(),
        }));
    } catch (e) {}
};

/**
 * Translate text using Business Glossary first, then Google Translate API
 */
const translateText = async (text, targetLang) => {
    if (!text?.trim() || targetLang === 'en') return text;

    // Check glossary first for domain-specific translations
    const glossaryTranslation = getGlossaryTranslation(text, targetLang);
    if (glossaryTranslation) {
        return glossaryTranslation;
    }

    const target = LANG_CODES[targetLang] || targetLang;

    try {
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`
        );
        
        if (!response.ok) return text;
        
        const data = await response.json();
        
        // Google returns: [[["translated", "original", ...], ...], ...]
        if (data?.[0]) {
            let translated = '';
            for (const part of data[0]) {
                if (part?.[0]) translated += part[0];
            }
            if (translated && translated !== text) {
                return translated;
            }
        }
    } catch (error) {
        console.warn('Translation error:', error);
    }

    return text;
};

/**
 * Batch translate multiple texts (glossary first, then API)
 */
const batchTranslate = async (texts, targetLang, cache) => {
    if (!texts.length || targetLang === 'en') {
        return texts.reduce((acc, t) => ({ ...acc, [t]: t }), {});
    }

    const results = {};
    const toTranslate = [];

    // Check cache and glossary first
    for (const text of texts) {
        // Check cache
        const cached = cache[targetLang]?.[text];
        if (cached) {
            results[text] = cached;
            continue;
        }
        
        // Check glossary
        const glossaryTranslation = getGlossaryTranslation(text, targetLang);
        if (glossaryTranslation) {
            results[text] = glossaryTranslation;
            continue;
        }
        
        // Need API translation
        toTranslate.push(text);
    }

    // Translate uncached texts in parallel (max 5 concurrent)
    const batchSize = 5;
    for (let i = 0; i < toTranslate.length; i += batchSize) {
        const batch = toTranslate.slice(i, i + batchSize);
        const translations = await Promise.all(
            batch.map(text => translateText(text, targetLang))
        );
        batch.forEach((text, idx) => {
            results[text] = translations[idx];
        });
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < toTranslate.length) {
            await new Promise(r => setTimeout(r, 50));
        }
    }

    return results;
};

/**
 * Inner Translation Provider
 */
function InnerTranslationProvider({ children }) {
    const { props } = usePage();
    
    const [locale, setLocaleState] = useState(() => {
        return localStorage.getItem('locale') || props.locale || 'en';
    });
    
    const [cache, setCache] = useState(loadCache);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationVersion, setTranslationVersion] = useState(0);
    
    const pendingRef = useRef(new Map()); // text -> Promise
    const queueRef = useRef(new Set());
    const timerRef = useRef(null);

    const supportedLocales = useMemo(() => 
        ['en', 'bn', 'ar', 'es', 'fr', 'de', 'hi', 'zh-CN', 'zh-TW'],
        []
    );

    const isRTL = useMemo(() => 
        ['ar', 'he', 'fa', 'ur'].includes(locale),
        [locale]
    );

    // Persist cache
    useEffect(() => {
        if (Object.keys(cache).length > 0) {
            saveCache(cache);
        }
    }, [cache]);

    // Apply RTL direction
    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = locale;
    }, [isRTL, locale]);

    /**
     * Process queued translations
     */
    const processQueue = useCallback(async () => {
        const texts = Array.from(queueRef.current);
        if (texts.length === 0) return;
        
        queueRef.current.clear();
        setIsTranslating(true);

        try {
            const results = await batchTranslate(texts, locale, cache);
            
            setCache(prev => ({
                ...prev,
                [locale]: { ...prev[locale], ...results }
            }));
            
            // Trigger re-render for components using translations
            setTranslationVersion(v => v + 1);
        } catch (error) {
            console.error('Queue processing error:', error);
        }
        
        setIsTranslating(false);
    }, [locale, cache]);

    /**
     * Queue text for translation
     */
    const queueTranslation = useCallback((text) => {
        if (!text || typeof text !== 'string' || locale === 'en') return;
        if (cache[locale]?.[text]) return;
        // Don't queue if in glossary (already handled)
        if (isInGlossary(text)) return;
        
        queueRef.current.add(text);
        
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(processQueue, 100);
    }, [locale, cache, processQueue]);

    /**
     * Synchronous translation (glossary -> cache -> queue for API)
     */
    const t = useCallback((text) => {
        if (!text || typeof text !== 'string') return text || '';
        if (locale === 'en') return text;
        
        // Check glossary first for instant domain-specific translation
        const glossaryTranslation = getGlossaryTranslation(text, locale);
        if (glossaryTranslation) return glossaryTranslation;
        
        // Check cache
        const cached = cache[locale]?.[text];
        if (cached) return cached;
        
        // Queue for API translation
        queueTranslation(text);
        return text;
    }, [locale, cache, queueTranslation, translationVersion]);

    /**
     * Async translation (waits for result)
     */
    const translateAsync = useCallback(async (text) => {
        if (!text || typeof text !== 'string') return text || '';
        if (locale === 'en') return text;
        
        const cached = cache[locale]?.[text];
        if (cached) return cached;
        
        // Check if already pending
        if (pendingRef.current.has(text)) {
            return pendingRef.current.get(text);
        }
        
        // Create pending promise
        const promise = translateText(text, locale).then(result => {
            setCache(prev => ({
                ...prev,
                [locale]: { ...prev[locale], [text]: result }
            }));
            pendingRef.current.delete(text);
            return result;
        });
        
        pendingRef.current.set(text, promise);
        return promise;
    }, [locale, cache]);

    /**
     * Change locale
     */
    const setLocale = useCallback((newLocale) => {
        if (newLocale === locale || !supportedLocales.includes(newLocale)) return;

        localStorage.setItem('locale', newLocale);
        setLocaleState(newLocale);
        
        // Clear pending queue
        queueRef.current.clear();
        pendingRef.current.clear();
        
        // Trigger re-render
        setTranslationVersion(v => v + 1);

        // Notify server
        axios.post('/locale', { locale: newLocale }).catch(() => {});
    }, [locale, supportedLocales]);

    /**
     * Clear cache
     */
    const clearCache = useCallback(() => {
        setCache({});
        localStorage.removeItem(CACHE_KEY);
        setTranslationVersion(v => v + 1);
    }, []);

    /**
     * Preload common UI texts
     */
    const preload = useCallback(async (texts) => {
        if (!texts?.length || locale === 'en') return;
        
        const uncached = texts.filter(t => !cache[locale]?.[t]);
        if (uncached.length === 0) return;
        
        setIsTranslating(true);
        const results = await batchTranslate(uncached, locale, cache);
        setCache(prev => ({
            ...prev,
            [locale]: { ...prev[locale], ...results }
        }));
        setIsTranslating(false);
        setTranslationVersion(v => v + 1);
    }, [locale, cache]);

    const value = useMemo(() => ({
        locale,
        t,
        translateAsync,
        setLocale,
        supportedLocales,
        isRTL,
        isTranslating,
        clearCache,
        preload,
        translationVersion, // For components that need to re-render on translation
    }), [locale, t, translateAsync, setLocale, supportedLocales, isRTL, isTranslating, clearCache, preload, translationVersion]);

    return (
        <TranslationContext.Provider value={value}>
            {children}
        </TranslationContext.Provider>
    );
}

/**
 * Translation Provider with error boundary
 */
export function TranslationProvider({ children }) {
    try {
        return <InnerTranslationProvider>{children}</InnerTranslationProvider>;
    } catch (error) {
        const fallback = {
            locale: 'en',
            t: (text) => text,
            translateAsync: async (text) => text,
            setLocale: () => {},
            supportedLocales: ['en'],
            isRTL: false,
            isTranslating: false,
            clearCache: () => {},
            preload: async () => {},
            translationVersion: 0,
        };

        return (
            <TranslationContext.Provider value={fallback}>
                {children}
            </TranslationContext.Provider>
        );
    }
}

/**
 * Hook to access translation context
 */
export function useTranslation() {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within TranslationProvider');
    }
    return context;
}

export default TranslationContext;
