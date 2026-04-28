# FitTrack

FitTrack is a full-stack fitness tracker for logging workouts, organizing training plans, and tracking body metrics over time. The app pairs a mobile-friendly Next.js frontend with an ASP.NET Core API backed by SQLite, with each user's workouts, plans, settings, and custom exercises kept separate.

## Features

- Account registration, login, logout, and onboarding
- Dashboard with today's scheduled plan, current weight, and last workout summary
- Workout logging with active sessions, searchable exercises, and per-exercise set numbering
- Exercise library with seeded defaults plus user-created custom exercises
- Plan builder with color-coded plans and weekday scheduling
- Weight history tracking with editable unit preferences
- Height storage and metric/imperial display toggles
- Cookie-based authentication and per-user data isolation

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- UI: custom components in a shadcn-style structure
- Backend: ASP.NET Core, Entity Framework Core, SQLite
- Auth: ASP.NET Core cookie authentication
- Data bootstrapping: automatic migrations on startup plus exercise seed data

## Repo Layout

```text
fitnessTracker/
|- client/                  # Next.js frontend
|- server/                  # ASP.NET Core API
|- fitnessTracker.sln       # .NET solution
\- README.md
```

## Main App Areas

- `/login` and `/register` handle authentication
- `/onboarding` captures display name and optional starting weight
- `/dashboard` shows today's plan, current weight, and recent workout history
- `/workout` starts or resumes an active workout session and logs sets
- `/exercises` browses seeded exercises and creates custom ones
- `/plans` creates plans, assigns exercises, and maps plans to weekdays
- `/metrics` stores weight history and unit preferences

## Local Development

### Prerequisites

- .NET 10 SDK
- A recent Node.js LTS release with `npm`

### 1. Start the API

From the repository root:

```powershell
dotnet run --project .\server\server.csproj
```

The API runs on `http://localhost:5211` by default.

On first startup the server will:

- apply Entity Framework migrations automatically
- create the SQLite database if it does not exist
- seed the default exercise catalog when the `Exercises` table is empty

### 2. Start the frontend

In a second terminal:

```powershell
Set-Location .\client
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Configuration

### Frontend

The client defaults to `http://localhost:5211` for API requests. If your API is running elsewhere, create `client/.env.local`:

```env
API_URL=http://localhost:5211
```

That value is used by:

- Next.js rewrites for `/api/*`
- server-side fetches from React Server Components

### Backend

The API reads its database location from `FitTrack:DbPath`. You can override it with an environment variable:

```powershell
$env:FitTrack__DbPath="C:\path\to\fittrack.db"
dotnet run --project .\server\server.csproj
```

If you do not set it, the app uses `fittrack.db`.

## Docker

You can run the full app with Docker Compose from the repository root:

```powershell
docker compose up --build
```

This starts:

- the frontend at `http://localhost:3200`
- the backend at `http://localhost:9111`

The SQLite database is stored in a named Docker volume so it persists across container restarts.

## Useful Commands

```powershell
# Build the .NET solution
dotnet build .\fitnessTracker.sln

# Lint the frontend
Set-Location .\client
npm run lint
```

## API Overview

Most routes live under `api/v1`:

- `auth` for register, login, logout, current-user lookup, and onboarding completion
- `dashboard` for dashboard summary data
- `workouts` for sessions and logged sets
- `exercises` for exercise catalog and custom exercise creation
- `plans` for workout plan CRUD and plan exercises
- `schedule` for weekly plan assignment
- `metrics` for body-weight history
- `settings` for weight and height preferences

## Notes

- Protected pages are gated in the Next.js app and backed by authenticated API endpoints.
- Workouts, metrics, settings, plans, schedules, and custom exercises are all scoped to the signed-in user.
- The frontend currently includes ESLint configuration; there is not yet a checked-in automated test suite.
