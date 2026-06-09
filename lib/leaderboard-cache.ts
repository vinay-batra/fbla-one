/**
 * Tiny in-memory cache for the chapter leaderboard RPC so the dashboard chip and
 * the chapter page don't fire the same `get_chapter_leaderboard` call twice
 * within seconds (no SWR/react-query in the app). 60s TTL + single-flight.
 */
import { getMyChapterLeaderboard, type LeaderboardRow } from "./chapter";

let cached: { at: number; rows: LeaderboardRow[] } | null = null;
let inflight: Promise<LeaderboardRow[]> | null = null;
const TTL_MS = 60_000;

export async function getLeaderboardCached(): Promise<LeaderboardRow[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.rows;
  if (inflight) return inflight; // single-flight: concurrent callers share one RPC
  inflight = getMyChapterLeaderboard()
    .then((rows) => {
      cached = { at: Date.now(), rows };
      inflight = null;
      return rows;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
}

/** Drop the cache after a mutation that changes standings (join/create/practice). */
export function invalidateLeaderboard(): void {
  cached = null;
}
