// Builds the Supabase Auth email templates in supabase/templates/ from one
// layout, so every email looks the same. Run: node scripts/email-templates.mjs
//
// Supabase does not read these files for a hosted project. Paste each one into
// Dashboard -> Authentication -> Emails -> Templates, with the subject listed
// in supabase/templates/README.md. The {{ .X }} placeholders are Supabase's
// Go template variables; keep them exactly as written.
//
// Email clients ignore most modern CSS, so this is table layout with inline
// styles and web-safe fonts (Georgia stands in for Fraunces). Colors are the
// paper and ink palette from app/globals.css.
import { writeFileSync, mkdirSync } from "node:fs";

const C = {
  paper: "#f5f1e8",
  card: "#fbf8f1",
  ink: "#17181c",
  text2: "#3b3d44",
  text3: "#6b6a66",
  rule: "#e0d8c6",
  red: "#9e2a1b",
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function layout({ preheader, eyebrow, title, body, button, after }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr>
          <td style="padding:0 4px 22px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;"><img src="https://chapterprep.com/logo-mark.png" width="30" height="30" alt="" style="display:block;border:0;"></td>
                <td style="vertical-align:middle;padding-left:10px;font-family:${SERIF};font-size:21px;color:${C.ink};">Chapter<i>Prep</i></td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${C.card};border:1px solid ${C.rule};border-top:4px solid ${C.red};border-radius:10px;padding:36px 36px 32px;">
            <p style="margin:0 0 10px;font-family:${SANS};font-size:13px;font-weight:600;color:${C.red};">${eyebrow}</p>
            <h1 style="margin:0 0 16px;font-family:${SERIF};font-size:28px;line-height:1.2;font-weight:normal;color:${C.ink};">${title}</h1>
            <p style="margin:0 0 26px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.text2};">${body}</p>
            ${button ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius:10px;background:${C.ink};">
                  <a href="${button.href}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:600;color:${C.card};text-decoration:none;border-radius:10px;">${button.label}</a>
                </td>
              </tr>
            </table>` : ""}
            ${after}
          </td>
        </tr>
        <tr>
          <td style="padding:22px 4px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.text3};">
            You are getting this because someone used this address on <a href="https://chapterprep.com" style="color:${C.text3};">chapterprep.com</a>. If that was not you, you can ignore it.<br><br>
            ChapterPrep is an independent student project. Not affiliated with, endorsed by, or sponsored by Future Business Leaders of America, Inc.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;
}

const linkFallback = (href) => `
            <p style="margin:26px 0 0;padding-top:18px;border-top:1px dashed ${C.rule};font-family:${SANS};font-size:13px;line-height:1.6;color:${C.text3};">
              Button not working? Paste this into your browser:<br>
              <a href="${href}" style="color:${C.red};word-break:break-all;">${href}</a>
            </p>`;

const TEMPLATES = {
  "confirm-signup": {
    subject: "Confirm your ChapterPrep account",
    html: layout({
      preheader: "One click and you are in.",
      eyebrow: "Welcome to ChapterPrep",
      title: "Confirm your email",
      body: "Tap the button to confirm {{ .Email }} and start practicing for your event.",
      button: { href: "{{ .ConfirmationURL }}", label: "Confirm and start practicing" },
      after: linkFallback("{{ .ConfirmationURL }}"),
    }),
  },
  "reset-password": {
    subject: "Reset your ChapterPrep password",
    html: layout({
      preheader: "Set a new password and get back to practicing.",
      eyebrow: "Password reset",
      title: "Set a new password",
      body: "Someone asked to reset the password for {{ .Email }}. Open this link on the same device you asked from. It works once.",
      button: { href: "{{ .ConfirmationURL }}", label: "Set a new password" },
      after: linkFallback("{{ .ConfirmationURL }}"),
    }),
  },
  "change-email": {
    subject: "Confirm your new email for ChapterPrep",
    html: layout({
      preheader: "Confirm the change to your sign-in email.",
      eyebrow: "Email change",
      title: "Confirm your new email",
      body: "Your ChapterPrep sign-in is changing from {{ .Email }} to {{ .NewEmail }}. Tap below to confirm.",
      button: { href: "{{ .ConfirmationURL }}", label: "Confirm new email" },
      after: linkFallback("{{ .ConfirmationURL }}"),
    }),
  },
  invite: {
    subject: "You are invited to ChapterPrep",
    html: layout({
      preheader: "Practice tests, an AI judge and mock regionals for your FBLA event.",
      eyebrow: "You are invited",
      title: "Join ChapterPrep",
      body: "You have been invited to ChapterPrep: practice tests built from your event's topic outline, an AI judge for role plays and presentations, and live mock regionals with your chapter. It is free.",
      button: { href: "{{ .ConfirmationURL }}", label: "Accept the invite" },
      after: linkFallback("{{ .ConfirmationURL }}"),
    }),
  },
  reauthentication: {
    subject: "Your ChapterPrep code",
    html: layout({
      preheader: "Your one-time code.",
      eyebrow: "Confirm it is you",
      title: "Your code",
      body: "Enter this code to confirm the change to your account.",
      button: null,
      after: `<p style="margin:0;font-family:${SANS};font-size:34px;font-weight:700;letter-spacing:0.2em;color:${C.ink};">{{ .Token }}</p>`,
    }),
  },
};

const dir = new URL("../supabase/templates/", import.meta.url);
mkdirSync(dir, { recursive: true });
const rows = [];
for (const [name, t] of Object.entries(TEMPLATES)) {
  writeFileSync(new URL(`${name}.html`, dir), t.html);
  rows.push(`| ${name}.html | ${t.subject} |`);
}
writeFileSync(
  new URL("README.md", dir),
  `# Auth email templates

Generated by \`node scripts/email-templates.mjs\`; edit that script, not these files.

Supabase does not read this folder for the hosted project. Paste each file into
**Dashboard -> Authentication -> Emails -> Templates** with this subject:

| File | Subject |
|---|---|
${rows.join("\n")}

Template names in the dashboard: confirm-signup = "Confirm signup", reset-password =
"Reset password", change-email = "Change email address", invite = "Invite user",
reauthentication = "Reauthentication". The magic link template is unused (the
site no longer offers magic links).

These only reach real users once a custom SMTP sender is set up (Authentication ->
Emails -> SMTP Settings). Supabase's built-in sender only delivers to members of
the Supabase project team, a few per hour.
`
);
console.log("wrote", Object.keys(TEMPLATES).length, "templates");
