# FlashUpload — Live Checkpoint

Last updated: 2026-09-26
Active work branch: `fix/drive-workspace-production`
Base/main observed before this work: `f6339efa4a84de42c5755dfcd86cd60788bc40fd`

## Current user-visible failures

- Upload attempt for `chatgpt magazine.zip.001` failed immediately at 0% with `Could not start the Drive upload (403).`
- Sidebar `Settings` and `How it works` entries are currently visual-only; they have no actual actions.
- Authenticated product is still primarily an upload queue, not the requested Drive-like workspace.
- Missing real Drive file/folder capabilities in UI: folder listing/navigation, create folder, rename, move, delete/trash, refresh/search integration, and related file-manager actions.
- Brand/logo refresh was requested and generated, but integration into repo/site/README/favicon/manifest was interrupted before completion.

## Important diagnosis from current code

The previous uploader discarded Google's 403 response payload and only displayed the status code. This has now been fixed on the work branch: Drive error responses are parsed, reasons/messages are surfaced safely, and known causes such as a disabled Drive API or insufficient OAuth scope receive actionable hints without exposing tokens.

The exact production 403 cause still needs one live retry after deployment of this branch because the original failed request did not preserve Google's response body. Do not guess the cause before the new diagnostic message is observed.

`drive.file` intentionally limits FlashUpload to files/folders created by or explicitly granted to the app. The production workspace should therefore manage an app-owned `FlashUpload` folder by default, preserving the narrow scope; broader whole-Drive visibility would require broader OAuth scopes and a different verification/security posture.

## Completed during this continuation

- [x] Added root `AGENTS.md` and durable `.ai` continuation context/checkpoint system.
- [x] Added `src/lib/drive-api.ts` to parse Google API error payloads and provide actionable, non-secret diagnostics.
- [x] Updated resumable upload handling to surface Drive API error reasons and support a destination parent folder.
- [x] Added `src/lib/drive-files.ts` with working Drive API operations for listing, metadata, folder creation, app-root creation, rename, move, trash/restore, and permanent delete.
- [x] Extended resumable-session persistence so uploads remember their destination folder.
- [x] Added tests for Drive error parsing/hints and Drive file helper behavior.

## Next actions — execute in this order

- [ ] Reproduce/diagnose the original 403 using the improved deployed error path; fix the actual auth/API/configuration issue rather than guessing.
- [ ] Convert authenticated dashboard into a real app-owned Drive workspace: initialize/find the `FlashUpload` root folder, list files/folders, breadcrumbs, create-folder, current-folder upload destination, contextual rename/move/trash/open actions, and working refresh/search.
- [ ] Implement functional Settings and How-it-works surfaces; remove any dead navigation.
- [ ] Finish brand integration: new logo in site header, favicon/app icons/manifest, HTML metadata/title identity, README/banner/assets, and OAuth-ready logo asset.
- [ ] Add public `/privacy` and `/terms` routes/pages suitable for Google OAuth production branding, with footer links.
- [ ] Add/extend tests for Drive file/folder operations and workspace state.
- [ ] Run typecheck/tests/production build; fix all failures.
- [ ] Open PR, wait for CI, review diff, merge only after green verification.
- [ ] After merge/deploy, retry a real upload and record the exact 403 diagnostic/result here.

## Resume instruction

If the user says only **continue**, do not restart planning. Read `AGENTS.md`, `.ai/CHECKPOINT.md`, and `.ai/PROJECT_CONTEXT.md`, inspect the current branch/commits/PR/CI, then begin with the first unchecked action above that is not already completed by repository state.
