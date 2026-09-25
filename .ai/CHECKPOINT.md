# FlashUpload — Live Checkpoint

Last updated: 2026-09-26
Active branch: `main`
Production workspace merge: PR `#3`
Production domain: `https://flashupload.cassielae.me/`

## Current state

The production Drive workspace is merged and deployed. The current app includes Google Drive error diagnostics, resumable upload destination support, an app-owned `FlashUpload` folder, file/folder navigation and management, Transfers, Trash, Settings, How-it-works, production branding, and public Privacy/Terms pages.

The original `Could not start the Drive upload (403)` screenshot cannot reveal the historical cause because the older build discarded Google's response body. The current build now preserves Google's actual Drive API reason/message for the next real retry.

## README refresh completed

- [x] Preserved the existing `docs/banner.svg` banner without redesigning it.
- [x] Rewrote `README.md` for end users instead of exposing unnecessary implementation details.
- [x] Added three visual previews under `docs/previews/`: `landing.webp`, `workspace.webp`, and `transfers.webp`.
- [x] Added custom SVG README icons under `docs/readme-icons/` instead of emoji.
- [x] Added simple sections for what FlashUpload is, what users can do, how it works, privacy, live usage, contributors, security, and license.
- [x] Removed the temporary README staging placeholder.

## Next actions

- [ ] Verify CI for the latest README/checkpoint commit is green and confirm Vercel production deployment completes.
- [ ] Live-test Google sign-in and Drive workspace initialization on `https://flashupload.cassielae.me/`.
- [ ] Create a folder and perform a small real upload.
- [ ] Retry the large split ZIP upload and capture the exact Google error if it still fails.
- [ ] Finish Google OAuth branding/publishing with homepage, privacy, terms, authorized domain, and the square FlashUpload logo.

## Resume instruction

If the user says **continue**, inspect the current `main` branch and CI first, then continue from the first unfinished item above. Repository state wins over chat memory.
