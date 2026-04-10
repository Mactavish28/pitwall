# Pitwall

Pitwall is a polished Formula 1 race intelligence dashboard built with `Next.js`, `TypeScript`, and the free historical endpoints from `OpenF1`.

It is designed as a portfolio-grade side project:

- season overview with the latest featured race
- race detail pages with results, grid delta, stint strategy, pit lane logs, radio clips, weather, and control messages
- tag-based caching plus a cron-triggered refresh route for Vercel deployments

## Stack

- `Next.js` App Router
- `Tailwind CSS`
- `OpenF1` public API
- `Vercel` cron job for cache refresh

## Local development

```bash
npm install
npm run dev
```

The app lives at `http://localhost:3000`.

## Scheduled refresh

The cron handler is available at `/api/cron/refresh`.

If you set `CRON_SECRET`, the route expects:

```text
Authorization: Bearer <CRON_SECRET>
```

`vercel.json` is configured to hit that route every 4 hours:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

## Notes

- OpenF1 historical data is free from `2023` onward.
- Real-time live timing requires a paid OpenF1 subscription.
- `championship_drivers` and `championship_teams` are beta endpoints, so those cards degrade gracefully if data is missing.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
