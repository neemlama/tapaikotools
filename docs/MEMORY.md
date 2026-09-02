# TapaikoTools — Project Memory (load on every session)

> When user says "let's work on tapaikotools" — read this file + `docs/PLAN.md` before any code change. Workspace: `C:\Users\wecal\Documents\tapaikotools`

## Identity
- **Name:** TapaikoTools (rebrand 2026-08-10 from DailyTools) — `src/lib/site-config.ts:9` `siteConfig.name = "TapaikoTools"`, tagline "Free Tools for Everyday Tasks"
- **Package:** `daily-tools` v0.1.0 (`package.json:2`)
- **Domain:** `dailytools.neemlama.com.np` → moving to `tapaikotools.neemlama.com.np` (Cloudflare DNS grey-cloud, Vercel). `SRC: src/lib/site-url.ts:9` reads `NEXT_PUBLIC_SITE_URL`.
- **Stack:** Next.js 16.3.0 App Router + React 19 + TypeScript + Tailwind v4 (`@theme` in `src/app/globals.css`), `next-themes`, `lucide-react` + Material Symbols Outlined (`src/app/layout.tsx:74`), `shadcn/ui` CSS var naming.

## Registry (source of truth)
- `src/lib/tools/types.ts:7` — 9 categories: `student-tools`, `calculators`, `date-time`, `text-tools`, `developer-tools`, `converters`, `generators`, `finance`, `image-tools`
- `src/lib/tools/registry.ts:81` — **22 tools, all `status: "available"`**, each with `slug, title, description, category, icon, popular?, layout?: "standard"|"custom"`. `layout: custom` = owns entire page, bypasses `ToolPageShell`. New: `image-compressor` (Image Tools, popular, custom).
- `src/lib/tools/implementations.tsx:31` — `toolImplementations: Record<slug, ComponentType>`; missing slug → `ComingSoonTool`.
- `src/app/tools/[slug]/page.tsx:10` — `generateStaticParams` + `generateMetadata` (per-tool canonical + OG/Twitter). Must not inherit root OG.
- `src/components/tools/tool-page-shell.tsx:30` — shared shell: `ToolBreadcrumb` + header + `children` + `about` + `Faq` + `RelatedTools`. Skipped when `layout==="custom"`.
- `src/lib/tools/registry.ts:444` `searchTools(query)` — ranked search (exact title > prefix > substring > description), used by `src/components/home/home-content.tsx:64` and `/tools` page.
- `src/components/home/home-content.tsx:20` — Hero + 6 hard-coded Popular cards (not registry-derived, wording mismatch e.g. "Percentage Calculator") + 8 category tiles (`src/lib/tools/category-icons.ts`) + live search.

## The 20 Tools (all available)
- Student: `cgpa-calculator` (custom), `gpa-calculator` (custom), `attendance-calculator` (custom), `marks-percentage-calculator` (custom, popular)
- Calculators: `age-calculator` (custom, popular) — `src/lib/date.ts` clamped anniversary fix
- Date & Time: `unix-timestamp-converter` (custom)
- Text: `word-counter` (popular), `lorem-ipsum-generator` (custom)
- Dev: `json-formatter` (popular), `base64-encoder-decoder` (custom), `url-shortener` (custom, needs backend)
- Converters: `unit-converter` (custom, category actually `calculators` after Stitch rebuild), `pdf-docx-converter` (custom, popular, hybrid)
- Generators: `password-generator` (custom), `random-number-generator` (custom), `uuid-generator` (custom), `qr-code-generator` (popular)
- Finance: `loan-calculator` (custom), `emi-calculator` (custom), `interest-calculator` (custom), `investment-calculator` (custom)

## Only 2 Tools Need Server
1. **URL Shortener** — `src/lib/redis.ts` singleton Upstash Redis REST (`UPSTASH_REDIS_REST_URL/TOKEN` in `.env.local`). `src/lib/url-shortener.ts:16` 7-char base62 `CODE_ALPHABET`, `MAX_GENERATION_ATTEMPTS=5`, `REDIS_KEY_PREFIX="url-shortener:"`, `SET NX` atomic. `src/lib/rate-limit.ts` hand-rolled fixed-window (no `@upstash/ratelimit` — needs Lua `EVALSHA` blocked by Upstash ACL): 10/min/IP create, 100/min/IP redirect (`/s/[code]`), 2000/day global. `src/lib/client-ip.ts` shared. Routes: `POST src/app/api/shorten/route.ts:14` (validates http(s), rejects self `/s/*` loop) + `GET src/app/s/[code]/route.ts` (301, unknown → `/tools/url-shortener?notfound=1` with `RedirectNotice`). History = per-browser localStorage via `useSyncExternalStore`. QR via `qrcode`.
2. **PDF ↔ DOCX** — `backend/app/main.py:1` FastAPI, `backend/app/services/converter.py:8` → `pdf/extractor` → `docx/generator` (PyMuPDF + python-docx + pdfplumber + Pillow). Proxy `src/app/api/convert/route.ts:12` hides `CONVERTER_API_URL`/`NEXT_PUBLIC_CONVERTER_API_URL` (fallback `http://localhost:8000`). Frontend `src/components/tools/implementations/pdf-docx-converter.tsx:25` — PDF→DOCX via backend (editable elements), DOCX→PDF client-side mammoth+jsPDF. `backend/README.md:38` + `backend/requirements.txt:5`.

## Other Key Files
- Shared libs: `src/lib/tools/finance.ts` (loan/EMI/interest/investment math), `src/lib/random.ts` (`secureRandomInt` via `crypto.getRandomValues` + Fisher-Yates), `src/lib/date.ts`, `src/lib/analytics.ts` (`GA_MEASUREMENT_ID`), `src/lib/utils.ts` (`cn`).
- UI: `src/components/ui/*` (button cva, input, textarea, etc.), `src/components/tools/*` (panel, result-card, line-area-chart, stacked-bar-chart, related-tools, faq, tool-breadcrumb, etc.), `src/components/layout/header.tsx`/`footer.tsx`, `src/components/home/home-content.tsx`.
- SEO: `src/app/layout.tsx:31` metadataBase+OG+Twitter, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/icon.tsx` (T monogram `ImageResponse`), `src/app/opengraph-image.tsx` (1200×630), per-page `alternates.canonical`. GA via `@next/third-parties/google` in layout, gated on env.
- Deployment: Vercel, `NEXT_PUBLIC_SITE_URL` + GA id + Upstash env, `public/googledbb2f18fbdb0bf69.html` Search Console verification.

## Design History (Stitch)
- Source: Stitch project `DailyTools Utility Suite` `projects/869416220596028860`, 22 screens (Home+20 tools) — `docs/PLAN.md:1`. All tools rebuilt from literal Stitch HTML pastes, tool-by-tool. Tokens in `src/app/globals.css` (`--primary` vs `--primary-button` split from contrast audit — buttons use `bg-primary-button`, links use `text-primary`). Contrast fixed Phase B (81/81 pass), a11y Phase C (axe-core 0/56 violations), responsive sweep Phase A, breadcrumbs fixed (20/20 have correct `href="/tools?category=X"`).

## Constraints / Rules
- Read all code before changing (user request). Verify via execution (`npm run lint`, `npm run build`, Playwright screenshots, `curl`, standalone scripts) — don't assume.
- `layout: custom` tools own header/breadcrumb/FAQ — don't force into shell.
- Don't create `tailwind.config.ts` — Tailwind v4 uses CSS `@theme`.
- Don't touch `backend/venv/`; don't commit secrets (`.env.local` gitignored).
- Keep `siteConfig.name` as single source for rebrand; `docs/PLAN.md` is phased build log — append, don't rewrite history.

## Next TODO (from PLAN.md:176)
- Attach `tapaikotools.neemlama.com.np` as second Vercel domain, decide redirect vs keep `dailytools.*`, update `NEXT_PUBLIC_SITE_URL`.
