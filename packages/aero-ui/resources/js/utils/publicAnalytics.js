const MARKETING_EVENT_ENDPOINT = '/api/platform/v1/marketing-events';
const SESSION_STORAGE_KEY = 'aeos_marketing_session_id';
const EXPERIMENT_STORAGE_PREFIX = 'aeos_marketing_exp_';
const EXPERIMENT_QUERY_PREFIX = 'exp_';
const DEFAULT_VARIANTS = ['control', 'variant_b'];

const hasWindow = () => typeof window !== 'undefined';

const normalizeVariants = (variants) => {
  if (!Array.isArray(variants)) {
    return DEFAULT_VARIANTS;
  }

  const normalized = variants
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);

  return normalized.length > 0 ? normalized : DEFAULT_VARIANTS;
};

const getMarketingSessionId = () => {
  if (!hasWindow()) {
    return null;
  }

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated);

  return generated;
};

export const resolveExperimentVariant = (experimentKey, variants = DEFAULT_VARIANTS) => {
  if (!hasWindow() || !experimentKey) {
    return null;
  }

  const safeVariants = normalizeVariants(variants);
  const storageKey = `${EXPERIMENT_STORAGE_PREFIX}${experimentKey}`;
  const queryKey = `${EXPERIMENT_QUERY_PREFIX}${experimentKey}`;
  const queryVariant = new URLSearchParams(window.location.search).get(queryKey);

  if (queryVariant && safeVariants.includes(queryVariant)) {
    window.sessionStorage.setItem(storageKey, queryVariant);

    return queryVariant;
  }

  const storedVariant = window.sessionStorage.getItem(storageKey);
  if (storedVariant && safeVariants.includes(storedVariant)) {
    return storedVariant;
  }

  const assignedVariant = safeVariants[Math.floor(Math.random() * safeVariants.length)] || safeVariants[0];
  window.sessionStorage.setItem(storageKey, assignedVariant);

  return assignedVariant;
};

export const trackPublicCta = ({
  eventName = 'public_cta_click',
  ctaName,
  page,
  location,
  destination,
  experimentKey,
  experimentVariants,
  metadata = {},
}) => {
  if (!hasWindow() || !ctaName) {
    return;
  }

  const sessionId = getMarketingSessionId();
  const variant = resolveExperimentVariant(experimentKey, experimentVariants);

  const payload = {
    event_name: eventName,
    cta_name: ctaName,
    page: page || window.location.pathname,
    location: location || null,
    destination: destination || null,
    experiment_key: experimentKey || null,
    experiment_variant: variant,
    session_id: sessionId,
    occurred_at: Date.now(),
    metadata,
  };

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventName,
      ...payload,
    });
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      cta_name: payload.cta_name,
      page_path: payload.page,
      location: payload.location,
      destination: payload.destination,
      experiment_key: payload.experiment_key,
      experiment_variant: payload.experiment_variant,
    });
  }

  const body = JSON.stringify(payload);

  if (typeof navigator.sendBeacon === 'function' && typeof Blob !== 'undefined') {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(MARKETING_EVENT_ENDPOINT, blob);

    return;
  }

  fetch(MARKETING_EVENT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Intentionally silent to avoid UX impact when analytics transport fails.
  });
};

export const trackPublicCtaFromDataset = (dataset = {}) => {
  if (!dataset.ctaName) {
    return;
  }

  const variants = dataset.experimentVariants
    ? dataset.experimentVariants.split(',').map((item) => item.trim()).filter(Boolean)
    : undefined;

  trackPublicCta({
    eventName: dataset.eventName || 'public_cta_click',
    ctaName: dataset.ctaName,
    page: dataset.ctaPage,
    location: dataset.ctaLocation,
    destination: dataset.ctaDestination,
    experimentKey: dataset.experimentKey,
    experimentVariants: variants,
  });
};