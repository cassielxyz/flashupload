# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security vulnerability. Use GitHub's private vulnerability reporting for this repository when available, or contact the repository owner privately.

## Security model

- Uploaded file bytes are sent directly from the user's browser to Google Drive API endpoints.
- The app does not require a server-side file relay or file storage service.
- Google OAuth access tokens are kept in page memory and are not written to localStorage.
- Only resumable-session metadata is kept in IndexedDB to allow a user to reselect the same local file and continue an interrupted session.
- The requested Drive permission is `drive.file`.
- Public link sharing is opt-in and disabled by default.

Treat a Google resumable-session URI as sensitive. FlashUpload removes saved session records after a successful upload or explicit cancellation.
