# FlashUpload — Live Checkpoint

Last updated: 2026-09-26
Active work branch: `fix/drive-workspace-production`
Draft PR: `#3` — Build production Drive workspace and diagnostics
Base/main observed before this work: `f6339efa4a84de42c5755dfcd86cd60788bc40fd`

## Remaining live-production question

The original production upload attempt for `chatgpt magazine.zip.001` failed immediately at 0% with only `Could not start the Drive upload (403).` The old code discarded Google's response payload, so the exact cause of that historical 403 cannot be recovered from the screenshot alone.

The work branch now parses and surfaces Google's real API reason/message and provides actionable hints for known cases such as Drive API disabled, insufficient OAuth scope, rate limits, and storage quota. The exact production 403 cause must be confirmed by one live retry after this branch is merged and deployed. Do not guess it before observing the new diagnostic.

## Architecture decision

`drive.file` intentionally limits FlashUpload to files/folders created by or explicitly granted to the app. The production workspace therefore creates/uses a normal app-owned `FlashUpload` folder in the user's Drive. This preserves the narrow OAuth scope while giving the app real file-manager behavior. Whole-Drive visibility would require broader OAuth scopes and a different verification/security posture.

## Completed on `fix/drive-workspace-production`

- [x] Added root `AGENTS.md` and durable `.ai` continuation context/checkpoint system.
- [x] Added `src/lib/drive-api.ts` to parse Google API error payloads and provide actionable, non-secret diagnostics.
- [x] Updated resumable upload handling to surface Drive API error reasons and support a destination parent folder.
- [x] Added `src/lib/drive-files.ts` with Drive API operations for listing, metadata, folder creation, app-root creation, rename, move, trash/restore, permanent delete, folder discovery, and trash queries.
- [x] Extended resumable-session persistence so uploads remember their destination folder.
- [x] Added tests for Drive error parsing/hints and Drive file helpers; the CI test suite has passed 9/9 tests on the work branch.
- [x] Converted the authenticated dashboard into a real Drive workspace: app-root initialization, file/folder listing, breadcrumbs, create folder, current-folder upload destination, list/grid views, sorting, search, details, rename, move, trash, restore, permanent delete, Open in Drive, and link-copy actions.
- [x] Implemented working Settings and How-it-works surfaces; removed dead sidebar behavior.
- [x] Added functional Transfers and Trash navigation surfaces.
- [x] Integrated the redesigned FlashUpload identity into the site header/wordmark, favicon, web-app manifest, HTML title/metadata, Open Graph metadata, and README banner.
- [x] Added production brand SVG at `public/brand/flashupload-logo.svg` and synchronized the legacy favicon asset.
- [x] Added public `/privacy` and `/terms` pages with Vercel rewrites and visible homepage legal links.
- [x] Updated repository `PRIVACY.md`, added `TERMS.md`, and updated the README for the production Drive-workspace model and `flashupload.cassielae.me`.
- [x] Fixed the first CI build failure (`queryResumableStatus` inferred `number | undefined`). Subsequent branch CI runs have passed after that fix.
- [x] Opened draft PR #3 against `main`.

## Next actions — execute in this order

- [ ] Wait for/check CI on the current branch head; inspect logs and fix any new build/test errors.
- [ ] Review PR #3 diff/state, update PR description, and mark ready only after current-head CI is green.
- [ ] Merge PR #3 to `main` after green verification.
- [ ] Verify the post-merge `main` CI succeeds and Vercel deploys the production build.
- [ ] Live-test `https://flashupload.cassielae.me/privacy` and `/terms`, sign-in, Drive workspace initialization, folder creation/listing, and a real resumable upload.
- [ ] If 403 remains, record the exact new Google reason/message and fix the real Cloud/OAuth/API cause.
- [ ] Upload/use the 120×120 FlashUpload logo in Google OAuth Branding and finish Google production publishing/verification fields.
- [ ] Update this checkpoint with the live production result.

## Resume instruction

If the user says only **continue**, do not restart planning. Read `AGENTS.md`, `.ai/CHECKPOINT.md`, and `.ai/PROJECT_CONTEXT.md`, inspect the current branch/commits/PR/CI, then begin with the first unchecked action above that is not already completed by repository state.
