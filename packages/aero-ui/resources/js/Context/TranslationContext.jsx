import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { getGlossaryTranslation, isInGlossary } from './BusinessGlossary';

/**
 * Advanced Translation Context — Aero Enterprise Suite
 *
 * Architecture:
 *   - Web Worker for Google Translate API calls + IndexedDB caching (off main thread)
 *   - In-memory Map for instant synchronous lookups (populated from Worker)
 *   - Business Glossary for domain-specific term accuracy (main thread, instant)
 *   - Server dictionaries from Inertia props (highest priority)
 *   - Batch API calls (join texts with \n separator — reduces ~100 calls to 2-3)
 *   - Automatic fallback to main-thread fetch if Worker unavailable
 *
 * Lookup priority:
 *   1. Server translations (from aero-i18n lang/*.json via Inertia props)
 *   2. In-memory cache (synced from Worker/IndexedDB)
 *   3. Business Glossary (domain-specific HR/ERP terms)
 *   4. Google Translate API via Worker (batch, async, off main thread)
 *   5. Original text (passthrough while translating)
 */

const TranslationContext = createContext(null);

// ─── Fallback: localStorage for when Worker/IndexedDB unavailable ────────────
const LS_KEY = 'aero_i18n_cache_v2';
const LS_EXPIRY = 48 * 60 * 60 * 1000; // 48 hours

function lsLoad() {
    try {
        const s = localStorage.getItem(LS_KEY);
        if (s) {
            const { d, t } = JSON.parse(s);
            if (Date.now() - t < LS_EXPIRY) return d || {};
        }
        // Migrate old cache format
        const old = localStorage.getItem('translations_cache_v6');
        if (old) {
            const { data, timestamp } = JSON.parse(old);
            if (Date.now() - timestamp < LS_EXPIRY && data) {
                localStorage.removeItem('translations_cache_v6');
                return data;
            }
            localStorage.removeItem('translations_cache_v6');
        }
    } catch { /* ignore */ }
    return {};
}

function lsSave(d) {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ d, t: Date.now() })); } catch { /* ignore */ }
}

// Google Translate language codes
const LANG_CODES = {
    en: 'en', bn: 'bn', ar: 'ar', es: 'es', fr: 'fr', de: 'de',
    hi: 'hi', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', pt: 'pt', ru: 'ru',
    ja: 'ja', ko: 'ko', it: 'it', nl: 'nl', tr: 'tr', pl: 'pl',
    vi: 'vi', th: 'th', id: 'id',
};

// ─── Fallback: main-thread batch Google Translate ────────────────────────────

async function fallbackBatchTranslate(texts, targetLang) {
    const target = LANG_CODES[targetLang] || targetLang;
    const results = {};

    // Try batch first (join with \n)
    const maxChars = 2000;
    const batches = [];
    let batch = [];
    let chars = 0;

    for (const text of texts) {
        const len = encodeURIComponent(text).length;
        if ((chars + len > maxChars || batch.length >= 80) && batch.length > 0) {
            batches.push(batch);
            batch = [text];
            chars = len;
        } else {
            batch.push(text);
            chars += len + 3;
        }
    }
    if (batch.length) batches.push(batch);

    for (const b of batches) {
        if (b.length === 1) {
            try {
                const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(b[0])}`);
                if (r.ok) {
                    const d = await r.json();
                    let out = '';
                    if (d?.[0]) for (const p of d[0]) { if (p?.[0]) out += p[0]; }
                    if (out) results[b[0]] = out;
                }
            } catch { /* silent */ }
            continue;
        }

        const combined = b.join('\n');
        try {
            const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(combined)}`);
            if (r.ok) {
                const d = await r.json();
                let full = '';
                if (d?.[0]) for (const p of d[0]) { if (p?.[0]) full += p[0]; }
                const parts = full.split('\n');
                if (parts.length === b.length) {
                    b.forEach((t, i) => { results[t] = parts[i].trim() || t; });
                    continue;
                }
            }
        } catch { /* silent */ }

        // Individual fallback for this batch
        for (const text of b) {
            if (results[text]) continue;
            try {
                const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`);
                if (r.ok) {
                    const d = await r.json();
                    let out = '';
                    if (d?.[0]) for (const p of d[0]) { if (p?.[0]) out += p[0]; }
                    if (out) results[text] = out;
                }
            } catch { /* silent */ }
        }
    }

    return results;
}

// ─── Inner Translation Provider ──────────────────────────────────────────────

function InnerTranslationProvider({ children }) {
    const { props } = usePage();

    const serverTranslations = props.translations || {};
    const serverLocale = props.locale || 'en';
    const serverSupportedLocales = props.supportedLocales || ['en'];
    const serverLocaleMeta = props.localeMeta || {};

    const [locale, setLocaleState] = useState(() =>
        localStorage.getItem('locale') || serverLocale
    );
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationVersion, setTranslationVersion] = useState(0);
    const [workerReady, setWorkerReady] = useState(false);
    const [stats, setStats] = useState({ hits: 0, misses: 0, apiCalls: 0, batchCalls: 0 });

    // In-memory cache for instant sync lookups (keyed by text, scoped to current locale)
    const memoryCacheRef = useRef(new Map());
    const workerRef = useRef(null);
    const useWorkerRef = useRef(true);
    const localeRef = useRef(locale);
    const queueRef = useRef(new Set());
    const timerRef = useRef(null);
    const pendingPromises = useRef(new Map()); // text -> { resolve, promise }
    const lsCacheRef = useRef(lsLoad());

    const isRTL = useMemo(() => ['ar', 'he', 'fa', 'ur'].includes(locale), [locale]);

    // Keep localeRef in sync
    useEffect(() => { localeRef.current = locale; }, [locale]);

    // Apply document direction + lang
    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = locale;
    }, [isRTL, locale]);

    // ─── Web Worker Setup ────────────────────────────────────────────────────

    useEffect(() => {
        let worker;
        try {
            worker = new Worker(
                new URL('./TranslationWorker.js', import.meta.url),
                { type: 'module' }
            );
        } catch (e) {
            console.warn('[i18n] Worker unavailable, using fallback:', e.message);
            useWorkerRef.current = false;
            // Seed memory cache from localStorage
            const lsData = lsCacheRef.current[localeRef.current];
            if (lsData) {
                for (const [text, translation] of Object.entries(lsData)) {
                    memoryCacheRef.current.set(text, translation);
                }
            }
            return;
        }

        worker.onmessage = (e) => {
            const msg = e.data;
            switch (msg.type) {
                case 'ready':
                    setWorkerReady(true);
                    break;

                case 'cache-loaded': {
                    const currentLocale = localeRef.current;
                    if (msg.locale === currentLocale) {
                        const mc = memoryCacheRef.current;
                        for (const [text, translation] of Object.entries(msg.cache)) {
                            mc.set(text, translation);
                        }
                        // Also seed localStorage fallback
                        lsCacheRef.current[msg.locale] = {
                            ...lsCacheRef.current[msg.locale],
                            ...msg.cache,
                        };
                        lsSave(lsCacheRef.current);
                        setTranslationVersion(v => v + 1);
                    }
                    break;
                }

                case 'translated': {
                    const currentLocale = localeRef.current;
                    const isCurrentLocale = msg.locale === currentLocale;
                    const mc = memoryCacheRef.current;

                    for (const [text, translation] of Object.entries(msg.results)) {
                        if (isCurrentLocale) {
                            mc.set(text, translation);
                        }
                        // Resolve pending promises
                        const entry = pendingPromises.current.get(text);
                        if (entry) {
                            entry.resolve(translation);
                            pendingPromises.current.delete(text);
                        }
                    }

                    if (isCurrentLocale) {
                        lsCacheRef.current[msg.locale] = {
                            ...lsCacheRef.current[msg.locale],
                            ...msg.results,
                        };
                        lsSave(lsCacheRef.current);
                        setTranslationVersion(v => v + 1);
                        setIsTranslating(queueRef.current.size > 0);
                    }
                    break;
                }

                case 'stats':
                    setStats(msg.stats || {});
                    break;

                case 'cache-cleared':
                    memoryCacheRef.current.clear();
                    lsCacheRef.current = {};
                    localStorage.removeItem(LS_KEY);
                    setTranslationVersion(v => v + 1);
                    break;
            }
        };

        worker.onerror = (e) => {
            console.warn('[i18n] Worker error, switching to fallback:', e.message);
            useWorkerRef.current = false;
        };

        workerRef.current = worker;
        worker.postMessage({ type: 'init', locale: localeRef.current });

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []); // Create once

    // Notify worker of locale changes
    useEffect(() => {
        if (workerRef.current && workerReady) {
            memoryCacheRef.current.clear();
            // Pre-seed from localStorage for instant display
            const lsData = lsCacheRef.current[locale];
            if (lsData) {
                for (const [text, translation] of Object.entries(lsData)) {
                    memoryCacheRef.current.set(text, translation);
                }
            }
            workerRef.current.postMessage({ type: 'set-locale', locale });
        }
    }, [locale, workerReady]);

    // ─── Queue Processing ────────────────────────────────────────────────────

    const processQueue = useCallback(async () => {
        const texts = Array.from(queueRef.current);
        if (!texts.length) return;
        queueRef.current.clear();

        setIsTranslating(true);

        if (useWorkerRef.current && workerRef.current) {
            workerRef.current.postMessage({ type: 'translate', texts, locale: localeRef.current });
        } else {
            // Fallback: main-thread batch translation
            try {
                const results = await fallbackBatchTranslate(texts, localeRef.current);
                const mc = memoryCacheRef.current;
                const currentLocale = localeRef.current;
                for (const [text, translation] of Object.entries(results)) {
                    mc.set(text, translation);
                    const entry = pendingPromises.current.get(text);
                    if (entry) { entry.resolve(translation); pendingPromises.current.delete(text); }
                }
                lsCacheRef.current[currentLocale] = {
                    ...lsCacheRef.current[currentLocale],
                    ...results,
                };
                lsSave(lsCacheRef.current);
                setTranslationVersion(v => v + 1);
            } catch (e) {
                console.warn('[i18n] Fallback translation error:', e);
            }
            setIsTranslating(false);
        }
    }, []);

    const queueTexts = useCallback((texts) => {
        const currentLocale = localeRef.current;
        if (currentLocale === 'en') return;
        for (const text of texts) {
            if (!text || typeof text !== 'string') continue;
            if (serverTranslations[text]) continue;
            if (memoryCacheRef.current.has(text)) continue;
            if (isInGlossary(text)) continue;
            if (lsCacheRef.current[currentLocale]?.[text]) continue;
            queueRef.current.add(text);
        }
        if (queueRef.current.size > 0) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(processQueue, 200);
        }
    }, [serverTranslations, processQueue]);

    // ─── Pending Promise Helper ──────────────────────────────────────────────

    const getOrCreatePending = useCallback((text) => {
        let entry = pendingPromises.current.get(text);
        if (entry) return entry.promise;

        let resolve;
        const promise = new Promise(r => { resolve = r; });
        const timeout = setTimeout(() => {
            if (pendingPromises.current.has(text)) {
                pendingPromises.current.delete(text);
                resolve(text);
            }
        }, 10000);

        pendingPromises.current.set(text, {
            resolve: (v) => { clearTimeout(timeout); resolve(v); },
            promise,
        });
        return promise;
    }, []);

    // ─── Translation API ─────────────────────────────────────────────────────

    /**
     * Synchronous translation lookup (instant from cache/glossary)
     */
    const t = useCallback((text) => {
        if (!text || typeof text !== 'string') return text || '';
        if (locale === 'en') return text;

        // 1. Server dictionary
        if (serverTranslations[text]) return serverTranslations[text];

        // 2. In-memory cache (from Worker/IndexedDB)
        const memHit = memoryCacheRef.current.get(text);
        if (memHit) return memHit;

        // 3. Business Glossary
        const glossary = getGlossaryTranslation(text, locale);
        if (glossary) return glossary;

        // 4. localStorage fallback cache
        const lsHit = lsCacheRef.current[locale]?.[text];
        if (lsHit) {
            memoryCacheRef.current.set(text, lsHit);
            return lsHit;
        }

        // 5. Queue for async translation
        queueTexts([text]);
        return text;
    }, [locale, serverTranslations, queueTexts, translationVersion]);

    /**
     * Async translation — returns Promise that resolves with translated text
     */
    const translateAsync = useCallback(async (text) => {
        if (!text || typeof text !== 'string') return text || '';
        if (locale === 'en') return text;

        // Check sync sources first
        if (serverTranslations[text]) return serverTranslations[text];
        const memHit = memoryCacheRef.current.get(text);
        if (memHit) return memHit;
        const glossary = getGlossaryTranslation(text, locale);
        if (glossary) return glossary;
        const lsHit = lsCacheRef.current[locale]?.[text];
        if (lsHit) { memoryCacheRef.current.set(text, lsHit); return lsHit; }

        // Get/create pending promise and queue
        const promise = getOrCreatePending(text);
        queueTexts([text]);
        return promise;
    }, [locale, serverTranslations, getOrCreatePending, queueTexts]);

    /**
     * Batch translate — returns Promise<{ [text]: translation }>
     * This is the PRIMARY method for GlobalAutoTranslator.
     * Dramatically faster than individual translateAsync calls.
     */
    const translateBatch = useCallback(async (texts) => {
        if (!texts?.length || locale === 'en') {
            return Object.fromEntries(texts?.map(t => [t, t]) || []);
        }

        const results = {};
        const uncached = [];

        for (const text of texts) {
            const hit = serverTranslations[text]
                || memoryCacheRef.current.get(text)
                || getGlossaryTranslation(text, locale)
                || lsCacheRef.current[locale]?.[text];
            if (hit) {
                results[text] = hit;
                if (!memoryCacheRef.current.has(text)) memoryCacheRef.current.set(text, hit);
            } else {
                uncached.push(text);
            }
        }

        if (!uncached.length) return results;

        // Create/reuse pending promises for uncached texts
        const promises = uncached.map(text =>
            getOrCreatePending(text).then(translation => [text, translation])
        );
        queueTexts(uncached);

        const settled = await Promise.all(promises);
        for (const [text, translation] of settled) {
            results[text] = translation;
        }

        return results;
    }, [locale, serverTranslations, getOrCreatePending, queueTexts]);

    /**
     * Change locale — instant client-side switch + server notification
     */
    const setLocale = useCallback((newLocale) => {
        if (newLocale === locale || !serverSupportedLocales.includes(newLocale)) return;

        localStorage.setItem('locale', newLocale);
        setLocaleState(newLocale);

        // Clear queues
        queueRef.current.clear();
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        pendingPromises.current.forEach(entry => entry.resolve(''));
        pendingPromises.current.clear();

        setTranslationVersion(v => v + 1);

        // Notify server (fire-and-forget)
        axios.post('/locale', { locale: newLocale }).catch(() => {});
    }, [locale, serverSupportedLocales]);

    /**
     * Clear all caches (memory + localStorage + IndexedDB via Worker)
     */
    const clearCache = useCallback(() => {
        memoryCacheRef.current.clear();
        lsCacheRef.current = {};
        localStorage.removeItem(LS_KEY);
        if (workerRef.current) workerRef.current.postMessage({ type: 'clear-cache' });
        setTranslationVersion(v => v + 1);
    }, []);

    /**
     * Preload texts into cache
     */
    const preload = useCallback(async (texts) => {
        if (!texts?.length || locale === 'en') return;
        queueTexts(texts);
    }, [locale, queueTexts]);

    const value = useMemo(() => ({
        locale,
        t,
        translateAsync,
        translateBatch,
        setLocale,
        supportedLocales: serverSupportedLocales,
        localeMeta: serverLocaleMeta,
        isRTL,
        isTranslating,
        clearCache,
        preload,
        translationVersion,
        stats,
    }), [locale, t, translateAsync, translateBatch, setLocale, serverSupportedLocales, serverLocaleMeta, isRTL, isTranslating, clearCache, preload, translationVersion, stats]);

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
            translateBatch: async (texts) => Object.fromEntries(texts?.map(t => [t, t]) || []),
            setLocale: () => {},
            supportedLocales: ['en'],
            localeMeta: {},
            isRTL: false,
            isTranslating: false,
            clearCache: () => {},
            preload: async () => {},
            translationVersion: 0,
            stats: {},
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
