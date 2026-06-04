/**
 * Chapter-related Supabase operations.
 *
 * All functions are async and return null / empty arrays on error rather
 * than throwing, so the UI can degrade gracefully when offline or when
 * the user is in preview mode (no Supabase configured).
 */

import { getSupabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────

export type ChapterProfile = {
  id: string;
  chapter_id: string | null;
  role: "member" | "officer" | "advisor" | "admin";
  display_name: string | null;
  email: string | null;
};

export type ChapterInfo = {
  id: string;
  name: string;
  invite_code: string;
  advisor_user_id: string;
  school: string | null;
  state: string | null;
};

export type MemberRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  registrations: string[]; // competition slugs
};

// ── Helpers ───────────────────────────────────────────────────

function devErr(label: string, e: unknown) {
  if (process.env.NODE_ENV !== "production") console.error(label, e);
}

function randomInviteCode(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

/** True when an RPC failed because the function is not in the DB yet (pre-migration 0007). */
function isMissingFunction(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  const msg = (err.message ?? "").toLowerCase();
  return (
    code === "PGRST202" || code === "404" || code === "42883" ||
    msg.includes("could not find the function") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

// ── Profile ───────────────────────────────────────────────────

/** Fetch the signed-in user's profile row. */
export async function getMyProfile(userId: string): Promise<ChapterProfile | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const { data, error } = await supa
      .from("profiles")
      .select("id, chapter_id, role, display_name, email")
      .eq("id", userId)
      .single();
    if (error) { devErr("getMyProfile:", error); return null; }
    return data as ChapterProfile;
  } catch (e) {
    devErr("getMyProfile:", e);
    return null;
  }
}

// ── Chapter CRUD ──────────────────────────────────────────────

/** Create a new chapter and make the caller its advisor. */
export async function createChapter(
  userId: string,
  name: string
): Promise<{ data: ChapterInfo | null; error: string | null }> {
  const supa = getSupabase();
  if (!supa) return { data: null, error: "Supabase not configured" };

  try {
    // Preferred path (migration 0007): create + assign advisor server-side, where
    // the chapter_id change is permitted by the guard trigger.
    const { data: rpcData, error: rpcErr } = await supa.rpc("create_chapter", { p_name: name.trim() });
    if (!rpcErr && rpcData) {
      return { data: rpcData as ChapterInfo, error: null };
    }
    if (rpcErr && !isMissingFunction(rpcErr)) {
      devErr("createChapter rpc:", rpcErr);
      return { data: null, error: rpcErr.message ?? "Failed to create chapter" };
    }

    // Fallback for before 0007 is applied: direct insert + profile update.
    const inviteCode = randomInviteCode();
    const { data: chapter, error: chErr } = await supa
      .from("chapters")
      .insert({ name: name.trim(), invite_code: inviteCode, advisor_user_id: userId })
      .select()
      .single();

    if (chErr || !chapter) {
      devErr("createChapter insert:", chErr);
      return { data: null, error: chErr?.message ?? "Failed to create chapter" };
    }

    const { error: profErr } = await supa
      .from("profiles")
      .update({ chapter_id: chapter.id, role: "advisor" })
      .eq("id", userId);

    if (profErr) devErr("createChapter profile update:", profErr);

    return { data: chapter as ChapterInfo, error: null };
  } catch (e) {
    devErr("createChapter:", e);
    return { data: null, error: "Something went wrong" };
  }
}

/** Join an existing chapter by invite code. */
export async function joinChapter(
  userId: string,
  inviteCode: string
): Promise<{ data: ChapterInfo | null; error: string | null }> {
  const supa = getSupabase();
  if (!supa) return { data: null, error: "Supabase not configured" };

  const code = inviteCode.trim().toUpperCase();
  try {
    // Preferred path (migration 0007): validate the invite server-side. The client
    // no longer needs read access to other chapters.
    const { data: result, error: rpcErr } = await supa.rpc("join_chapter_by_code", { p_code: code });
    if (!rpcErr && result) {
      const row = Array.isArray(result) ? result[0] : result;
      // 0014+: the RPC returns the full chapter row, so use it directly. Pre-0014
      // it returns just the id (a string) - fall back to a fetch in that case.
      if (row && typeof row === "object") return { data: row as ChapterInfo, error: null };
      const ch = await getChapterById(String(row));
      return ch
        ? { data: ch, error: null }
        : { data: null, error: "Joined, but could not load the chapter." };
    }
    if (rpcErr && !isMissingFunction(rpcErr)) {
      if ((rpcErr.message ?? "").toLowerCase().includes("invalid invite code")) {
        return { data: null, error: "Invalid invite code. Double-check with your advisor." };
      }
      devErr("joinChapter rpc:", rpcErr);
      return { data: null, error: rpcErr.message ?? "Could not join chapter" };
    }

    // Fallback for before 0007 is applied: look up the chapter + direct profile update.
    const { data: chapter, error: lookupErr } = await supa
      .from("chapters")
      .select("*")
      .eq("invite_code", code)
      .single();

    if (lookupErr || !chapter) {
      return { data: null, error: "Invalid invite code. Double-check with your advisor." };
    }

    const { error: profErr } = await supa
      .from("profiles")
      .update({ chapter_id: chapter.id, role: "member" })
      .eq("id", userId);

    if (profErr) {
      devErr("joinChapter profile update:", profErr);
      return { data: null, error: profErr.message };
    }

    return { data: chapter as ChapterInfo, error: null };
  } catch (e) {
    devErr("joinChapter:", e);
    return { data: null, error: "Something went wrong" };
  }
}

/** Fetch a chapter by its id. */
export async function getChapterById(id: string): Promise<ChapterInfo | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const { data, error } = await supa
      .from("chapters")
      .select("*")
      .eq("id", id)
      .single();
    if (error) { devErr("getChapterById:", error); return null; }
    return data as ChapterInfo;
  } catch (e) {
    devErr("getChapterById:", e);
    return null;
  }
}

export type ActivityItem = {
  id: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  competitionSlug: string;
  score: number | null;
  outOf: number | null;
  loggedAt: string;
};

// ── Advisor dashboard ─────────────────────────────────────────

/**
 * Fetch all members of a chapter plus their registered competition slugs.
 * Requires the "Advisors read chapter member profiles" RLS policy from
 * migration 0004 to be in place.
 */
export async function getChapterMembers(chapterId: string): Promise<MemberRow[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const { data: profiles, error: profErr } = await supa
      .from("profiles")
      .select("id, display_name, email, role")
      .eq("chapter_id", chapterId);

    if (profErr || !profiles?.length) {
      devErr("getChapterMembers profiles:", profErr);
      return [];
    }

    const memberIds = profiles.map((p) => p.id as string);

    const { data: regs, error: regErr } = await supa
      .from("registrations")
      .select("user_id, competition_slug")
      .in("user_id", memberIds);

    if (regErr) devErr("getChapterMembers regs:", regErr);

    const byUser = new Map<string, string[]>();
    for (const r of regs ?? []) {
      const list = byUser.get(r.user_id as string) ?? [];
      list.push(r.competition_slug as string);
      byUser.set(r.user_id as string, list);
    }

    return profiles.map((p) => ({
      id: p.id as string,
      display_name: p.display_name as string | null,
      email: p.email as string | null,
      role: p.role as string,
      registrations: byUser.get(p.id as string) ?? [],
    }));
  } catch (e) {
    devErr("getChapterMembers:", e);
    return [];
  }
}

/**
 * Fetch recent practice logs for all members of a chapter.
 * Requires the "Advisors read chapter member practice logs" RLS policy
 * (migration 0005) to be in place.
 */
export async function getChapterActivity(chapterId: string, limit = 25): Promise<ActivityItem[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const { data: profiles } = await supa
      .from("profiles")
      .select("id, display_name, email")
      .eq("chapter_id", chapterId);

    if (!profiles?.length) return [];

    const memberMap = new Map(
      (profiles as { id: string; display_name: string | null; email: string | null }[]).map((p) => [
        p.id,
        { display_name: p.display_name, email: p.email },
      ])
    );
    const memberIds = profiles.map((p) => p.id as string);

    const { data: logs, error } = await supa
      .from("practice_logs")
      .select("id, user_id, competition_slug, score, out_of, logged_at")
      .in("user_id", memberIds)
      .order("logged_at", { ascending: false })
      .limit(limit);

    if (error) { devErr("getChapterActivity logs:", error); return []; }
    if (!logs?.length) return [];

    return (logs as Record<string, unknown>[]).map((l) => ({
      id: String(l.id),
      memberId: String(l.user_id),
      memberName: memberMap.get(String(l.user_id))?.display_name ?? null,
      memberEmail: memberMap.get(String(l.user_id))?.email ?? null,
      competitionSlug: String(l.competition_slug),
      score: l.score == null ? null : Number(l.score),
      outOf: l.out_of == null ? null : Number(l.out_of),
      loggedAt: String(l.logged_at),
    }));
  } catch (e) {
    devErr("getChapterActivity:", e);
    return [];
  }
}

// ── Chapter stats + leaderboard ───────────────────────────────

export type MemberStat = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  tests: number; // total practice logs
  scoredTests: number; // logs with both score + outOf
  avgPct: number | null;
  bestPct: number | null;
  lastActiveAt: string | null;
  last7: number; // logs in the last 7 days
};

export type WeeklyPoint = { weekStart: string; tests: number; avgPct: number | null };

export type ChapterStats = {
  members: MemberStat[]; // leaderboard, already sorted
  totalTests: number;
  activeThisWeek: number; // members with >= 1 log in the last 7 days
  chapterAvgPct: number | null;
  weekly: WeeklyPoint[]; // last 8 weeks, oldest -> newest
  topEvents: { slug: string; tests: number }[]; // top 5 by test count
};

// ── Student-visible leaderboard (aggregates only, via RPC) ────

export type LeaderboardRow = { userId: string; name: string; tests: number; last7: number };

/** Every chapter member can call this; the RPC returns only aggregates for the
 *  caller's own chapter (no raw scores), ranked by practice volume. */
export async function getMyChapterLeaderboard(): Promise<LeaderboardRow[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const { data, error } = await supa.rpc("get_chapter_leaderboard");
    if (error) { devErr("getMyChapterLeaderboard:", error); return []; }
    return (data ?? []).map((r: Record<string, unknown>) => ({
      userId: String(r.user_id),
      name: (r.display_name as string)?.trim() || "Member",
      tests: Number(r.tests) || 0,
      last7: Number(r.last7) || 0,
    }));
  } catch (e) {
    devErr("getMyChapterLeaderboard:", e);
    return [];
  }
}

// ── Assignments ───────────────────────────────────────────────

export type Assignment = {
  id: string;
  chapter_id: string;
  title: string;
  event_slug: string | null;
  target_count: number;
  due_at: string | null;
  created_at: string;
};

export type AssignmentProgress = {
  assignment: Assignment;
  perMember: { id: string; name: string; done: number; complete: boolean }[];
  completedCount: number;
  totalMembers: number;
};

export async function getChapterAssignments(chapterId: string): Promise<Assignment[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const { data, error } = await supa
      .from("assignments")
      .select("id, chapter_id, title, event_slug, target_count, due_at, created_at")
      .eq("chapter_id", chapterId)
      .order("created_at", { ascending: false });
    if (error) { devErr("getChapterAssignments:", error); return []; }
    return (data ?? []) as Assignment[];
  } catch (e) {
    devErr("getChapterAssignments:", e);
    return [];
  }
}

export async function createAssignment(
  chapterId: string,
  userId: string,
  input: { title: string; eventSlug: string | null; targetCount: number; dueAt: string | null }
): Promise<{ data: Assignment | null; error: string | null }> {
  const supa = getSupabase();
  if (!supa) return { data: null, error: "Supabase not configured" };
  try {
    const { data, error } = await supa
      .from("assignments")
      .insert({
        chapter_id: chapterId,
        title: input.title.trim(),
        event_slug: input.eventSlug || null,
        target_count: Math.max(1, Math.min(100, Math.round(input.targetCount) || 1)),
        due_at: input.dueAt || null,
        created_by: userId,
      })
      .select("id, chapter_id, title, event_slug, target_count, due_at, created_at")
      .single();
    if (error) { devErr("createAssignment:", error); return { data: null, error: error.message }; }
    return { data: data as Assignment, error: null };
  } catch (e) {
    devErr("createAssignment:", e);
    return { data: null, error: "Could not create assignment" };
  }
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const supa = getSupabase();
  if (!supa) return false;
  try {
    const { error } = await supa.from("assignments").delete().eq("id", id);
    if (error) { devErr("deleteAssignment:", error); return false; }
    return true;
  } catch (e) {
    devErr("deleteAssignment:", e);
    return false;
  }
}

/** Advisor view: assignments + each member's completion, computed from logs. */
export async function getChapterAssignmentBoard(chapterId: string): Promise<AssignmentProgress[]> {
  const supa = getSupabase();
  if (!supa) return [];
  try {
    const assignments = await getChapterAssignments(chapterId);
    if (!assignments.length) return [];

    const { data: profiles } = await supa
      .from("profiles")
      .select("id, display_name, email")
      .eq("chapter_id", chapterId);
    const members = (profiles ?? []).map((p) => ({
      id: p.id as string,
      name: (p.display_name as string)?.trim() || (p.email as string)?.split("@")[0] || "Member",
    }));
    const memberIds = members.map((m) => m.id);

    const { data: logs } = await supa
      .from("practice_logs")
      .select("user_id, competition_slug, logged_at")
      .in("user_id", memberIds)
      .limit(5000);
    const allLogs = (logs ?? []) as Record<string, unknown>[];

    return assignments.map((a) => {
      const since = new Date(a.created_at).getTime();
      const perMember = members.map((m) => {
        const done = allLogs.filter(
          (l) =>
            String(l.user_id) === m.id &&
            new Date(String(l.logged_at)).getTime() >= since &&
            (!a.event_slug || String(l.competition_slug) === a.event_slug)
        ).length;
        return { id: m.id, name: m.name, done: Math.min(done, a.target_count), complete: done >= a.target_count };
      });
      return {
        assignment: a,
        perMember,
        completedCount: perMember.filter((p) => p.complete).length,
        totalMembers: members.length,
      };
    });
  } catch (e) {
    devErr("getChapterAssignmentBoard:", e);
    return [];
  }
}

function pctOf(score: unknown, outOf: unknown): number | null {
  if (score == null || outOf == null) return null;
  const o = Number(outOf);
  if (!o) return null;
  return Math.round((Number(score) / o) * 100);
}

/**
 * Aggregate every chapter member's practice logs into a leaderboard + trend.
 * Relies on the "Advisors read chapter member practice logs" RLS policy
 * (migration 0005), so only an advisor will get other members' rows back.
 */
export async function getChapterStats(chapterId: string): Promise<ChapterStats | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const { data: profiles, error: pErr } = await supa
      .from("profiles")
      .select("id, display_name, email, role")
      .eq("chapter_id", chapterId);

    if (pErr || !profiles?.length) {
      if (pErr) devErr("getChapterStats profiles:", pErr);
      return null;
    }

    const memberIds = profiles.map((p) => p.id as string);

    const { data: logs, error: lErr } = await supa
      .from("practice_logs")
      .select("user_id, competition_slug, score, out_of, logged_at")
      .in("user_id", memberIds)
      .order("logged_at", { ascending: false })
      .limit(2000);

    if (lErr) devErr("getChapterStats logs:", lErr);
    const allLogs = (logs ?? []) as Record<string, unknown>[];

    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const now = Date.now();
    const sevenAgo = now - weekMs;

    // Per-member aggregation.
    const statById = new Map<string, MemberStat>();
    const pctSum = new Map<string, number>();
    for (const p of profiles) {
      statById.set(p.id as string, {
        id: p.id as string,
        name: (p.display_name as string)?.trim() || (p.email as string)?.split("@")[0] || "Member",
        email: (p.email as string) ?? null,
        role: (p.role as string) ?? "member",
        tests: 0,
        scoredTests: 0,
        avgPct: null,
        bestPct: null,
        lastActiveAt: null,
        last7: 0,
      });
    }

    for (const l of allLogs) {
      const s = statById.get(String(l.user_id));
      if (!s) continue;
      s.tests += 1;
      const loggedAt = String(l.logged_at);
      if (new Date(loggedAt).getTime() >= sevenAgo) s.last7 += 1;
      if (!s.lastActiveAt || loggedAt > s.lastActiveAt) s.lastActiveAt = loggedAt;
      const pct = pctOf(l.score, l.out_of);
      if (pct != null) {
        s.scoredTests += 1;
        pctSum.set(s.id, (pctSum.get(s.id) ?? 0) + pct);
        if (s.bestPct == null || pct > s.bestPct) s.bestPct = pct;
      }
    }
    for (const s of statById.values()) {
      if (s.scoredTests > 0) s.avgPct = Math.round((pctSum.get(s.id) ?? 0) / s.scoredTests);
    }

    // Leaderboard: effort first (test count), then accuracy, then name.
    const members = Array.from(statById.values()).sort((a, b) => {
      if (b.tests !== a.tests) return b.tests - a.tests;
      const av = a.avgPct ?? -1;
      const bv = b.avgPct ?? -1;
      if (bv !== av) return bv - av;
      return a.name.localeCompare(b.name);
    });

    // Chapter headline numbers.
    const scoredPcts = allLogs.map((l) => pctOf(l.score, l.out_of)).filter((p): p is number => p != null);
    const chapterAvgPct = scoredPcts.length
      ? Math.round(scoredPcts.reduce((a, b) => a + b, 0) / scoredPcts.length)
      : null;
    const activeThisWeek = members.filter((m) => m.last7 > 0).length;

    // Weekly trend: 8 rolling 7-day buckets ending today, oldest -> newest.
    // One pass over the logs (was 8 filter passes, each re-parsing every timestamp).
    const todayMid = new Date();
    todayMid.setHours(0, 0, 0, 0);
    const endExclusive = todayMid.getTime() + dayMs; // include all of today
    const oldestStart = endExclusive - 8 * weekMs;
    const bTests = new Array(8).fill(0);
    const bSum = new Array(8).fill(0);
    const bCount = new Array(8).fill(0);
    for (const l of allLogs) {
      const t = new Date(String(l.logged_at)).getTime();
      if (t < oldestStart || t >= endExclusive) continue;
      const idx = Math.floor((t - oldestStart) / weekMs); // 0 = oldest bucket, 7 = newest
      if (idx < 0 || idx > 7) continue;
      bTests[idx] += 1;
      const pct = pctOf(l.score, l.out_of);
      if (pct != null) { bSum[idx] += pct; bCount[idx] += 1; }
    }
    const weekly: WeeklyPoint[] = [];
    for (let idx = 0; idx < 8; idx++) {
      weekly.push({
        weekStart: new Date(oldestStart + idx * weekMs).toISOString().slice(0, 10),
        tests: bTests[idx],
        avgPct: bCount[idx] ? Math.round(bSum[idx] / bCount[idx]) : null,
      });
    }

    // Top events by practice volume.
    const eventCount = new Map<string, number>();
    for (const l of allLogs) {
      const slug = String(l.competition_slug);
      eventCount.set(slug, (eventCount.get(slug) ?? 0) + 1);
    }
    const topEvents = Array.from(eventCount.entries())
      .map(([slug, tests]) => ({ slug, tests }))
      .sort((a, b) => b.tests - a.tests)
      .slice(0, 5);

    return {
      members,
      totalTests: allLogs.length,
      activeThisWeek,
      chapterAvgPct,
      weekly,
      topEvents,
    };
  } catch (e) {
    devErr("getChapterStats:", e);
    return null;
  }
}
