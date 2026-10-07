// Removed listings (Michael, 2026-10-07): once a home is rented or taken
// off the market, the next build drops its page, and its URL would 404
// even though it may still be indexed or linked. Instead, 301 it to that
// city's homes-for-rent page, or the Indianapolis page when the city has
// none (src/lib/listings/hub.ts).
//
// Only acts on a response that's already a 404, so live listing pages
// (static files, served before this worker runs in production; rendered
// normally in dev) are never touched.
import { defineMiddleware } from 'astro:middleware';
import { homesForRentHub } from './lib/listings/hub';

const LISTING_PATH = /^\/homes-for-rent\/([a-z0-9-]+)(?:\/[^/]*)?\/?$/;

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (response.status !== 404) return response;
  const match = context.url.pathname.match(LISTING_PATH);
  if (!match) return response;
  const hub = homesForRentHub(match[1], match[1]);
  return context.redirect(hub.href, 301);
});
