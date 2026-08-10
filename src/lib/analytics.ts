/**
 * Google Analytics 4 measurement ID — read once here rather than inline in
 * the root layout, matching this project's existing pattern for public env
 * vars (see `lib/site-url.ts`). `undefined` when unset (local dev, or any
 * deploy that hasn't configured GA yet) rather than throwing — analytics is
 * optional infrastructure, not something that should ever break a build or
 * a page render. The root layout only renders `<GoogleAnalytics>` when this
 * is truthy, so an unset var means gtag.js simply never loads.
 *
 * Public (`NEXT_PUBLIC_`) on purpose: a GA measurement ID isn't a secret —
 * gtag.js needs this value in the browser to work at all, the same way
 * it's visible in any GA script tag on any site that uses it.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
