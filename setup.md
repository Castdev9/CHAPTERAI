# ChapterAI — Vercel Deployment Guide

## Prerequisites

- [Vercel account](https://vercel.com)
- [Supabase project](https://supabase.com)
- [OpenRouter account](https://openrouter.ai)
- GitHub repository connected to Vercel

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **API Keys** from Settings → API

### 1.2 Get Database Connection Strings

Go to **Settings → Database → Connection string**:

- **Transaction mode** (port 6543, pgbouncer=true) → this is your `DATABASE_URL`
- **Session mode** (port 5432) → this is your `DIRECT_URL`

### 1.3 Set Up Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket named **`uploads`**
3. Set it to **Public**
4. Go to **SQL Editor** and run:

```sql
-- INSERT: Allow public uploads
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'uploads'
  AND storage.foldername(name)[1] IS NOT NULL
  AND storage.foldername(name)[2] IS NOT NULL
);

-- SELECT: Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'uploads');

-- DELETE: Allow deletes
CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
USING (bucket_id = 'uploads');
```

---

## Step 2: OpenRouter Setup

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up / log in
3. Go to **Keys** → Create a new API key
4. Copy the key (starts with `sk-or-v1-...`)
5. Add credits to your account (AI features require credits)

---

## Step 3: Vercel Deployment

### 3.1 Import Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository (`Castdev9/CHAPTERAI` or `Alphcast/CHAPTERAI`)
3. Click **Import**

### 3.2 Configure Build Settings

Vercel auto-detects Next.js. Verify these settings:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Build Command | `pnpm build` |
| Output Directory | `.next` |
| Install Command | `pnpm install` |
| Node.js Version | 18+ (default) |

### 3.3 Set Environment Variables

Go to **Settings → Environment Variables** and add:

#### Required

| Variable | Value | Where to find |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | Supabase → Settings → Database → Connection string → Transaction mode |
| `DIRECT_URL` | `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require` | Supabase → Settings → Database → Connection string → Session mode |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT_REF].supabase.co` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase → Settings → API → service_role (secret!) |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` | OpenRouter → Keys |

#### Optional

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

> **Important:** Set all variables for **Production**, **Preview**, and **Development** environments.

### 3.4 Deploy

Click **Deploy**. Vercel will:

1. Install dependencies with `pnpm install`
2. Run `postinstall` → `prisma generate`
3. Run `build` → `prisma generate && next build`

---

## Step 4: Push Database Schema

After first deploy, push the Prisma schema to your Supabase database:

### Option A: From local machine

```bash
# Set your Supabase connection strings in .env locally, then:
npx prisma db push
```

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull env vars
vercel env pull .env.local

# Push schema
npx prisma db push
```

### Option C: Via Vercel Shell

1. Go to your project on vercel.com
2. Go to **Deployments** → click latest → **Shell**
3. Run:

```bash
npx prisma db push
```

---

## Step 5: Verify Deployment

1. Visit `https://your-app.vercel.app`
2. Create a new research project
3. Test AI chat on Chapter 1
4. Upload a file and test Chapter 4 analysis
5. Test export (PDF, DOCX, HTML)

---

## Environment Variables Reference

```
# ── Database (Supabase PostgreSQL) ──────────────────────
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# ── Supabase ────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"

# ── AI ──────────────────────────────────────────────────
OPENROUTER_API_KEY="sk-or-v1-..."

# ── App ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

---

## Troubleshooting

### Build fails with Prisma error

- Ensure `DATABASE_URL` is set before the build runs
- The `postinstall` script runs `prisma generate` automatically
- If pooler connection fails, try `sslmode=require` in your `DATABASE_URL`

### AI features not working

- Verify `OPENROUTER_API_KEY` is set (not `OPENAI_API_KEY`)
- Check you have credits on OpenRouter
- AI routes use `runtime = "nodejs"` (not Edge)

### File uploads failing

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Ensure the `uploads` bucket exists in Supabase Storage and is public
- Run the SQL policies from Step 1.3

### Database connection limits

- Vercel serverless functions create a new connection per invocation
- The pooler connection (port 6543) handles this automatically
- If you hit limits, upgrade your Supabase plan or add connection pooling

### Streaming not working

- Ensure your Vercel plan supports the function duration needed
- AI streaming responses use `text/event-stream` — this works on all Vercel plans

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Vercel     │────▶│  Supabase    │────▶│  OpenRouter     │
│  (Next.js)   │     │  (PostgreSQL │     │  (GPT-4o/mini)  │
│              │     │   + Storage) │     │                 │
└─────────────┘     └──────────────┘     └─────────────────┘
```

- **Vercel** — Hosts the Next.js app (API routes + frontend)
- **Supabase** — PostgreSQL database + file storage (uploads bucket)
- **OpenRouter** — AI model proxy (routes to OpenAI GPT-4o/mini)
