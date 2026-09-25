# FlashUpload — Live Checkpoint

Last updated: 2026-09-26
Active branch: `main`
Production workspace merge: PR `#3`
Merged commit: `77c220ca55446dc4cefb62226c2942472af33bb5`
Production domain: `https://flashupload.cassielae.me/`

## Current state

The production Drive-workspace implementation has been merged to `main` after a green PR-head GitHub Actions run: 9/9 unit tests passed and the TypeScript/Vite production build passed. Vercel is expected to redeploy `main` automatically.

The original production upload attempt for `chatgpt magazine.zip.001` failed immediately at 0% with only `Could not start the Drive upload (403).` The old build discarded Google's response payload, so the exact cause of that historical 403 cannot be recovered from the screenshot alone.

The merged implementation now parses and surfaces Google's real Drive API reason/message and provides actionable hints for known cases such as Drive API disabled, insufficient OAuth scope, rate limits, and storage quota. The exact production 403 cause must be confirmed by one live retry after the new deployment is active. Do not guess it before observing the new diagnostic.

## Architecture decision

`drive.file` intentionally limits FlashUpload to files/folders created by or explicitly granted to the app. The production workspace therefore creates/uses a normal app-owned `FlashUpload` folder in the user's Drive. This preserves the narrow OAuth scope while giving the app real file-manager behavior. Whole-Drive visibility would require broader OAuth scopes and a different verification/security posture.

## Completed

- [x] Durable repo-based AI continuation system: `AGENTS.md`, `.ai/PROJECT_CONTEXT.md`, `.ai/CHECKPOINT.md`.
- [x] Detailed, non-secret Google Drive API error parsing and actionable 403 diagnostics.
- [x] Resumable upload destination-folder support and persisted destination checkpoints.
- [x] Drive API operations for listing, metadata, create folder, rename, move, trash, restore, permanent delete, folder discovery, and trash queries.
- [x] App-owned top-level `FlashUpload` Drive folder initialization.
- [x] Real authenticated Drive workspace with folder navigation/breadcrumbs, create folder, upload to current folder, list/grid views, sorting, search, refresh, item details, rename, move, trash, restore, permanent delete, Open in Drive, and copy-link actions.
- [x] Functional Transfers, Trash, Settings, and How-it-works surfaces.
- [x] Redesigned FlashUpload identity integrated into site header/wordmark, favicon, web-app manifest, HTML title/metadata, Open Graph metadata, and README banner.
- [x] Production brand SVG at `public/brand/flashupload-logo.svg`; legacy favicon synchronized.
- [x] Public `/privacy` and `/terms` pages, Vercel rewrites, and visible homepage legal links.
- [x] Public legal pages avoid initializing Google OAuth.
- [x] Repository `PRIVACY.md`, `TERMS.md`, and production README updated for `flashupload.cassielae.me`.
- [x] New Drive diagnostics/helper tests; PR-head CI passed 9/9 tests and production build.
- [x] PR #3 reviewed, marked ready, and squash-merged to `main`.

## Next actions — execute in this order

- [ ] Verify CI for the latest `main` checkpoint commit is green and confirm Vercel production deployment finishes.
- [ ] Live-test `https://flashupload.cassielae.me/privacy` and `https://flashupload.cassielae.me/terms`.
- [ ] Open FlashUpload, connect Google, and confirm the app-owned `FlashUpload` Drive folder/workspace initializes.
- [ ] Test create folder, listing/navigation, rename/move/trash/restore, Settings, and a real resumable upload.
- [ ] If 403 remains, copy the exact new “Google Drive needs attention” / upload error text and fix the real Cloud/OAuth/API cause from that reason.
- [ ] Upload/use the 120×120 FlashUpload logo in Google OAuth Branding and finish Google production publishing/verification fields.
- [ ] Record the final live-production result here.

## Resume instruction

If the user says only **continue**, do not restart planning. Read `AGENTS.md`, `.ai/CHECKPOINT.md`, and `.ai/PROJECT_CONTEXT.md`, inspect `main`, latest commits, PRs/issues, and CI, then continue from the first unchecked action above that is not already completed by repository state.
