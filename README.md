# Notevilla

Full-stack notes app with image uploads and LaTeX math rendering.

## Features
- Create, view, edit, and delete notes
- User accounts with login/logout
- Notes are visible to all logged-in users, but only the owner can edit or delete
- Optional image upload per note
- Markdown content with LaTeX math support
- Bold, italic, and underline formatting helpers
- Tags on notes with tag-based filtering
- Search by title/content/tags
- Date range filtering and sort by newest/oldest
- Rate limiting on API requests

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, DaisyUI
- Backend: Node.js, Express, MongoDB (Mongoose)
- Storage: Local uploads or S3
- Rate limit: Upstash Redis

## Project Structure
- backend/ - Express API and MongoDB models
- frontend/ - React client

## Setup

### 1) Backend

Create a .env file inside backend/:

```
MONGO_URI=your_mongodb_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
JWT_SECRET=your_long_random_secret
S3_UPLOADS=false
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name
AWS_S3_PUBLIC_BASE_URL=https://your-public-bucket-domain
PORT=5001
```

Install and run:

```
cd backend
npm install
npm run dev
```

The API will run on http://localhost:5001.

### 2) Frontend

Install and run:

```
cd frontend
npm install
npm run dev
```

The app will run on http://localhost:5173.

## Notes on Images
- Local uploads are stored in backend/uploads
- The API serves local images at /uploads/...
- To use S3, set `S3_UPLOADS=true` and configure the S3 env vars above

## Markdown and LaTeX
- Use standard Markdown for bold/italic
- Use <u>underline</u> for underline
- Use $...$ for inline math and $$...$$ for display math

Example:

```
Bold: **text**
Italic: *text*
Underline: <u>text</u>

Inline math: $x^2 + y^2$

Display math:
$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$
```

## API Routes
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/notes
- GET /api/notes/:id
- POST /api/notes (multipart form-data)
- PUT /api/notes/:id (multipart form-data)
- DELETE /api/notes/:id

## Auth Notes
- Auth uses a signed JWT stored in an httpOnly cookie
- The frontend sends cookies with `withCredentials: true`
- All authenticated users can read notes; only the owner can update/delete

## Test Plan
- Register a new user, then verify /api/auth/me returns the user
- Log out, confirm /api/auth/me returns 401
- Log in with the same user, confirm home shows the username
- Create a note as user A, ensure it shows for user B with the owner name
- Attempt to update/delete another user's note and confirm 403

## Python Tests
Backend integration tests live in backend/tests and hit a running API.

```
pip install -r backend/tests/requirements.txt
pytest backend/tests
```

Optional: override the API base URL

```
NOTEVILLA_API_BASE_URL=http://localhost:5001/api pytest backend/tests
```

## Scripts

Backend:
- npm run dev
- npm start

Frontend:
- npm run dev
- npm run build
- npm run preview
