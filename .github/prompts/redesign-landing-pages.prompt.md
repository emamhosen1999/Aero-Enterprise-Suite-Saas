---
description: "Redesign all public-facing landing pages to eliminate AI-generated feel, inject authentic business storytelling, and create a stunning, conversion-optimized web presence. Covers Landing, Pricing, Features, About, Contact, Blog, Demo, Standalone, Resources, Support, Status, Legal, Careers, and the marketing constants data layer."
agent: "AEOS Marketing Content Creator"
tools: [read, edit, search, execute, web, browser/openBrowserPage, browser/readPage, browser/screenshotPage, browser/navigatePage, browser/clickElement, browser/hoverElement, search/searchSubagent, agent/runSubagent, todo]
argument-hint: "Optional: name a specific page to start with (e.g., 'Landing', 'Pricing'), or leave blank to process all pages sequentially."
---

# Mission: Eliminate the AI-Generated Feel — Make Every Landing Page Authentic, Stunning & Informative

You are redesigning **every** public-facing page in `packages/aero-ui/resources/js/Pages/Platform/Public/` and the shared data layer in `packages/aero-ui/resources/js/constants/marketing.js`.

The current pages read like generic AI-generated SaaS templates. Your job is to transform them into pages that feel **hand-crafted by a human marketing team** — with real business context, specific product details, authentic storytelling, and design that evolves beyond cookie-cutter patterns.

---

## Step 0 — Research Phase (MANDATORY before any code changes)

1. **Study 5+ top-tier SaaS/ERP company websites** for inspiration. Prioritize:
   - **Odoo** (odoo.com) — modular ERP, open source + SaaS hybrid, similar business model
   - **Zoho One** (zoho.com/one) — suite-based approach, pricing psychology
   - **monday.com** — stunning visual design, animation craft, storytelling
   - **Notion** (notion.so) — clean typography, authentic tone, human feel
   - **Linear** (linear.app) — dark mode excellence, micro-interactions, developer trust signals
   - **Rippling** (rippling.com) — ERP/HR messaging, enterprise trust, clean UI
   - **Stripe** (stripe.com) — the gold standard of SaaS landing page design

2. For each competitor, capture:
   - Hero section structure (headline formula, subhead length, CTA hierarchy)
   - How they prove credibility without sounding generic (specificity over superlatives)
   - Visual rhythm — spacing between sections, how content breathes
   - What makes their pages feel **human** instead of AI-generated
   - Unique interactive elements (calculators, demos, configurators)

3. Save research findings as structured notes before proceeding.

---

## Step 1 — Audit the Current Constants & Content

Read these files completely:
- [marketing.js](packages/aero-ui/resources/js/constants/marketing.js) — all shared marketing data
- [PublicLayout.jsx](packages/aero-ui/resources/js/Layouts/PublicLayout.jsx) — the layout wrapper

Identify every instance of:
- **Generic superlatives**: "world-class", "cutting-edge", "revolutionary", "seamless", "robust" → replace with specific outcomes
- **Vague promises**: "boost productivity", "streamline operations" → replace with concrete scenarios
- **Template copy**: anything that could appear on ANY SaaS site → replace with Aero-specific details
- **Missing information**: modules, features, or differentiators not mentioned → add them
- **Repetitive patterns**: sections that all look/feel the same → introduce visual variety

---

## Step 2 — Rewrite the Marketing Constants

Rewrite `packages/aero-ui/resources/js/constants/marketing.js` with:

### Hero Stats — Make Them Credible & Specific
Instead of round numbers, use precise ones that feel real:
- Bad: "10 Modules" → Good: "10 integrated suites, 140+ submodules, 1 unified database"
- Bad: "99.9% Uptime" → Good: "99.96% rolling 24-month uptime — verified, not aspirational"
- Add stats that tell a story: deployment time, support response SLA, data centers

### Module Descriptions — Write Like a Product Expert, Not a Brochure
For each module (HRM, CRM, Finance, Project, IMS, SCM, POS, Quality, DMS, Compliance):
- Lead with the **business problem** it solves, not features
- Include 1 specific workflow example ("When a new hire starts, Aero automatically provisions their leave balance, assigns department policies, and triggers the onboarding checklist — no HR tickets needed.")
- End with a quantifiable outcome where possible

### Testimonials — Make Them Believable
- Use specific role titles and company types (not "CEO at Company")
- Quote specific features they use, not generic praise
- Include context: company size, industry, deployment type (SaaS or standalone)
- If real testimonials don't exist yet, write them as realistic placeholders clearly marked with a `// TODO: Replace with real testimonial` comment

### Problem Statements — Empathy Over Fear
- Frame problems as relatable frustrations, not catastrophic warnings
- Use "you" language: "You've probably spent hours reconciling spreadsheets..."
- Pair each problem with the specific Aero solution

---

## Step 3 — Redesign Each Page

Process pages in this order (each one builds on the previous):

### 3.1 Landing.jsx — The Hero Experience
**Goal**: First 5 seconds must communicate "This is a real product built by people who understand my business."

- **Hero section**: Replace generic headline with a problem-led hook. Example: "Your business runs on 8 different tools. It should run on 1." followed by a specific subheadline about Aero's modular approach.
- **Social proof bar**: Immediately below hero — trust badges, client count, deployment stats. Not logos of companies that don't exist.
- **Problem → Solution narrative**: 3-4 cards showing real business pain points and how Aero solves each one.
- **Module showcase**: Interactive grid/carousel — NOT a static list. Let users explore modules that matter to them.
- **How it works**: 3-step visual (Choose modules → Deploy your way → Grow without limits).
- **Testimonial section**: Carousel with real-feeling quotes, not generic praise.
- **Deployment options**: Side-by-side SaaS vs Standalone comparison with clear "who this is for" messaging.
- **Final CTA**: Urgency without pressure — "Start your 14-day free trial" + "Book a guided demo".
- **Visual variety**: Each section should have a distinct visual treatment — alternate backgrounds, mix card layouts with full-bleed sections, use asymmetric grids.

### 3.2 Pricing.jsx — Transparent & Trustworthy
- Monthly/Annual toggle with savings percentage shown
- 3-4 plan tiers with a highlighted "Most Popular" tier
- Feature comparison matrix that's scannable (not a wall of checkmarks)
- SaaS and Standalone pricing clearly separated (tabs or toggle)
- FAQ section addressing common objections
- Enterprise CTA: "Need custom deployment? Talk to our solutions team."

### 3.3 Features.jsx — Deep Product Knowledge
- Organized by business function, not alphabetically
- Each module gets a dedicated section with: icon, 3-4 key capabilities, a screenshot or illustration placeholder, and a "See [Module] in action" link
- Cross-module integration stories: "When inventory drops below reorder level, Aero automatically creates a purchase order in SCM, allocates budget in Finance, and notifies the warehouse team."

### 3.4 About.jsx — Human & Authentic
- Company origin story — why Aero was built, what problem the founders saw
- Mission statement that's specific, not generic
- Team values presented as actual practices, not buzzwords
- Technology philosophy: open architecture, modular design, data sovereignty
- "Built with" section showing the technology stack as a trust signal for technical buyers

### 3.5 Contact.jsx — Frictionless
- Multiple contact paths: demo request form, email, live chat indicator
- Office/region information if applicable
- Expected response time commitments
- FAQ integration to deflect common queries

### 3.6 Blog.jsx — Content Hub
- Clean card layout with featured post, categories, and search
- SEO-ready article template structure
- Author attribution pattern

### 3.7 Demo.jsx — Conversion-Focused
- Step-by-step demo request flow
- Option to watch a self-guided video tour
- "See it live" scheduling integration pattern

### 3.8 Standalone.jsx — Self-Hosted Value Prop
- Dedicated messaging for buyers who need on-premise/self-hosted
- Data sovereignty, compliance, and customization angles
- Comparison with SaaS option (not competitive, complementary)
- License tiers and what's included

### 3.9 Legal Pages (Terms, Privacy, Cookies, Security)
- Professional, readable, well-structured
- Actual GDPR/data protection language appropriate for a SaaS ERP
- Security page should detail: encryption, access controls, audit logging, compliance certifications

### 3.10 Support.jsx, Status.jsx, Resources.jsx, Careers.jsx
- Support: Tiered support model, SLA commitments, knowledge base link
- Status: System health dashboard design
- Resources: Guides, whitepapers, case studies, video tutorials layout
- Careers: Company culture, open positions, benefits, application flow

---

## Design Anti-Patterns to ELIMINATE

These patterns scream "AI-generated". Remove every instance:

| AI Pattern | Human Replacement |
|-----------|-------------------|
| Symmetrical 3-column grids for everything | Mix 2-col, 3-col, full-width, asymmetric layouts |
| Every section has the same padding/structure | Vary vertical rhythm — some sections tight, some spacious |
| Generic gradient backgrounds | Purposeful color use tied to brand meaning |
| "Unlock the power of..." | Specific action: "See your team's leave balance in real time" |
| Hero with stock photo description | Hero with product UI mockup or interactive element |
| Features listed as icon + title + paragraph (repeated 6x) | Mix: some as cards, some as timeline, some as comparison table |
| "Trusted by 1000+ companies" (unverifiable) | Specific: "Deployed across 12 industries in 4 countries" |
| Every CTA says "Get Started" | Vary: "Start Free Trial", "Book a Demo", "See Pricing", "Explore Modules" |
| Identical section transitions | Alternate between cards, full-bleed, split-screen, floating panels |

---

## Animation & Interaction Guidelines

Use `framer-motion` purposefully, not decoratively:
- **Scroll-triggered reveals**: Sections fade/slide in as user scrolls — but with varying directions and timings
- **Stagger effects**: Grid items appear sequentially, not all at once
- **Hover micro-interactions**: Cards lift subtly, buttons pulse, icons animate
- **Parallax (subtle)**: Background elements move at different scroll speeds
- **NO**: Spinning logos, bouncing elements, gratuitous rotation, aggressive zoom effects

---

## Quality Checklist (Verify Before Each Page Is Complete)

- [ ] Would a human marketer be proud of this copy? (No generic filler)
- [ ] Does the page tell a story, not just list features?
- [ ] Is every stat specific and credible?
- [ ] Does the visual design have variety (not repeating the same card grid)?
- [ ] Dark mode looks intentional, not like an afterthought?
- [ ] Mobile layout is usable and beautiful, not just "shrunk desktop"?
- [ ] Every CTA is clear about what happens next?
- [ ] SEO: one H1, logical heading hierarchy, meta title + description defined?
- [ ] No lorem ipsum, no placeholder text, no "Company Name" generics?
- [ ] Framer-motion animations are smooth and purposeful?
- [ ] Page loads fast — no unnecessary imports or heavy components?
- [ ] Screenshot captured and visually verified in browser?

---

## Execution Order

Use the todo list to track progress. Process one page at a time:

1. Research competitors (Step 0)
2. Rewrite `marketing.js` constants (Step 1-2)
3. Landing.jsx (the flagship — get this right first)
4. Pricing.jsx
5. Features.jsx
6. About.jsx
7. Contact.jsx
8. Demo.jsx
9. Standalone.jsx
10. Blog.jsx
11. Legal pages (Terms, Privacy, Cookies, Security, Index)
12. Support.jsx, Status.jsx, Resources.jsx, Careers.jsx
13. Final cross-page consistency review

After each page, build the frontend (`npm run build` from `aeos365/`), navigate to the page in the browser, and screenshot the result for verification.
