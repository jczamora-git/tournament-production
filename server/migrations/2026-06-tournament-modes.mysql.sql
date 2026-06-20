-- Migration: Add tournament_modes table and tournament/mode columns to teams, team_submissions, matches
-- Additive only — does not drop tables or columns
-- Safe to re-run (uses IF NOT EXISTS / conditional column adds)

-- 1. Create tournament_modes table
CREATE TABLE IF NOT EXISTS tournament_modes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  competition_type VARCHAR(50) NOT NULL DEFAULT 'head_to_head',
  team_upload_enabled BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tournament_mode (tournament_id, code)
);

-- 2. Add columns to teams (MySQL does not support IF NOT EXISTS on ALTER TABLE ADD COLUMN)
-- Use a procedure to safely add columns only if they don't exist

DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
  IN tbl VARCHAR(64),
  IN col VARCHAR(64),
  IN col_def VARCHAR(500)
)
BEGIN
  SET @col_exists = 0;
  SELECT COUNT(*) INTO @col_exists
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = tbl AND column_name = col;
  IF @col_exists = 0 THEN
    SET @ddl = CONCAT('ALTER TABLE ', tbl, ' ADD COLUMN ', col, ' ', col_def);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- teams: add tournament_id, tournament_mode_id
CALL add_column_if_not_exists('teams', 'tournament_id', 'INT DEFAULT NULL');
CALL add_column_if_not_exists('teams', 'tournament_mode_id', 'INT DEFAULT NULL');

-- team_submissions: add tournament_id, tournament_mode_id, approved_team_id
CALL add_column_if_not_exists('team_submissions', 'tournament_id', 'INT DEFAULT NULL');
CALL add_column_if_not_exists('team_submissions', 'tournament_mode_id', 'INT DEFAULT NULL');
CALL add_column_if_not_exists('team_submissions', 'approved_team_id', 'INT DEFAULT NULL');

-- matches: add tournament_id, tournament_mode_id
CALL add_column_if_not_exists('matches', 'tournament_id', 'INT DEFAULT NULL');
CALL add_column_if_not_exists('matches', 'tournament_mode_id', 'INT DEFAULT NULL');

-- Clean up procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- NOTE: Foreign key constraints for the new columns are defined in schema.mysql.sql
-- for fresh installs. For existing databases, you may optionally add them:
--
-- ALTER TABLE teams ADD FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;
-- ALTER TABLE teams ADD FOREIGN KEY (tournament_mode_id) REFERENCES tournament_modes(id) ON DELETE SET NULL;
-- ALTER TABLE team_submissions ADD FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;
-- ALTER TABLE team_submissions ADD FOREIGN KEY (tournament_mode_id) REFERENCES tournament_modes(id) ON DELETE SET NULL;
-- ALTER TABLE team_submissions ADD FOREIGN KEY (approved_team_id) REFERENCES teams(id) ON DELETE SET NULL;
-- ALTER TABLE matches ADD FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE SET NULL;
-- ALTER TABLE matches ADD FOREIGN KEY (tournament_mode_id) REFERENCES tournament_modes(id) ON DELETE SET NULL;

-- OPTIONAL: Manual legacy-data backfill
-- If you want to associate existing teams with a tournament/mode, run queries like:
--
-- UPDATE teams SET tournament_id = <ID>, tournament_mode_id = <MODE_ID> WHERE id = <TEAM_ID>;
--
-- Do NOT automatically assign legacy records by name matching.
-- Each legacy record should be manually reviewed and assigned by an admin.
