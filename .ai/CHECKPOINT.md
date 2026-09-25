# FlashUpload — Live Checkpoint

Last updated: 2026-09-26
Active work branch: `fix/drive-workspace-production`
Base/main observed before this work: `f6339efa4a84de42c5755dfcd86cd60788bc40fd`

## Current user-visible failures

- Upload attempt for `chatgpt magazine.zip.001` failed immediately at 0% with `Could not start the Drive upload (403).`
- Sidebar `Settings` and `How it works` entries are currently visual-only; they have no actual actions.
- Authenticated product is still primarily an upload queue, not the requested Drive-like workspace.
- Missing real Drive file/folder capabilities: folder listing/navigation, create folder, rename, move, delete/trash, refresh/search integration, and related file-manager actions.
- Brand/logo refresh was requested and generated, but integration into repo/site/README/favicon/manifest was interrupted before completion.

## Important diagnosis from current code

`src/lib/drive-upload.ts` starts a resumable session with `POST https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable...`, but on failure it discards Google's response body and only throws the HTTP status. Therefore the current 403 message is not sufficient to determine whether the cause is Drive API enablement, token/scope state, OAuth configuration, or another Drive policy/API error.

`src/components/dashboard.tsx` defines Settings and How it works as plain sidebar buttons without handlers/routes. This is a real implementation gap, not merely a UI bug.

## Completed during this checkpoint-system pass

- Added root `AGENTS.md` with mandatory resume/continuation behavior.
- Added `.ai/PROJECT_CONTEXT.md` containing durable product, architecture, UI, OAuth, and file-manager requirements.
- Added this `.ai/CHECKPOINT.md` so future ChatGPT/agents can resume from repository state after timeouts.

## Next actions — execute in this order

- [ ] Improve Google Drive API error handling first: parse and display Google's error payload/reason for resumable-session failures, while avoiding token leakage.
- [ ] Reproduce/diagnose the 403 using the improved error path; fix the actual auth/API/configuration issue rather than guessing.
- [ ] Add Drive file/folder service functions and types for listing, folder creation, rename, move, trash/delete, metadata, and refresh/search.
- [ ] Convert authenticated dashboard into a real Drive workspace with file/folder listing, breadcrumbs, create-folder, current-folder upload destination, contextual actions, and working refresh/search.
- [ ] Implement functional Settings and How-it-works surfaces; remove any dead navigation.
- [ ] Finish brand integration: new logo in site header, favicon/app icons/manifest, HTML metadata/title identity, README/banner/assets, and OAuth-ready logo asset.
- [ ] Add public `/privacy` and `/terms` routes/pages suitable for Google OAuth production branding, with footer links.
- [ ] Add/extend tests for Drive error parsing and file/folder operations.
- [ ] Run typecheck/tests/production build; fix all failures.
- [ ] Open PR, wait for CI, review diff, merge only after green verification.
- [ ] Update this file after each meaningful batch and set the next unchecked item precisely.

## Resume instruction

If the user says only **continue**, do not restart planning. Read `AGENTS.md`, `.ai/CHECKPOINT.md`, and `.ai/PROJECT_CONTEXT.md`, inspect the current branch/commits/PR/CI, then begin with the first unchecked action above that is not already completed by repository state.
