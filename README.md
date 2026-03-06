# Notevilla

Full-stack notes app with image uploads and LaTeX math rendering.

## Features
- Create, view, edit, and delete notes
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
- Storage: Local uploads folder (soon to be s3)
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
- Uploaded images are stored in backend/uploads
- The API serves them at /uploads/...

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
- GET /api/notes
- GET /api/notes/:id
- POST /api/notes (multipart form-data)
- PUT /api/notes/:id (multipart form-data)
- DELETE /api/notes/:id

## Scripts

Backend:
- npm run dev
- npm start

Frontend:
- npm run dev
- npm run build
- npm run preview
