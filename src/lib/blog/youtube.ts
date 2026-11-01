// YouTube helpers for blog posts. Publish dates come from the Data API at
// build time, for the VideoObject's uploadDate.

const YOUTUBE_ID = /(?:v=|youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{11})/;
const API_BATCH_SIZE = 50; // videos.list's limit per call.

export function youtubeIdFrom(url: string | null | undefined): string | undefined {
  return url?.match(YOUTUBE_ID)?.[1];
}

/** Video id → YouTube's publish date. For a video uploaded as Unlisted that
 * is its upload time. Never throws: an id can be missing because there's no
 * key, a call failed, or the video is private or deleted, and the post
 * falls back to its own publishedAt. */
export async function fetchYoutubePublishDates(ids: string[], apiKey: string | undefined): Promise<Map<string, string>> {
  const dates = new Map<string, string>();
  if (!apiKey) {
    console.warn('[blog] YOUTUBE_API_KEY not configured — video uploadDate falls back to each post\'s publishedAt.');
    return dates;
  }
  const unique = [...new Set(ids)];
  for (let i = 0; i < unique.length; i += API_BATCH_SIZE) {
    const params = new URLSearchParams({
      part: 'snippet',
      id: unique.slice(i, i + API_BATCH_SIZE).join(','),
      fields: 'items(id,snippet/publishedAt)',
      key: apiKey,
    });
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);
      if (!response.ok) {
        await response.body?.cancel();
        console.warn(`[blog] YouTube videos.list failed (${response.status}) — those videos fall back to publishedAt.`);
        continue;
      }
      const data = (await response.json()) as { items?: Array<{ id: string; snippet?: { publishedAt?: string } }> };
      for (const item of data.items ?? []) {
        if (item.snippet?.publishedAt) dates.set(item.id, item.snippet.publishedAt);
      }
    } catch {
      console.warn('[blog] Could not reach YouTube — those videos fall back to publishedAt.');
    }
  }
  return dates;
}
