// Monthly deletion of website form submissions older than two years, per
// the site's privacy policy (/privacy-policy, "How long we keep
// information"). Runs on this worker's existing monthly cron because it
// already holds the shared D1 binding; it has nothing to do with RentCast.
//
// Report links themselves stop working at six months — that's enforced
// when a report is viewed (src/pages/rental-analysis/[token].astro), not
// here.

const RETENTION_DAYS = 730;

// Every table holding personal data from a website form. created_at is an
// ISO-8601 string in all three, so string comparison orders correctly.
const TABLES = ['rental_analyses', 'contact_submissions', 'market_readiness_submissions'] as const;

export async function purgeExpiredSubmissions(db: D1Database, now = new Date()): Promise<Record<string, number>> {
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 86_400_000).toISOString();
  const deleted: Record<string, number> = {};
  for (const table of TABLES) {
    try {
      const result = await db.prepare(`DELETE FROM ${table} WHERE created_at < ?`).bind(cutoff).run();
      deleted[table] = result.meta.changes ?? 0;
    } catch (err) {
      // One table failing (e.g. not migrated yet) shouldn't block the others.
      console.error(`[retention] Could not purge ${table}:`, err);
      deleted[table] = -1;
    }
  }
  console.log(`[retention] Deleted submissions created before ${cutoff}: ${JSON.stringify(deleted)}`);
  return deleted;
}
