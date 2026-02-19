# Deploying to Vercel

This guide explains how to deploy the Trading Journal app (Next.js frontend + FastAPI backend) to Vercel.

## Prerequisites

1.  A [Vercel account](https://vercel.com).
2.  A [GitHub account](https://github.com).
3.  A Postgres database (see below).

## Important: Database Configuration

Vercel's serverless functions are ephemeral, meaning **SQLite (the default database) will not work properly**. Your data will be reset on every deployment or cold start because the filesystem is not persistent.

**You MUST use a cloud Postgres database.**

### Recommended Database Options:
1.  **Vercel Postgres**: Easiest integration.
2.  **Supabase**: Free tier available.
3.  **Neon**: Free tier available.
4.  **Railway**: Postgres plugin.

### Getting a Connection String

Obtain a connection string that looks like this:
`postgresql+asyncpg://user:password@host:port/database`

Note: If your provider gives you `postgres://`, change it to `postgresql+asyncpg://` for SQLAlchemy compatibility.

## Deployment Steps

### Step 1: Push Code to GitHub

Ensure your latest code is pushed to your GitHub repository.

### Step 2: Import Project to Vercel

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `trading-journal` repository.
4.  **Framework Preset**: Select `Next.js`.
5.  **Root Directory**: Leave as `./` (Root).

### Step 3: Configure Environment Variables

In the "Environment Variables" section of the deployment screen, add the following variables:

| Variable Name | Value | Secret? |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `/api` (This routes requests to the backend function) | No |
| `SECRET_KEY` | generate_a_secure_random_string | Yes |
| `DATABASE_URL` | `postgresql+asyncpg://...` (Your Postgres connection string) | Yes |
| `ALGORITHM` | `HS256` | Yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Yes |

### Step 4: Deploy

Click **"Deploy"**. Vercel will build both the frontend and the backend.

- The frontend will be served at `https://your-project.vercel.app`.
- The backend API will be available at `https://your-project.vercel.app/api/...`.

## Troubleshooting

### "Module not found" errors
If you see errors about missing Python modules, ensure `backend/requirements.txt` includes them. We have already added `asyncpg` and `psycopg2-binary` for Postgres support.

### Database Connection Errors
- Check that your `DATABASE_URL` starts with `postgresql+asyncpg://`.
- Ensure your database allows external connections (0.0.0.0/0 whitelist may be needed for Vercel).

### CORS Issues
The backend is configured to allow `localhost` and `vibe.marketcalls.in`. You may need to add your Vercel domain to the `allow_origins` list in `backend/app/main.py` if you encounter CORS errors.

To do this, update `backend/app/main.py`:
```python
origins = [
    "http://localhost:3000",
    "https://your-project.vercel.app", # Add your Vercel domain
]
```
