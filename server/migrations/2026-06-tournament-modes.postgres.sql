-- Migration: Add tournament_modes table and tournament/mode columns to teams, team_submissions, matches
-- Additive only — does not drop tables or columns
-- Safe to re-run (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- 1. Create tournament_modes table
CREATE TABLE IF NOT EXISTS tournament_modes (
  id SERIAL PRIMARY KEY,
  tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  competition_type VARCHAR(50) NOT NULL DEFAULT 'head_to_head',
  team_upload_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tournament_id, code)
);

-- 2. Add columns to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_id INTEGER DEFAULT NULL REFERENCES tournaments(id) ON DELETE SET NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS tournament_mode_id INTEGER DEFAULT NULL REFERENCES tournament_modes(id) ON DELETE SET NULL;

-- 3. Add columns to team_submissions
ALTER TABLE team_submissions ADD COLUMN IF NOT EXISTS tournament_id INTEGER DEFAULT NULL REFERENCES tournaments(id) ON DELETE SET NULL;
ALTER TABLE team_submissions ADD COLUMN IF NOT EXISTS tournament_mode_id INTEGER DEFAULT NULL REFERENCES tournament_modes(id) ON DELETE SET NULL;
ALTER TABLE team_submissions ADD COLUMN IF NOT EXISTS approved_team_id INTEGER DEFAULT NULL REFERENCES teams(id) ON DELETE SET NULL;

-- 4. Add columns to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_id INTEGER DEFAULT NULL REFERENCES tournaments(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS tournament_mode_id INTEGER DEFAULT NULL REFERENCES tournament_modes(id) ON DELETE SET NULL;

-- OPTIONAL: Manual legacy-data backfill
-- If you want to associate existing teams with a tournament/mode, run queries like:
--
-- UPDATE teams SET tournament_id = <ID>, tournament_mode_id = <MODE_ID> WHERE id = <TEAM_ID>;
--
-- Do NOT automatically assign legacy records by name matching.
-- Each legacy record should be manually reviewed and assigned by an admin.
