/**
 * Who counts as an advisor, in one place (no imports, so server routes and
 * client pages can both use it).
 *
 * profiles.role only becomes "advisor" inside create_chapter: migrations 0013
 * and 0017 pin it to "member" until the user owns a chapter, so a role field
 * can never be used to read anyone's data. The choice made at sign-up lives in
 * the account's user_metadata.signup_role instead. That is UX only (it decides
 * which setup and labels to show) and grants nothing.
 */
type MaybeUser = { user_metadata?: Record<string, unknown> } | null | undefined;
type MaybeProfile = { role?: string | null; chapter_id?: string | null } | null | undefined;

export function signedUpAsAdvisor(user: MaybeUser): boolean {
  return user?.user_metadata?.signup_role === "advisor";
}

/** An advisor: owns a chapter, or picked advisor and has not joined someone else's chapter. */
export function isAdvisorAccount(profile: MaybeProfile, user: MaybeUser): boolean {
  if (profile?.role === "advisor") return true;
  return !profile?.chapter_id && signedUpAsAdvisor(user);
}
