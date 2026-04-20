/**
 * Translation Web Worker — Aero Enterprise Suite
 *
 * Handles all translation API calls and IndexedDB caching OFF the main thread.
 * Uses batch Google Translate API (joining texts with \n separator) to reduce
 * ~100 individual API calls to 2-3 batched requests.
 *
 * Protocol (Main ↔ Worker):
 *   Main → Worker:
 *     { type: 'init', locale }
 *     { type: 'translate', texts: string[], locale: string }
 *     { type: 'set-locale', locale: string }
 *     { type: 'clear-cache' }
 *     { type: 'get-stats' }
 *
 *   Worker → Main:
 *     { type: 'translated', results: { [text]: translation }, locale }
 *     { type: 'cache-loaded', cache: { [text]: translation }, locale }
 *     { type: 'stats', stats: {...} }
 *     { type: 'ready' }
 *     { type: 'cache-cleared' }
 */

// ─── Constants ──────────────────────────────────────────────────────────────────
const DB_NAME = 'aero_i18n';
const DB_VERSION = 1;
const STORE = 'translations';
const MAX_PER_LOCALE = 20000;
const BATCH_DEBOUNCE = 200; // ms — collect texts before sending batch
const API_BATCH_MAX_CHARS = 2000; // Max encoded chars per batch request
const API_BATCH_MAX_TEXTS = 80; // Max texts per batch request
const API_CONCURRENCY = 3; // Max concurrent batch API requests
const API_COOLDOWN = 80; // ms between batch chunks

const LANG_MAP = {
    en: 'en', bn: 'bn', ar: 'ar', es: 'es', fr: 'fr', de: 'de',
    hi: 'hi', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', pt: 'pt', ru: 'ru',
    ja: 'ja', ko: 'ko', it: 'it', nl: 'nl', tr: 'tr', pl: 'pl',
    vi: 'vi', th: 'th', id: 'id',
};

let db = null;
let locale = 'en';
const queue = new Set();
let timer = null;
const inflight = new Set();
const stats = { hits: 0, misses: 0, apiCalls: 0, batchCalls: 0 };

// ─── IndexedDB ──────────────────────────────────────────────────────────────────

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const d = e.target.result;
            if (!d.objectStoreNames.contains(STORE)) {
                const s = d.createObjectStore(STORE, { keyPath: 'k' });
                s.createIndex('lc', 'lc', { unique: false });
                s.createIndex('lu', 'lu', { unique: false });
            }
        };
        req.onsuccess = (e) => { db = e.target.result; resolve(); };
        req.onerror = (e) => reject(e.target.error);
    });
}

function idbGetBulk(lc, texts) {
    if (!db || !texts.length) return Promise.resolve({});
    return new Promise((resolve) => {
        const out = {};
        const tx = db.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        let left = texts.length;

        for (const text of texts) {
            const req = store.get(`${lc}|${text}`);
            req.onsuccess = () => {
                if (req.result) {
                    out[text] = req.result.t;
                    stats.hits++;
                }
                if (--left === 0) resolve(out);
            };
            req.onerror = () => { if (--left === 0) resolve(out); };
        }
    });
}

function idbPutBulk(lc, entries) {
    if (!db || !Object.keys(entries).length) return Promise.resolve();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const now = Date.now();
        for (const [text, translation] of Object.entries(entries)) {
            store.put({
                k: `${lc}|${text}`,
                lc,
                text,
                t: translation,
                f: 1,
                lu: now,
            });
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
    });
}

function idbLoadLocale(lc) {
    if (!db) return Promise.resolve({});
    return new Promise((resolve) => {
        const out = {};
        const tx = db.transaction(STORE, 'readonly');
        const index = tx.objectStore(STORE).index('lc');
        const req = index.openCursor(IDBKeyRange.only(lc));
        req.onsuccess = (e) => {
            const c = e.target.result;
            if (c) { out[c.value.text] = c.value.t; c.continue(); }
            else resolve(out);
        };
        req.onerror = () => resolve(out);
    });
}

function idbClear() {
    if (!db) return Promise.resolve();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
    });
}

function idbEvict(lc) {
    if (!db) return Promise.resolve();
    return new Promise((resolve) => {
        const tx = db.transaction(STORE, 'readonly');
        const index = tx.objectStore(STORE).index('lc');
        const countReq = index.count(IDBKeyRange.only(lc));
        countReq.onsuccess = () => {
            const count = countReq.result;
            if (count <= MAX_PER_LOCALE) { resolve(); return; }

            const excess = count - MAX_PER_LOCALE + 500;
            const delTx = db.transaction(STORE, 'readwrite');
            const delStore = delTx.objectStore(STORE);
            const luIdx = delStore.index('lu');
            let deleted = 0;

            const cursorReq = luIdx.openCursor();
            cursorReq.onsuccess = (e) => {
                const c = e.target.result;
                if (c && deleted < excess) {
                    if (c.value.lc === lc) { c.delete(); deleted++; }
                    c.continue();
                } else { resolve(); }
            };
            cursorReq.onerror = () => resolve();
        };
        countReq.onerror = () => resolve();
    });
}

// ─── Google Translate Batch API ─────────────────────────────────────────────────

function splitIntoBatches(texts) {
    const batches = [];
    let batch = [];
    let chars = 0;

    for (const text of texts) {
        const len = encodeURIComponent(text).length;
        if ((chars + len > API_BATCH_MAX_CHARS || batch.length >= API_BATCH_MAX_TEXTS) && batch.length > 0) {
            batches.push(batch);
            batch = [text];
            chars = len;
        } else {
            batch.push(text);
            chars += len + 3; // %0A separator
        }
    }
    if (batch.length) batches.push(batch);
    return batches;
}

async function translateSubBatch(texts, target) {
    stats.batchCalls++;

    if (texts.length === 1) {
        try {
            const r = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(texts[0])}`
            );
            if (!r.ok) return {};
            const d = await r.json();
            let out = '';
            if (d?.[0]) for (const p of d[0]) { if (p?.[0]) out += p[0]; }
            return out ? { [texts[0]]: out } : {};
        } catch { return {}; }
    }

    // Multi-text: join with \n separator
    const combined = texts.join('\n');
    try {
        const r = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(combined)}`
        );
        if (!r.ok) return translateIndividually(texts, target);

        const d = await r.json();
        let full = '';
        if (d?.[0]) for (const p of d[0]) { if (p?.[0]) full += p[0]; }

        const parts = full.split('\n');
        if (parts.length === texts.length) {
            const out = {};
            texts.forEach((t, i) => { out[t] = parts[i].trim() || t; });
            return out;
        }
        // Line count mismatch — fall back to individual
        return translateIndividually(texts, target);
    } catch {
        return translateIndividually(texts, target);
    }
}

async function translateIndividually(texts, target) {
    const out = {};
    for (const text of texts) {
        stats.apiCalls++;
        try {
            const r = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}&dt=t&q=${encodeURIComponent(text)}`
            );
            if (r.ok) {
                const d = await r.json();
                let translated = '';
                if (d?.[0]) for (const p of d[0]) { if (p?.[0]) translated += p[0]; }
                if (translated) out[text] = translated;
            }
        } catch { /* silent */ }
    }
    return out;
}

async function translateAll(texts, lang) {
    const target = LANG_MAP[lang] || lang;
    const batches = splitIntoBatches(texts);
    const results = {};

    for (let i = 0; i < batches.length; i += API_CONCURRENCY) {
        const chunk = batches.slice(i, i + API_CONCURRENCY);
        const batchResults = await Promise.all(chunk.map(b => translateSubBatch(b, target)));
        for (const r of batchResults) Object.assign(results, r);

        if (i + API_CONCURRENCY < batches.length) {
            await new Promise(r => setTimeout(r, API_COOLDOWN));
        }
    }
    return results;
}

// ─── Queue Processing ───────────────────────────────────────────────────────────

async function processQueue() {
    if (queue.size === 0) return;

    const texts = Array.from(queue);
    queue.clear();

    const toProcess = texts.filter(t => !inflight.has(t));
    if (!toProcess.length) return;

    toProcess.forEach(t => inflight.add(t));

    try {
        // 1. Check IndexedDB cache first
        const cached = await idbGetBulk(locale, toProcess);
        const uncached = toProcess.filter(t => !cached[t]);

        // Send cached results immediately
        if (Object.keys(cached).length) {
            self.postMessage({ type: 'translated', results: cached, locale });
        }

        // 2. Translate uncached via batch API
        if (uncached.length) {
            stats.misses += uncached.length;
            const translated = await translateAll(uncached, locale);

            // Store in IndexedDB
            await idbPutBulk(locale, translated);

            // Send results to main thread
            if (Object.keys(translated).length) {
                self.postMessage({ type: 'translated', results: translated, locale });
            }

            // Evict old entries if over limit
            await idbEvict(locale);
        }
    } finally {
        toProcess.forEach(t => inflight.delete(t));
    }
}

// ─── Message Handler ────────────────────────────────────────────────────────────

self.onmessage = async (e) => {
    switch (e.data.type) {
        case 'init': {
            try {
                await openDB();
            } catch (err) {
                console.warn('[i18n Worker] IndexedDB failed:', err);
            }
            locale = e.data.locale || 'en';
            if (locale !== 'en') {
                const cache = await idbLoadLocale(locale);
                self.postMessage({ type: 'cache-loaded', cache, locale });
            }
            self.postMessage({ type: 'ready' });
            break;
        }

        case 'translate': {
            if (e.data.locale) locale = e.data.locale;
            for (const t of (e.data.texts || [])) queue.add(t);
            if (timer) clearTimeout(timer);
            timer = setTimeout(processQueue, BATCH_DEBOUNCE);
            break;
        }

        case 'set-locale': {
            locale = e.data.locale;
            queue.clear();
            inflight.clear();
            if (timer) { clearTimeout(timer); timer = null; }
            if (locale !== 'en') {
                const cache = await idbLoadLocale(locale);
                self.postMessage({ type: 'cache-loaded', cache, locale });
            }
            break;
        }

        case 'clear-cache': {
            await idbClear();
            self.postMessage({ type: 'cache-cleared' });
            break;
        }

        case 'get-stats': {
            self.postMessage({ type: 'stats', stats: { ...stats } });
            break;
        }
    }
};
