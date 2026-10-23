# Game Trail — Game In My Style

A full-stack coding game platform where players learn HTML, CSS, JavaScript, Python, and Java through server-reviewed coding challenges. It includes a real-time multiplayer Computer Mode powered by WebSockets. The current catalog has 165 HTML lessons and 145 lessons in each other course; the 1,000-per-course target is still being authored and reviewed.

Creating a Computer Mode or Custom Mode room costs **1 G-THUNDER**. The creator is charged as soon as the room is successfully created; the fee is not refunded if they leave or do not play. Joining someone else's room is free.

Competitive features include global Computer Mode, Levels Mode, and Human-v-Human leaderboards, a 90-day tournament season, and Bug Hunter Arena. XP rewards (daily claims, levels, and Bug Hunter) do not change RP or rank. Tournament wins award RP; losses, draws, and timeouts do not remove or grant RP. Tournament and XP changes are written to a separate reward ledger.

## Tech Stack

- **Frontend** — React 19, Vite, Tailwind CSS, Framer Motion, Socket.IO Client
- **Backend** — Node.js, Express, MongoDB (Atlas), Socket.IO, Groq AI API
- **Auth** — JWT + bcrypt, email-based password reset via Gmail

## Project Structure

```
game-trail/
├── frontend/        # React app (deploy to Vercel)
├── backend/         # Express API + WebSocket server (deploy to Render)
├── runner/          # Private resource-limited JavaScript, Python, and Java execution service
└── shared/          # Rank tiers and curriculum limits shared by frontend and backend
```

## Local Development

**Backend**
```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # runs on http://localhost:3000
```

**Frontend**
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:3000/api
npm install
npm run dev            # runs on http://localhost:5173
```

When changing lesson data under `frontend/src/config`, run `npm run export:curriculum` from `frontend` to update the server-owned lesson catalog used for validation and reward proofs.

Tournament seasons use `TOURNAMENT_SEASON_DAYS` (default 90, limited to 60–120) and `TOURNAMENT_RP_CARRYOVER` (default 0.5). Season 0 is created on backend startup if no active season exists. MongoDB transactions are used for claims, level rewards, XP conversion, tournament results, and season rollover, so the configured database must support transactions (MongoDB Atlas or a replica set; a standalone `mongod` does not).

Bug Hunter challenges are curated source repairs. Challenge solutions and unrevealed hints stay on the server. Submitted code is compared to a canonical repair and is **not executed**. Tournament matches use the same safe repair checker. The Levels editor has a separate **Run Code** action for JavaScript, Python, and Java. Runtime output does not validate a lesson or award XP. The runner is a separate service and stays unavailable until deployed and connected; source review never means program execution.

### Isolated code runner

The runner is a private HTTP service. It launches each JavaScript, Python, or Java submission in a fresh container with no network, a read-only root filesystem, limited CPU, memory and processes, bounded input/output, a short timeout, and container cleanup. It requires Docker configured with the **gVisor `runsc` runtime** and a dedicated rootless Docker daemon. Use a separate host or VM for the runner and reach it from the API over a private network or VPN. Access to a Docker daemon is powerful; do not share a rootful host daemon with the public API.

Build the execution image on that host before starting the runner. Each container launch uses `--pull=never`, so the runner will not fetch an image from a registry during a learner request:

```bash
docker build -t game-trail-execution:1 runner/execution
```

Set `RUNNER_SHARED_SECRET` to a random value of at least 32 bytes. Set `RUNNER_HOST` to the private interface address, `RUNNER_PORT` to a private port, and keep `RUNNER_DOCKER_RUNTIME=runsc`. Run `node runner/server.js` as a managed service. Set `CODE_RUNNER_URL` and the same `CODE_RUNNER_SECRET` on the backend. The runner binds to `127.0.0.1` by default and rejects requests without the shared bearer secret. If the runner is not configured, Run Code reports that it is unavailable; lesson validation and rewards remain separate.

Before enabling it for players, verify the configured Docker runtime is `runsc`, run the runner tests, and exercise each language in a disposable environment. Runtime results are feedback only; level, tournament, and Bug Hunter rewards must continue to use server-owned validation.

## Tests

Run `npm test` from the project root to execute runner boundary checks, backend security/progression checks, and frontend curriculum/timer checks. The production frontend bundle can be built with `npm run build`.

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `PORT` | Server port (default 3000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `GMAIL_USER` | Gmail address for sending emails |
| `GMAIL_PASS` | Gmail app password |
| `EMAIL_FROM` | From address for emails |
| `FRONTEND_URL` | Your frontend URL (for CORS) |
| `ALLOWED_ORIGINS` | Optional comma-separated extra frontend origins, such as approved preview deployments |
| `TOURNAMENT_SEASON_DAYS` | Competitive season length (default 90 days; allowed range 60–120) |
| `TOURNAMENT_RP_CARRYOVER` | Fraction of RP retained at season rollover (default `0.5`; allowed range 0–1) |
| `GROQ_API_KEYS` | Comma-separated Groq API keys — `gsk_key1,gsk_key2,...` |
| `CODE_RUNNER_URL` | Optional private base URL for the isolated runner, such as `http://10.0.0.8:3010` |
| `CODE_RUNNER_SECRET` | Optional bearer secret shared with the private runner (at least 32 bytes) |

The backend accepts requests from `FRONTEND_URL` and `ALLOWED_ORIGINS`. Local Vite origins are also allowed outside production. Socket.IO uses JWT authentication; the browser stores the same login token used by the API.

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL — `https://your-backend.onrender.com/api` |

## Deployment

- **Backend** → [Render](https://render.com) (Web Service, root dir: `backend`)
- **Frontend** → [Vercel](https://vercel.com) (root dir: `frontend`, framework: Vite)
