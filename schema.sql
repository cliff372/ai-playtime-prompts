-- =============================================================================
-- AI PLAYTIME PROMPT LIBRARY — SUPABASE DATABASE SETUP
-- =============================================================================
-- Run this ONCE in your Supabase project:
--   Supabase dashboard → SQL Editor → New query → paste all of this → Run.
-- It creates the prompts table, locks down who can change it, adds a safe
-- copy-counter, and loads the 12 starter prompts so the site isn't empty.
-- =============================================================================

-- 1. THE TABLE ---------------------------------------------------------------
create table if not exists public.prompts (
  id          bigint generated always as identity primary key,
  title       text    not null,
  body        text    not null,          -- the full prompt text
  category    text    not null,
  date        date    not null default current_date,
  copy_count  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Helpful index for the newest-first ordering the site uses.
create index if not exists prompts_date_idx on public.prompts (date desc, created_at desc);

-- 2. ROW LEVEL SECURITY ------------------------------------------------------
-- With RLS on, nothing is readable/writable unless a policy allows it.
alter table public.prompts enable row level security;

-- Anyone (logged in or not) may READ prompts — it's a public library.
drop policy if exists "public can read prompts" on public.prompts;
create policy "public can read prompts"
  on public.prompts for select
  to anon, authenticated
  using (true);

-- Only a logged-in user (you) may INSERT / UPDATE / DELETE.
drop policy if exists "authed can insert" on public.prompts;
create policy "authed can insert"
  on public.prompts for insert
  to authenticated
  with check (true);

drop policy if exists "authed can update" on public.prompts;
create policy "authed can update"
  on public.prompts for update
  to authenticated
  using (true) with check (true);

drop policy if exists "authed can delete" on public.prompts;
create policy "authed can delete"
  on public.prompts for delete
  to authenticated
  using (true);

-- 3. SAFE COPY COUNTER -------------------------------------------------------
-- The public must be able to bump copy_count when they hit "Copy", but they
-- must NOT be able to edit anything else. This function runs with elevated
-- rights (security definer) and does ONE thing: +1 to copy_count for one row.
create or replace function public.increment_copy_count(prompt_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.prompts set copy_count = copy_count + 1 where id = prompt_id;
$$;

grant execute on function public.increment_copy_count(bigint) to anon, authenticated;

-- 4. STARTER PROMPTS ---------------------------------------------------------
-- Delete or edit these later from the /admin editor. Safe to skip if you'd
-- rather start empty (just don't run this section).
insert into public.prompts (title, body, category, date) values
('The 5-Year-Old Explainer', 'Explain [complex topic] to me like I''m 5 years old. Use a silly analogy involving animals, keep it under 100 words, and end with one ''whoa, really?'' fact that would make a kid''s jaw drop.', 'Fun', '2026-07-01'),
('Inbox Zero in One Pass', 'I''m going to paste a batch of emails. For each one, tell me in a single line: (1) does it need a reply, (2) the one action it''s really asking for, and (3) a 2-sentence draft reply if one is needed. Be ruthless — flag anything I can safely ignore or archive.', 'Productivity', '2026-06-24'),
('The Ruthless First-Draft Editor', 'Here''s a paragraph I wrote. Cut it by 30% without losing meaning. Kill every filler word, passive construction, and hedge. Then show me the before and after side by side and tell me the single worst habit in my writing.', 'Writing', '2026-06-17'),
('Weekly Reset Ritual', 'Act as my accountability coach. Ask me one question at a time to help me review last week: what moved the needle, what I avoided, and what I''m pretending isn''t a priority. Then help me pick the THREE things that actually matter for next week and nothing else.', 'Goal-Setting', '2026-06-10'),
('Dinner From What''s In My Fridge', 'I''ll list what''s in my fridge and pantry. Give me 3 dinner options I can actually make tonight, ranked by how little effort they take. No grocery run allowed — work only with what I have. Include rough timing for each.', 'Fun', '2026-06-03'),
('The Meeting-to-Action Converter', 'I''ll paste messy meeting notes. Turn them into: (1) a 3-bullet summary anyone could skim, (2) a clean action list with owners and due dates where mentioned, and (3) any open questions that never got answered. Flag decisions that were made vs. things still up in the air.', 'Productivity', '2026-05-27'),
('Steal This Voice', 'Read the writing sample I paste below and describe its voice in a short ''style guide'': sentence rhythm, tone, vocabulary quirks, and what it avoids. Then rewrite my boring paragraph [paste it] in that exact voice.', 'Writing', '2026-05-20'),
('The Anti-Procrastination Unblocker', 'I''ve been avoiding [task] for days. Ask me 3 quick questions to find the real reason I''m stuck. Then break the task into the smallest possible first step — something I could finish in under 5 minutes — and tell me to go do it.', 'Productivity', '2026-05-13'),
('Choose-Your-Own-Adventure Bedtime Story', 'Write an interactive bedtime story for a [age]-year-old who loves [topic]. Stop at each decision point and give me 2 choices. Keep it gentle and cozy, and steer it toward a calm, sleepy ending after about 4 choices.', 'Fun', '2026-05-06'),
('The 90-Day Goal Reverse-Engineer', 'My goal is [goal] in 90 days. Work backwards: what has to be true at day 60, day 30, and day 7? Turn that into a week-by-week checklist. Then tell me the one thing most likely to derail me and how to protect against it.', 'Goal-Setting', '2026-04-29'),
('Cold Open Generator', 'Give me 5 completely different opening lines for a piece about [topic], each using a different hook: a bold claim, a surprising stat, a tiny story, a question, and a contrarian take. Make each one make me want to read the next sentence.', 'Writing', '2026-04-22'),
('The Decision Coin-Flip', 'I''m stuck between [option A] and [option B]. Don''t tell me what to pick. Instead, ask me the 4 questions that would actually clarify the decision, then reflect back what my answers reveal about what I really want.', 'Goal-Setting', '2026-04-15');
