# FlashUpload — Stable Project Context

## Product goal

FlashUpload is a production web app for reliable large-file uploads to a user's own Google Drive. It should feel like a polished Google-Drive-adjacent file workspace rather than a generic uploader.

Primary production domain: `https://flashupload.cassielae.me/`
Repository: `cassielxyz/flashupload`

## Core transfer architecture

- React + Vite + TypeScript frontend.
- Google Identity Services OAuth.
- Google Drive API with narrow `https://www.googleapis.com/auth/drive.file` scope.
- File bytes travel directly Browser -> Google Drive.
- Google Drive resumable upload sessions.
- Adaptive Drive-compatible chunk sizing.
- Pause/resume/retry and IndexedDB resumable-session recovery.
- Multiple separate files may upload concurrently; chunks inside one resumable file remain ordered/sequential.
- Optional public link sharing stays OFF by default.

## Product/UI requirements

- Light mode default; dark mode required.
- Refined Drive-inspired information architecture, but with distinctive FlashUpload visual identity.
- Smooth motion and transitions without looking like a generic AI-generated SaaS template.
- Current visual direction is a technical/editorial transfer-engine style inspired by modern developer tools.
- Use the redesigned multicolor FlashUpload upload/bolt logo everywhere: website header, favicon/app metadata, OAuth branding asset, README/banner/brand assets.
- The website should eventually behave as a useful Drive workspace, not only an upload queue.

## Required Drive workspace capabilities

The authenticated experience must include real working UI and Drive API integration for:

- list files and folders
- folder navigation/breadcrumbs
- create folder
- upload into the current folder
- rename file/folder
- move file/folder
- delete/trash
- restore where practical
- search/list refresh
- file/folder details
- open in Drive
- copy/share link controls
- sorting/view controls where useful
- working Settings surface
- working How it works/help surface

Do not present navigation items or buttons as functional unless they actually work.

## OAuth / production requirements

- Public OAuth app for external users.
- Authorized production JavaScript origin should include `https://flashupload.cassielae.me`.
- Keep the Vercel production origin only while useful for deployment/testing.
- Public homepage, Privacy Policy, and Terms pages are required for production branding/verification.
- Root domain `cassielae.me` is the umbrella domain for this and future projects/subdomains.

## Engineering quality

- Preserve existing working behavior unless a fix intentionally replaces it.
- Surface useful API error details instead of opaque status-only messages.
- Tests must cover protocol helpers and important Drive operations.
- Production build and CI must pass before merge.
- Keep security headers/CSP aligned with Google Identity/Drive endpoints actually used by the app.
