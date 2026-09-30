import { permanentRedirect } from "next/navigation";

// The event finder quiz now lives on the landing page, right above "Why not
// just ask a chatbot?". Old links and bookmarks land on it there.
export default function FindYourEventPage() {
  permanentRedirect("/#find-your-event");
}
