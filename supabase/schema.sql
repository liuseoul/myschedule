-- ============================================================
-- myschedule — Complete database schema
-- Run this once in your Supabase project's SQL editor.
-- ============================================================

-- ── profiles: user info (Clerk IDs stored as TEXT) ───────────
CREATE TABLE profiles (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  role           TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  affiliation    TEXT DEFAULT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── groups: workspaces ────────────────────────────────────────
CREATE TABLE groups (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  firm_name_cn    TEXT NOT NULL DEFAULT '',
  firm_name_en    TEXT NOT NULL DEFAULT '',
  manager_name_cn TEXT NOT NULL DEFAULT '',
  manager_name_en TEXT NOT NULL DEFAULT '',
  subdomain       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX groups_subdomain_unique
  ON groups(subdomain) WHERE subdomain IS NOT NULL;

-- ── group_members: workspace membership ──────────────────────
CREATE TABLE group_members (
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id    TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member'
             CHECK (role IN ('first_admin', 'second_admin', 'member')),
  title      VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- ── reminders: schedule events ───────────────────────────────
CREATE TABLE reminders (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id         UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  due_date         DATE NOT NULL,
  start_date       DATE,
  end_date         DATE,
  start_time       TIME,
  end_time         TIME,
  content          TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'others'
                   CHECK (type IN (
                     'court_hearing',
                     'filing_deadline',
                     'consultation',
                     'statute_of_limitations',
                     'online_meeting',
                     'visiting',
                     'business_travel',
                     'personal_leave',
                     'visiting_reception',
                     'others'
                   )),
  assigned_to_name TEXT,
  pre_alert_days   INTEGER[] NOT NULL DEFAULT '{}',
  created_by       TEXT REFERENCES profiles(id) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  deleted          BOOLEAN DEFAULT FALSE,
  deleted_by       TEXT REFERENCES profiles(id),
  deleted_by_name  TEXT,
  deleted_at       TIMESTAMPTZ
);

-- ── user_keys: E2E encryption keypairs (one per user) ────────
CREATE TABLE user_keys (
  user_id               TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  public_key            TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── group_keys: E2E group symmetric keys (one per member) ────
CREATE TABLE group_keys (
  group_id         UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id          TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  admin_public_key TEXT NOT NULL,
  nonce            TEXT NOT NULL,
  encrypted_key    TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- ── Enable Row Level Security ─────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_keys     ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_keys    ENABLE ROW LEVEL SECURITY;

-- ── Open policies ─────────────────────────────────────────────
-- This app uses Clerk (not Supabase Auth), so auth.uid() is not
-- available on the client. Real access control is enforced
-- server-side (service role key + membership checks in page.tsx).
-- Reminder content is E2E encrypted — readable only by key holders.
CREATE POLICY "open" ON profiles      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON groups        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON reminders     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON user_keys     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open" ON group_keys    FOR ALL USING (true) WITH CHECK (true);
