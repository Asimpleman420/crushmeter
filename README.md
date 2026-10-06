# CrushMeter

CrushMeter is a mobile-first MERN app for creating a playful crush quiz without an account. A creator receives a public quiz link and a separate private dashboard link. Visitors explicitly consent before names are submitted, and scores are deterministic entertainment—not a measure of anyone's feelings.

## Requirements

- Node.js 20.19 or newer
- MongoDB locally or a MongoDB Atlas connection string

The existing `client` and `server` folders have separate package files. Use `npm install` inside each folder only when setting up a fresh checkout.

## Local configuration

Copy `server/.env.example` to `server/.env` and set:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/crushmeter
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
PUBLIC_APP_URL=http://localhost:5173
NODE_ENV=development
```

Copy `client/.env.example` to `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

`MONGODB_URI` belongs only on the backend. Never put database credentials in a `VITE_` variable because Vite embeds those values into the public browser bundle.

## Run locally

Open two terminals:

```powershell
cd server
npm run dev
```

```powershell
cd client
npm run dev
```

Visit `http://localhost:5173`. The frontend calls `http://localhost:5000` directly through `VITE_API_URL`; Vite does not proxy API traffic.

## Render backend

Create a Render Web Service from this repository using:

- **Root directory:** `server`
- **Build command:** `npm ci`
- **Start command:** `npm start`
- **Health check path:** `/api/health`

Set these Render environment variables:

```env
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app
PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

Do not manually set `PORT`; Render provides it. Express listens on `process.env.PORT` at `0.0.0.0`. `FRONTEND_ORIGIN` is the browser origin allowed by production CORS. `PUBLIC_APP_URL` must be the Vercel frontend origin because it generates the public quiz and private dashboard links.

The root `render.yaml` contains the equivalent Render Blueprint configuration.

## Vercel frontend

Import the same repository as a separate Vercel project using:

- **Root directory:** `client`
- **Framework preset:** Vite
- **Install command:** `npm install` (Vercel default)
- **Build command:** `npm run build`
- **Output directory:** `dist`

Set this Vercel environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com
```

Vite embeds `VITE_API_URL` during the build, so rebuild/redeploy after changing it. `client/vercel.json` rewrites frontend routes to `index.html`, making `/q/:publicId`, `/manage/:managementToken`, `/privacy`, and direct refreshes work.

A practical setup order is: create the Render service, create the Vercel project with the Render API URL, then update `FRONTEND_ORIGIN` and `PUBLIC_APP_URL` on Render to the final Vercel domain.

## Checks

```powershell
cd server
npm test
```

```powershell
cd client
npm run lint
npm run build
```

The server tests cover consent and name validation, normalized deterministic scores, public/private separation, authorization, quiz-scoped response deletion, and unavailable quiz handling.

## Data and security model

- Public quiz IDs and private management tokens are generated separately with cryptographically secure randomness.
- Only a SHA-256 hash of each management token is stored. The raw token is returned once in the dashboard URL.
- Private API calls use `Authorization: Bearer …`; tokens are never sent in API query strings.
- Quizzes and submissions expire after 30 days. Application queries enforce expiry immediately, while MongoDB TTL indexes remove expired records asynchronously.
- Creators can delete individual responses or the entire quiz from the dashboard.
- Created links are saved in that browser's `localStorage`; there is no account-based recovery.
- Names are not sent until the visitor checks the consent box and submits the form.

No deployment is included or performed.
