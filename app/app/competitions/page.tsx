import { redirect } from "next/navigation";

// The standalone "My event" page was folded into the dashboard (single-event
// model). Redirect any stale links/bookmarks to the dashboard.
export default function MyEventRedirect() {
  redirect("/app");
}
