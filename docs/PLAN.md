# DailyTools — Implementation Reference

Source of truth for the Stitch design inspection (2026-08-08) and the phased build plan.
Stitch project: **DailyTools Utility Suite** (`projects/869416220596028860`).

## 1. Page inventory

22 unique pages designed (each in light + dark, desktop + mobile): **Home** + **20 tools**.

| Category | Tools |
|---|---|
| Student Tools | CGPA Calculator, GPA Calculator, Attendance Calculator, Marks Percentage Calculator |
| Calculators | Age Calculator |
| Date & Time | Unix Timestamp Converter |
| Text Tools | Word Counter, Lorem Ipsum Generator |
| Developer Tools | JSON Formatter, Base64 Encoder/Decoder, URL Shortener (needs a backend — the one non-client-only tool) |
| Converters | Unit Converter |
| Generators | Password Generator, Random Number Generator, UUID Generator, QR Code Generator |
| Finance | Loan Calculator, EMI Calculator, Interest Calculator, Investment Calculator |

Category ↔ tool assignment above is inferred (Home's screen only named the 8 categories; per-tool bucketing is our call). Revisit if it doesn't feel right once the category pages exist.

## 2. Reusable components / page anatomy

- **Header:** logo/site name, nav (Home / All Tools / Categories / Popular), search, theme toggle. (Per-tool screens showed a *different*, inconsistent nav — treated as AI-generation drift; Home's nav was adopted as canonical.)
- **Hero (Home only):** headline + subhead, search bar, popular-tool shortcuts.
- **Tool card:** icon + title + description, used in category grids.
- **Tool page template** (all 20 tools share this shape): breadcrumb-ish header (title + description) → Parameters/input panel → Output panel (result cards, or mono-font output box with copy/refresh icon buttons) → optional visualization (charts, strength meter) → educational content/FAQ → footer.
- **Footer:** copyright, Tools/About/Contact, Privacy/Terms/Disclaimer.

## 3. Design tokens

Source: Stitch's generated `design.md` (YAML front-matter = literal token values, prose = usage rules). Where the prose and the YAML disagreed on a hex value, **the YAML was treated as ground truth** since it's the structured/precise artifact; prose was used for usage rules and for the gaps YAML didn't cover (dark mode, input fill).

**Fonts:** Geist (headings/labels/UI) · Inter (body) · JetBrains Mono (code/output)

**Type scale:** display 48/700 → headline-lg 32/600 (24px mobile) → headline-md 20/600 → body-lg 16 → body-md 14 → label-sm 12/500 → mono 13

**Color (light):** bg `#FCF9F8` · card `#FFFFFF` · primary `#0070F3` (hover `#0058C3`) · secondary `#4648D4` · muted `#F0EDED` · border `#C1C6D7` · error `#BA1A1A` · input fill `#FAFAFA` (prose-only value, no YAML equivalent)

**Color (dark):** no formal YAML token set was provided — bg `#0A0A0A` / elevated `#1A1A1A` came from prose, the rest (borders, muted, hover states) is our extrapolation. **Needs a real QA pass against the actual dark screenshots in Phase 5.**

**Spacing:** 4px base unit — matches Tailwind's default scale exactly, no override needed. Gutter 24px, mobile margin 16px, desktop margin 40px, container max 1200px.

**Radius:** 8px (buttons/inputs) · 24px (cards/containers) · full (pills/tags)

**Elevation:** 1px low-contrast borders instead of shadows for cards; dropdowns/modals get a subtle 10%-opacity shadow.

## 4. Stack decisions

- **Next.js 16 (App Router) + TypeScript + React 19** — scaffolded via `create-next-app`. Note: Next 16 ships breaking changes vs. older docs knowledge (component-level static/dynamic rendering via Cache Components, generated `LayoutProps<'/'>` types). Bundled docs in `node_modules/next/dist/docs/` are the reference until this is internalized.
- **Tailwind CSS v4** (create-next-app's current default) — config lives in CSS (`@theme` in `globals.css`), no `tailwind.config.ts`.
- **next-themes** for the light/dark toggle (class-based, SSR-safe, no flash-of-wrong-theme).
- **lucide-react** for icons instead of literal Material Symbols — equivalent minimalist line-icon look, React components instead of an icon font.
- **shadcn/ui convention adopted for CSS variable naming** (`background`/`foreground`/`primary`/`card`/`border`/`ring`/`radius`, mapped from Stitch's tokens) even though the shadcn CLI/Radix components aren't installed yet — costs nothing now, means Phase 2 (lots of form controls across 20 tools) can adopt shadcn/ui directly against tokens that already match the Stitch palette.
- **npm** as package manager (matches what was available; create-next-app already used it).

## 5. Phased plan

- ✅ **Phase 0 — Scaffold:** Next.js/TS/Tailwind init, design tokens in `globals.css`, fonts, base layout, header + footer, dark-mode foundation, tool-registry data structure (types + metadata, no tool UI).
- ✅ **Phase 1 — Home:** hero, search (relevance-ranked, see `searchTools`), 8-category grid, tool card component, wired to the registry.
- ✅ **Phase 2 — Tool page template:** `/tools/[slug]` dynamic route (SSG, all 20 slugs), shared shell (breadcrumb/header/`Panel`/`CopyButton`/`CodeOutput`/`Faq`), a small hand-rolled `ui/` primitive set (Button via cva, Input, Textarea, Checkbox, Label — shadcn CLI/Radix still deferred, see #4), a generic "coming soon" fallback for unbuilt slugs. Validated against 2 real tools: **JSON Formatter** and **Password Generator** (CSPRNG via `crypto.getRandomValues`, category-guaranteed + Fisher-Yates shuffled). Both flipped to `status: "available"`.
- ✅ **Phase 3 — Remaining 17 tools**, all now `status: "available"`: (a) Word Counter, Base64, UUID, Lorem Ipsum, Unix Timestamp; (b) QR Code, Random Number; (c) Age, GPA, CGPA, Attendance, Marks %, Unit Converter; (d) Loan, EMI, Interest, Investment (chart via the `dataviz` skill — validated `--chart-principal`/`--chart-interest` tokens, real HTML hover tooltip, table-view fallback). New shared infra: `lib/random.ts` (secureRandomInt, now shared with Password Generator), `lib/date.ts` (calendar-correct age), `lib/tools/{weighted-average,finance}.ts`, `EditableTable`, `WeightedAverageTool` (GPA/CGPA share it), `Select`, `StackedBarChart`. 19/20 tools live — only URL Shortener still `coming-soon` (Phase 4, needs a backend).
  - Two real bugs caught by testing rather than assumed correct: (1) an SVG `<title>` tooltip was silently emptied by React 19's automatic document-metadata hoisting (any `<title>` anywhere in the tree gets pulled into `<head>`) — replaced with a real positioned HTML tooltip. (2) the age calculator's "borrow a month" arithmetic broke when the birth day-of-month exceeded the borrowed month's length (e.g. Jan 31 → Mar 1 gave "1 month, −1 days") — rewrote using a clamped-anniversary-date approach and re-verified against the same failing case plus leap-day and exact-anniversary cases.
- **Phase 4 — URL Shortener:** the one tool needing a backend (API route + KV/DB for redirect persistence) — isolated as its own slice.
- **Phase 5 — Polish:** search/filter across tools, per-tool SEO metadata, dark-mode QA against actual dark screens, responsive QA against mobile screens, accessibility contrast pass, deploy.
