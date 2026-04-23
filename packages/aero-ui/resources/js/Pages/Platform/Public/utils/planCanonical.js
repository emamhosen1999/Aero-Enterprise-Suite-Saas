const FALLBACK_QUOTA_UNITS = {
    max_storage_gb: 'gb',
    max_api_calls_per_month: 'requests',
    max_api_calls: 'requests',
    trial_days: 'days',
};

function titleCaseFromKey(key = '') {
    return String(key)
        .replace(/^max_/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
}

export function normalizePlanQuotas(plan = {}) {
    if (Array.isArray(plan.quotas) && plan.quotas.length > 0) {
        return plan.quotas
            .filter((quota) => quota && quota.key)
            .map((quota) => ({
                key: String(quota.key),
                label: quota?.metadata?.label || titleCaseFromKey(quota.key),
                value: quota.value,
                unit: quota.unit || FALLBACK_QUOTA_UNITS[quota.key] || 'count',
            }));
    }

    if (plan.limits && typeof plan.limits === 'object') {
        return Object.entries(plan.limits).map(([key, value]) => ({
            key,
            label: titleCaseFromKey(key),
            value,
            unit: FALLBACK_QUOTA_UNITS[key] || 'count',
        }));
    }

    return [];
}

export function formatQuotaValue(quota = {}) {
    const { value, unit } = quota;

    if (value === null || value === undefined || value === '') {
        return 'N/A';
    }

    if (typeof value === 'string' && value.toLowerCase() === 'unlimited') {
        return 'Unlimited';
    }

    if (typeof value === 'number' && !Number.isFinite(value)) {
        return 'Unlimited';
    }

    if (unit === 'gb') {
        return `${value} GB`;
    }

    if (unit === 'days') {
        return `${value} days`;
    }

    if (unit === 'requests') {
        return `${value} req/mo`;
    }

    return String(value);
}

export function normalizePlanFeatures(plan = {}) {
    if (Array.isArray(plan.features)) {
        return plan.features;
    }

    if (plan.features && typeof plan.features === 'object') {
        return Object.entries(plan.features)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([key]) => titleCaseFromKey(key));
    }

    return [];
}

export function normalizePlanModules(plan = {}) {
    if (!Array.isArray(plan.modules)) {
        return [];
    }

    return plan.modules
        .map((module) => {
            if (!module) {
                return null;
            }

            if (typeof module === 'string') {
                return module;
            }

            return module.name || module.code || module.id || null;
        })
        .filter(Boolean);
}
