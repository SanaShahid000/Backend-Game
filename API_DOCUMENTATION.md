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
- Returns: `{ "status": 201, "message": "Verification code sent" }`

### POST `/auth/resend-code`
- Purpose: Resend the 6-digit email verification code to the user's email.
- Body: JSON `{ "email": "user1@example.com" }`
- Returns: `{ "status": 200, "message": "Verification code resent" }`

### POST `/auth/verify-email`
- Purpose: Verify user email using the 6-digit code sent at signup.
- Returns: `{ "status": 200, "message": "Email verified", "data": { "accessToken": "...", "profile": { ... } } }`

### POST `/auth/login`
- Purpose: Authenticate with email + password (requires email already verified).
- Returns: `{ "status": 200, "message": "Login successful", "data": { "accessToken": "...", "profile": { ... } } }`

## Upload (JWT Required)

### POST `/upload/single`
- Purpose: Upload one file to Google Cloud Storage (optional `folder` field).
- Returns: `{ "status": 200, "message": "File uploaded successfully", "data": { ... } }`

### POST `/upload/multiple`
- Purpose: Upload multiple files to Google Cloud Storage (max 10, optional `folder` field).
- Returns: `{ "status": 200, "message": "Files uploaded successfully", "data": [ ... ] }`

### POST `/upload/image`
- Purpose: Upload a single image file (must be `image/*`) to GCS under `images/`.
- Returns: `{ "status": 200, "message": "Image uploaded successfully", "data": { ... } }`

### DELETE `/upload/:fileName`
- Purpose: Delete a file from GCS by its stored name/path.
- Returns: `{ "status": 200, "message": "File deleted successfully" }`

## Profile (JWT Required)

### GET `/profile/me`
- Purpose: Get logged-in user profile summary.
- Returns: `{ "status": 200, "message": "Profile retrieved successfully", "data": { "username": "...", "profilePicture": "...", "country": "...", "carPresets": ["..."] } }`

### GET `/profile/me/presets`
- Purpose: Get all car presets for the logged-in user.
- Returns: `{ "status": 200, "message": "Presets retrieved successfully", "data": ["JSON string 1", "JSON string 2"] }`

### POST `/profile/me/presets`
- Purpose: Add a new car preset (as JSON object) to the user's list.
- Body: JSON `{ "preset": { "carPresetName": "...", ... } }`
- Returns: `{ "status": 200, "message": "Preset added successfully", "data": ["..."] }`

### GET `/profile/:userId`
- Purpose: Get a user's profile by their userId.
- Returns: `{ "status": 200, "message": "Profile retrieved successfully", "data": { "username": "...", "profilePicture": "...", "country": "...", "carPresets": [{...}] } }`

### PATCH `/profile/me`
- Purpose: Update logged-in user's `carDetails` / `profilePicture` / `country`.
- Returns: `{ "status": 200, "message": "Profile updated successfully", "data": { "username": "...", "profilePicture": "...", "country": "...", "carPresets": [{...}] } }`

### PATCH `/profile/me/country`
- Purpose: Update logged-in user's `country`.
- Returns: `{ "status": 200, "message": "Country updated successfully", "data": { "username": "...", "profilePicture": "...", "country": "...", "carPresets": [{...}] } }`

### DELETE `/profile/me`
- Purpose: Permanently delete the logged-in user's account and profile.
- Returns: `{ "status": 200, "message": "Account deleted successfully" }`
