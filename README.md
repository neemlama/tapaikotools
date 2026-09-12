# TapaikoTools — Free Tools for Everyday Tasks

24 free online tools (calculators, converters, generators, finance, text, dev, image). Next.js 16 + React 19 + Tailwind v4. Most tools run 100% client-side; URL Shortener needs Upstash Redis, PDF↔DOCX needs the Python backend in `backend/`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## URL Shortener setup (Upstash Redis)

Every tool on this site runs entirely client-side except the URL Shortener, which needs somewhere to persist short-code → URL mappings so a link keeps working after the server restarts or a new deploy goes out. That's [Upstash](https://upstash.com) Redis — a REST-based, serverless-friendly database with a free tier, so it works the same in local dev and on Vercel with zero server of our own to run.

1. Create a free account at [upstash.com](https://upstash.com) and create a new **Redis** database (any region is fine).
2. On the database's page, find the **REST API** section and copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` values.
3. Paste them into `.env.local` (already has empty placeholders for both):
   ```
   UPSTASH_REDIS_REST_URL=https://your-db-name.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token-here
   ```
4. Restart `npm run dev`. The "Shorten" button on `/tools/url-shortener` will work immediately — no other code changes needed.

If deploying (e.g. to Vercel), add the same two variables in your host's environment variable settings — `.env.local` is git-ignored and never deployed.

Without these set, every other page on the site works normally; only the URL Shortener's "Shorten" button will show an error.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
