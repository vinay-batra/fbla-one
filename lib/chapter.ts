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

  try {
    const { data: chapter, error: lookupErr } = await supa
      .from("chapters")
      .select("*")
      .eq("invite_code", inviteCode.trim().toUpperCase())
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
