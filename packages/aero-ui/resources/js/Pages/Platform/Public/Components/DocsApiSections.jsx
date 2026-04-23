import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';

const CODE_BLOCK_STYLE = {
    background: '#0D1117',
    color: '#E6EDF3',
    borderRadius: '10px',
    padding: '0.875rem 1.25rem',
    overflowX: 'auto',
    fontSize: '0.8125rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineHeight: '1.65',
    border: '1px solid rgba(255,255,255,0.08)',
    marginTop: '0.75rem',
    whiteSpace: 'pre',
};

const METHOD_COLORS = {
    GET: '#3FB950',
    POST: '#79C0FF',
    PATCH: '#D29922',
    DELETE: '#FF7B72',
    PUT: '#F0883E',
};

const sections = [
    {
        id: 'overview',
        title: 'Overview & Base URL',
        blocks: [
            {
                type: 'paragraph',
                text: "The aeos365 REST API allows you to programmatically access and modify your tenant's data. All API requests must be made over HTTPS to:",
            },
            {
                type: 'code',
                content: 'Base URL: https://api.aeos365.com/v2',
            },
            {
                type: 'paragraph',
                text: 'All responses are in application/json format. Include Accept: application/json in all requests.',
            },
        ],
    },
    {
        id: 'authentication',
        title: 'Authentication',
        blocks: [
            {
                type: 'paragraph',
                text: 'The API uses OAuth 2.0 Bearer tokens. Generate tokens via the aeos365 admin dashboard under Settings → API Keys.',
            },
            {
                type: 'paragraph',
                text: 'Request header:',
            },
            {
                type: 'code',
                content: 'Authorization: Bearer YOUR_API_TOKEN\nContent-Type: application/json',
            },
            {
                type: 'paragraph',
                text: 'Tokens can be scoped to specific modules (e.g., hrm:read, finance:write) and expire after 90 days by default. Service account tokens do not expire.',
            },
        ],
    },
    {
        id: 'rate-limiting',
        title: 'Rate Limiting',
        blocks: [
            {
                type: 'paragraph',
                text: 'API requests are rate-limited per token:',
            },
            {
                type: 'table',
                headers: ['Plan', 'Requests / minute', 'Burst'],
                rows: [
                    ['Starter', '60', '100'],
                    ['Professional', '300', '500'],
                    ['Enterprise', '1,200', '2,000'],
                ],
            },
            {
                type: 'paragraph',
                text: 'Rate limit headers are included in every response:',
            },
            {
                type: 'list',
                items: [
                    'X-RateLimit-Limit — your plan\'s limit',
                    'X-RateLimit-Remaining — requests remaining this minute',
                    'X-RateLimit-Reset — Unix timestamp when the window resets',
                ],
            },
        ],
    },
    {
        id: 'endpoints',
        title: 'Core Endpoints',
        blocks: [
            {
                type: 'paragraph',
                text: 'Endpoints follow RESTful conventions:',
            },
            {
                type: 'table',
                headers: ['Method', 'Path', 'Description'],
                codeColumns: [0, 1],
                rows: [
                    ['GET', '/v2/employees', 'List all employees'],
                    ['POST', '/v2/employees', 'Create an employee'],
                    ['GET', '/v2/employees/{id}', 'Get a single employee'],
                    ['PATCH', '/v2/employees/{id}', 'Update an employee'],
                    ['DELETE', '/v2/employees/{id}', 'Delete an employee'],
                    ['GET', '/v2/departments', 'List all departments'],
                    ['GET', '/v2/leaves', 'List leave requests'],
                    ['POST', '/v2/leaves', 'Submit a leave request'],
                    ['GET', '/v2/payroll/runs', 'List payroll runs'],
                    ['POST', '/v2/payroll/runs', 'Trigger a payroll run'],
                ],
            },
            {
                type: 'paragraph',
                text: 'All list endpoints return paginated results (see Pagination section).',
            },
        ],
    },
    {
        id: 'pagination',
        title: 'Pagination & Filtering',
        blocks: [
            {
                type: 'paragraph',
                text: 'All list endpoints support cursor-based pagination:',
            },
            {
                type: 'code',
                content: 'GET /v2/employees?page=1&per_page=25&sort=created_at&order=desc',
            },
            {
                type: 'paragraph',
                text: 'Query parameters:',
            },
            {
                type: 'list',
                items: [
                    'page — page number (default: 1)',
                    'per_page — records per page (default: 25, max: 100)',
                    'sort — field to sort by',
                    'order — asc or desc',
                    'search — full-text search across names and codes',
                    'filter[department] — filter by department ID',
                    'filter[status] — filter by status value',
                ],
            },
            {
                type: 'paragraph',
                text: 'Response envelope:',
            },
            {
                type: 'code',
                content: '{\n  "data": [...],\n  "meta": {\n    "current_page": 1,\n    "per_page": 25,\n    "total": 840,\n    "last_page": 34\n  }\n}',
            },
        ],
    },
    {
        id: 'errors',
        title: 'Error Codes',
        blocks: [
            {
                type: 'paragraph',
                text: 'The API uses standard HTTP status codes:',
            },
            {
                type: 'table',
                headers: ['Code', 'Meaning'],
                rows: [
                    ['200', 'Success'],
                    ['201', 'Created'],
                    ['400', 'Bad request — check request body'],
                    ['401', 'Unauthorized — invalid or missing token'],
                    ['403', 'Forbidden — token lacks required scope'],
                    ['404', 'Not found'],
                    ['422', 'Validation error — see errors field'],
                    ['429', 'Rate limit exceeded'],
                    ['500', 'Internal server error'],
                ],
            },
            {
                type: 'paragraph',
                text: 'Error response format:',
            },
            {
                type: 'code',
                content: '{\n  "message": "The given data was invalid.",\n  "errors": {\n    "email": ["The email field is required."]\n  }\n}',
            },
        ],
    },
    {
        id: 'versioning',
        title: 'API Versioning',
        blocks: [
            {
                type: 'paragraph',
                text: 'The current stable API version is v2. Version is specified in the URL path: /v2/...',
            },
            {
                type: 'paragraph',
                text: 'aeos365 provides a minimum 12-month deprecation notice before removing any API version. The Sunset header is included in responses from deprecated endpoints:',
            },
            {
                type: 'code',
                content: 'Sunset: Sat, 01 Nov 2026 00:00:00 GMT',
            },
            {
                type: 'paragraph',
                text: 'Check the Changelog for details on breaking changes and migration guides.',
            },
        ],
    },
    {
        id: 'sdks',
        title: 'SDKs & Tools',
        blocks: [
            {
                type: 'paragraph',
                text: 'Official SDKs are available for the most common languages:',
            },
            {
                type: 'list',
                items: [
                    'PHP — composer require aeos365/sdk',
                    'JavaScript/Node — npm install @aeos365/sdk',
                    'Python — pip install aeos365',
                    'Laravel — first-party integration with Artisan commands',
                ],
            },
            {
                type: 'paragraph',
                text: 'A Postman collection is available for download from the developer dashboard. OpenAPI 3.1 spec available at /v2/openapi.json.',
            },
        ],
    },
];

function renderBlock(block, blockIndex, isDark) {
    const key = `block-${blockIndex}`;

    if (block.type === 'paragraph') {
        return (
            <p
                key={key}
                className="mt-4 text-sm leading-relaxed md:text-base"
                style={{ color: isDark ? 'rgba(232,237,245,0.68)' : '#475569' }}
            >
                {block.text}
            </p>
        );
    }

    if (block.type === 'code') {
        return (
            <pre key={key} style={CODE_BLOCK_STYLE}>
                <code>{block.content}</code>
            </pre>
        );
    }

    if (block.type === 'list') {
        return (
            <ul key={key} className="mt-4 space-y-2">
                {block.items.map((item, i) => (
                    <li
                        key={`li-${i}`}
                        className="flex items-start gap-2 text-sm leading-relaxed md:text-base"
                        style={{ color: isDark ? 'rgba(232,237,245,0.68)' : '#475569' }}
                    >
                        <span className="mt-1 shrink-0 text-xs" style={{ color: 'var(--cyan-aeos)' }}>
                            ▸
                        </span>
                        {item}
                    </li>
                ))}
            </ul>
        );
    }

    if (block.type === 'table') {
        const codeColumns = block.codeColumns || [];

        return (
            <div
                key={key}
                className="mt-4 rounded-xl"
                style={{
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}`,
                    overflow: 'auto',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '360px' }}>
                    <thead>
                        <tr
                            style={{
                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
                            }}
                        >
                            {block.headers.map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: '10px 16px',
                                        textAlign: 'left',
                                        color: isDark ? '#E8EDF5' : '#0F172A',
                                        fontWeight: '600',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {block.rows.map((row, rIndex) => (
                            <tr
                                key={rIndex}
                                style={{
                                    background:
                                        rIndex % 2 === 0
                                            ? 'transparent'
                                            : isDark
                                            ? 'rgba(255,255,255,0.02)'
                                            : 'rgba(15,23,42,0.02)',
                                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)'}`,
                                }}
                            >
                                {row.map((cell, cIndex) => {
                                    const isCodeCol = codeColumns.includes(cIndex);
                                    const methodColor = cIndex === 0 ? METHOD_COLORS[cell] : null;

                                    return (
                                        <td
                                            key={cIndex}
                                            style={{
                                                padding: '10px 16px',
                                                color: methodColor
                                                    ? methodColor
                                                    : isDark
                                                    ? 'rgba(232,237,245,0.68)'
                                                    : '#475569',
                                                fontFamily: isCodeCol
                                                    ? "'JetBrains Mono', 'Fira Code', monospace"
                                                    : undefined,
                                                fontSize: isCodeCol ? '0.8125rem' : undefined,
                                                fontWeight: methodColor ? '600' : undefined,
                                                whiteSpace: isCodeCol ? 'nowrap' : undefined,
                                            }}
                                        >
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return null;
}

export default function DocsApiSections() {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const { isDark } = usePublicTheme();

    return (
        <div ref={ref}>
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="space-y-5"
            >
                {sections.map((section, index) => (
                    <motion.article
                        key={section.id}
                        id={section.id}
                        variants={fadeUp}
                        custom={index}
                        className="rounded-2xl border p-6 md:p-8"
                        style={{
                            background: isDark ? 'var(--pub-card-bg)' : 'rgba(255,255,255,0.9)',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
                            scrollMarginTop: '110px',
                        }}
                    >
                        <h2
                            className="text-2xl font-bold md:text-3xl"
                            style={{ color: isDark ? '#E8EDF5' : '#0F172A', fontFamily: "'Syne', sans-serif" }}
                        >
                            {section.title}
                        </h2>

                        {section.blocks.map((block, bIndex) => renderBlock(block, bIndex, isDark))}
                    </motion.article>
                ))}
            </motion.div>
        </div>
    );
}
