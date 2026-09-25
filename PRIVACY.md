# Privacy

FlashUpload is designed so file content does not pass through a FlashUpload application server. When a user starts an upload, the browser communicates directly with Google's OAuth and Google Drive API endpoints.

## Data handled in the browser

- Google account name, email address, and profile image for the signed-in UI.
- A short-lived Google OAuth access token held in memory.
- Local file metadata such as name, size, MIME type, and last-modified timestamp.
- Google Drive resumable-session metadata stored temporarily in IndexedDB so interrupted uploads can be resumed after the user reselects the same file.

FlashUpload does not include analytics, advertising trackers, or a first-party backend by default.
