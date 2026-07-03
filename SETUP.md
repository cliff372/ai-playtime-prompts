# AI Playtime Prompt Library — Setup Guide

This site now has a login-protected editor so you can add and edit prompts
right on the website. The prompts live in a free Supabase database. This is a
one-time setup of about 10 minutes. After that, adding a weekly prompt is just:
open `/admin`, log in, fill the form, done.

---

## What you're setting up

- **Supabase** — a free hosted database + login system. It stores your prompts
  and handles your admin login. No server for you to run.
- Your public site reads prompts from Supabase.
- The `/admin` page lets *only you* add, edit, and delete prompts.
- Copy buttons quietly count how many times each prompt is copied.

You'll need to paste two values from Supabase into the `config.js` file. That's
the only code you touch.

---

## Step 1 — Create a Supabase project

1. Go to https://supabase.com and sign up (free — you can use your Google account).
2. Click **New project**.
3. Give it a name (e.g. `ai-playtime-prompts`), set a database password
   (save it in your password manager — you won't need it day-to-day), pick the
   region closest to you, and create the project.
4. Wait ~2 minutes for it to finish setting up.

## Step 2 — Create the database table

1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open the file `schema.sql` (included with your site files), copy ALL of it,
   and paste it into the query box.
3. Click **Run**. You should see "Success." This creates the prompts table, the
   security rules, the copy counter, and loads your 12 starter prompts.

## Step 3 — Create your login

1. Go to **Authentication** (left sidebar) → **Users** → **Add user** →
   **Create new user**.
2. Enter the email and a strong password you'll use to sign in to `/admin`.
   Check **Auto Confirm User** so you can log in right away. Click **Create**.
3. Recommended: go to **Authentication → Sign In / Providers** (or
   **Providers → Email**) and turn **OFF** "Allow new users to sign up." This
   makes sure nobody else can create an account — you'll still be able to log in.

## Step 4 — Connect your site to Supabase

1. In Supabase, go to **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL**.
3. Copy the **anon public** key (under "Project API keys").
   *(This key is safe to put in your site — it's designed to be public, and your
   data is protected by the security rules from Step 2.)*
4. Open `config.js` in your site files and paste them in:

   ```js
   SUPABASE_URL: "https://xxxxxxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGci...your-long-anon-key...",
   ```

5. Save the file.

## Step 5 — Try it

- Open `index.html` — you should see your 12 prompts loaded from the database.
- Open `admin.html`, sign in with the email/password from Step 3, and try
  editing a prompt or adding a new one. Refresh the main page to see it live.

> Note: for security reasons, browsers only allow the login to work over a real
> web address (`https://…`) or `http://localhost`, not by double-clicking the
> file. The public library page works either way, but to test the **admin
> login** locally, run a tiny local server in the site folder — for example:
> `python3 -m http.server` then open `http://localhost:8000/admin.html`.
> Once the site is deployed to a real host, this is a non-issue.

---

## Your weekly routine (after setup)

1. Go to `prompts.aiplaytime.ai/admin` (or wherever the site lives).
2. Log in (your browser will remember you, so usually you're already in).
3. Fill in Title, Category, Date, and the Prompt text → **Add prompt**.
4. It's live immediately. The newest date automatically gets the "New" badge.

That's it — no files, no redeploy.

---

## Notes

- **Categories**: type any category in the form. New ones appear as filter
  buttons automatically. To control the order of the buttons, edit the
  `CATEGORY_ORDER` list in `config.js`.
- **Copy counts**: shown in the admin list next to each prompt (e.g.
  "12 copies"). This is your "which prompts do people love" signal.
- **The old `prompts.js` file is no longer used** — everything comes from the
  database now. You can keep it as a backup of the original samples or delete it.
- **Deployment**: any free static host works (Netlify, Vercel, Cloudflare
  Pages). Upload the whole folder. Then point `prompts.aiplaytime.ai` at it with
  a DNS record. Ask me and I'll walk you through the exact host you pick.
