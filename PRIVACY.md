# FlashUpload Privacy

Production policy: https://flashupload.cassielae.me/privacy

FlashUpload is designed so uploaded file content does not pass through a FlashUpload application server. When a user connects Google or starts an upload, the browser communicates directly with Google's Identity and Google Drive API endpoints.

## Google account and Drive data

- Basic connected-account information may include name, email address, and profile image for the signed-in UI.
- FlashUpload requests `https://www.googleapis.com/auth/drive.file`, not unrestricted whole-Drive access.
- The authenticated workspace manages files/folders created by FlashUpload or explicitly made available to it.
- A normal top-level `FlashUpload` folder is created for the app-owned workspace.

## Data handled in the browser

- A short-lived Google OAuth access token held in page memory and not intentionally persisted to localStorage.
- Local file metadata such as name, size, MIME type, and last-modified timestamp.
- Google Drive resumable-session metadata stored temporarily in IndexedDB, including the session URL, confirmed byte checkpoint, and destination folder identifier, so interrupted uploads can be resumed after the user reselects the same file.

Saved resumable-session records are removed after successful upload or explicit cancellation where practical. Treat resumable-session URLs as sensitive browser-local data.

## Upload route and sharing

Uploaded file bytes are sent directly from the browser to Google Drive API endpoints. Public “Anyone with the link” sharing is optional and disabled by default.

FlashUpload does not include first-party analytics, advertising trackers, or a first-party file-storage backend by default, and it does not sell file content or personal information.

See the public production policy for full details and user choices: https://flashupload.cassielae.me/privacy
