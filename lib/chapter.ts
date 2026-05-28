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
