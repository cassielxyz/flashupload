<p align="center">
  <img src="docs/banner.svg" alt="FlashUpload — resumable direct-to-Google-Drive uploads" width="100%" />
</p>

# FlashUpload

FlashUpload is a browser-first uploader for large files and unstable connections. It uses Google Drive's official resumable-upload protocol so file bytes travel **directly from the user's browser to Google Drive** instead of passing through a FlashUpload relay server.

The interface intentionally uses familiar Drive-like information architecture while keeping FlashUpload's own branding. Light mode is the default; dark mode is built in.

## What it solves

A normal large upload can be painful when a connection drops near the end. FlashUpload keeps a Google Drive resumable session, uploads sequential Drive-compatible chunks, verifies the byte range Google accepted, and retries transient failures. If the page is reloaded, the user can reselect the same local file and FlashUpload can reuse the saved resumable session while it is still valid.

FlashUpload **cannot exceed the physical upload bandwidth of the user's connection**. Its goal is to keep a healthy connection busy and make interruptions much less expensive.

## Features

- Direct browser → Google Drive transfers; no application file relay.
- Google Identity Services OAuth with the narrow `drive.file` permission.
- Official Google Drive resumable upload sessions.
- Adaptive 8 / 16 / 32 MiB chunks, always aligned to Drive's 256 KiB chunk requirement.
- Server-confirmed resume points using Drive's `Range` response header.
- Exponential retry with jitter for `408`, `429`, and `5xx` responses.
- Pause, resume, cancel, and retry controls.
- Session recovery from IndexedDB after the same file is reselected.
- Up to three separate files uploaded concurrently. Chunks within one Drive file remain sequential.
- Combined speed, progress, ETA, and per-file progress.
- Screen Wake Lock where supported while a transfer is active.
- Optional `anyone with the link` sharing, **off by default**.
- Copy/Open Drive link actions after upload.
- Responsive desktop/mobile UI with Framer Motion and Lenis motion.
- shadcn-style component primitives, Radix menus, Lucide icons, and CSS design tokens.
- Default light mode plus persisted dark mode.
- CSP and browser security headers for Vercel deployments.
- Vitest unit coverage for upload-protocol helpers and GitHub Actions verification.

## Architecture

```text
FlashUpload UI (React + Vite + TypeScript)
             │ Google Identity Services
             ▼
        Google OAuth 2.0
             │ drive.file token
             ▼
Browser resumable upload engine
  • adaptive chunks
  • pause / resume
  • retry / range recovery
  • IndexedDB session record
             │ file bytes — DIRECT
             ▼
       Google Drive API
             ▼
        User's Drive
```

No FlashUpload backend is required for file data.

## Google Cloud setup

1. Open Google Cloud Console and create/select a project.
2. Enable **Google Drive API**.
3. Configure the **OAuth consent screen / Google Auth Platform**.
4. Add `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/drive.file`.
5. Create an **OAuth client ID → Web application**.
6. Add development and production URLs under **Authorized JavaScript origins** (for example `http://localhost:5173` and your Vercel/custom domain).
7. Copy the Web Client ID.
8. Create `.env.local` from `.env.example` and set:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

`VITE_GOOGLE_CLIENT_ID` is an OAuth client identifier, not a client secret. Never put a Google OAuth client secret in this frontend.

For a public production deployment, complete the Google OAuth app publishing/verification steps required for your audience. FlashUpload intentionally uses `drive.file`, Google's narrow per-file Drive scope, rather than broad full-Drive access.

## Local development

```bash
npm install
npm run dev
```

### Verify

```bash
npm test
npm run build
```

## Deploy to Vercel

1. Import this repository into Vercel.
2. Add `VITE_GOOGLE_CLIENT_ID` in **Project Settings → Environment Variables**.
3. Deploy.
4. Add the final Vercel/domain origin to the Google OAuth client's Authorized JavaScript origins.

`vercel.json` includes a CSP, `nosniff`, referrer policy, permissions policy, and `same-origin-allow-popups` for the Google OAuth popup flow.

## Upload behavior

Google Drive requires resumable chunks (except the final chunk) to be multiples of 256 KiB. FlashUpload starts at 8 MiB and increases to 16 or 32 MiB when measured throughput justifies it.

FlashUpload can upload multiple **different files** at once. It does not try to send multiple ranges of the same Drive resumable session simultaneously; Drive resumable chunks stay sequential so the accepted byte range stays unambiguous.

The resumable session URL, filename, size, last-modified timestamp, and confirmed uploaded byte count are stored temporarily in IndexedDB. After a reload or browser restart, select the exact same local file again. FlashUpload matches it to the local record and asks Google which bytes were accepted before continuing.

The **Anyone-with-link after upload** switch is disabled by default. When enabled, FlashUpload creates a Drive permission with `type=anyone` and `role=reader` after the file finishes.

## Security and privacy

- File content is not sent to a FlashUpload application server.
- OAuth access tokens remain in page memory and are not persisted to localStorage.
- The app requests `drive.file`, not unrestricted Drive access.
- Public sharing is opt-in.
- Saved resumable-session URLs are treated as sensitive and removed after success/cancel.
- No analytics or advertising trackers are included by default.

See [SECURITY.md](SECURITY.md) and [PRIVACY.md](PRIVACY.md).

## Open-source research

FlashUpload's upload engine is implemented independently against Google's current Drive API documentation. During design, the project also reviewed Tanaike's MIT-licensed `ResumableUploadForGoogleDrive_js` project as a useful example of large-file browser-side Drive uploads, especially its disk-slicing approach that avoids reading an entire large file into memory.

## Roadmap

- Google Picker-based destination folder selection.
- File System Access API recovery without manual re-selection on supported browsers.
- Optional desktop/Android companion for stronger background-upload behavior.
- Local network diagnostics and transfer history.

## License

MIT © 2026 cassielxyz
