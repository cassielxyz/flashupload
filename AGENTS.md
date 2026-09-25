# FlashUpload Agent Continuation Contract

This repository is designed to survive chat/model/session interruptions.

## Mandatory resume sequence

Whenever the user says **continue**, **resume**, **pick up where you left off**, or similar:

1. Read `.ai/CHECKPOINT.md` first.
2. Read `.ai/PROJECT_CONTEXT.md` for the stable product requirements and architectural constraints.
3. Inspect the current Git branch, latest commits, open PRs/issues, and CI status before editing.
4. Never restart completed work or overwrite newer changes.
5. Continue from the first unchecked item in `.ai/CHECKPOINT.md` unless the repository state proves that item is already complete.
6. After every meaningful implementation batch, update `.ai/CHECKPOINT.md` with:
   - what was completed,
   - files/commits/PRs involved,
   - verification performed,
   - known failures,
   - the exact next action.
7. Before ending a long response or risky operation, update the checkpoint again so a timeout does not destroy state.

## Source of truth

Repository state wins over chat memory. If chat context and files disagree, inspect the code/commits and update the checkpoint to match reality before continuing.

## Safety rules

- Do not commit secrets, OAuth client secrets, access tokens, refresh tokens, or service-account credentials.
- `VITE_GOOGLE_CLIENT_ID` is a public OAuth client identifier and may be exposed in the browser; private credentials must never use a `VITE_` prefix.
- Preserve direct Browser -> Google Drive file transfer; do not introduce a FlashUpload relay server for file bytes without explicit approval.
- Keep light mode as the default and dark mode supported.
- Run tests and a production build before merging production changes.
