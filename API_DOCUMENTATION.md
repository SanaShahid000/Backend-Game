# API Documentation (2 lines each)

Base URL (local): `http://localhost:3000`  
Auth: Upload routes require header `Authorization: Bearer <accessToken>`
Email: Uses SendGrid when `SENDGRID_API_KEY` is set (optional `REQUIRE_SENDGRID=true` to enforce).
GCS Upload: Requires Google credentials via `GOOGLE_APPLICATION_CREDENTIALS` (service-account JSON).

## Health

### GET `/`
- Purpose: Quick server health check / test route.
- Returns: Plain text response (`Hello World!`).

## Auth

### POST `/auth/signup`
- Purpose: Create a new user and auto-create their profile.
- Also: Generates a 6-digit email verification code and sends it (in dev can be logged if enabled).

### POST `/auth/verify-email`
- Purpose: Verify user email using the 6-digit code sent at signup.
- Returns: Marks user as verified so login is allowed.

### POST `/auth/login`
- Purpose: Authenticate with email + password (requires email already verified).
- Returns: `accessToken` (JWT) + `profile` (userId + username + profilePicture).

## Upload (JWT Required)

### POST `/upload/single`
- Purpose: Upload one file to Google Cloud Storage (optional `folder` field).
- Body: `multipart/form-data` with `file` (and optional `folder` text).

### POST `/upload/multiple`
- Purpose: Upload multiple files to Google Cloud Storage (max 10, optional `folder` field).
- Body: `multipart/form-data` with `files` (and optional `folder` text).

### POST `/upload/image`
- Purpose: Upload a single image file (must be `image/*`) to GCS under `images/`.
- Body: `multipart/form-data` with `image`.

### DELETE `/upload/:fileName`
- Purpose: Delete a file from GCS by its stored name/path.
- Tip: If `fileName` contains `/`, URL-encode it as `%2F` in the path.

## Profile (JWT Required)

### GET `/profile/me`
- Purpose: Get logged-in user profile summary.
- Returns: `username` + `carDetails` + `profilePicture` + `country`.

### GET `/profile/:userId`
- Purpose: Get a user's profile by their userId.
- Returns: `username` + `carDetails` + `profilePicture` + `country`.

### PATCH `/profile/me`
- Purpose: Update logged-in user's `carDetails` / `profilePicture` / `country` (creates profile if missing).
- Body: JSON `{ "carDetails"?: { ... }, "profilePicture"?: "https://...", "country"?: "Pakistan" }`

### PATCH `/profile/me/country`
- Purpose: Update logged-in user's `country`.
- Body: JSON `{ "country": "Pakistan" }`
