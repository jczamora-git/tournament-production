const express = require("express");
const db = require("../db");

const router = express.Router();

// Public: submit a team (creates pending submission)
function getInsertedId(queryResult, client) {
  const [rowsOrResult, meta] = queryResult;

  if (client === "postgres") {
    return rowsOrResult?.[0]?.id ?? meta?.insertId ?? null;
  }

  return rowsOrResult?.insertId ?? null;
}

router.post("/", async (req, res) => {
  try {
    // Check global upload setting
    const [settingRows] = await db.query(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('team_upload_enabled', 'team_upload_closed_message')"
    );
    
    let isEnabled = true;
    let closedMessage = "Team registration and logo upload are now closed.";
    
    settingRows.forEach(row => {
      if (row.setting_key === "team_upload_enabled") {
        isEnabled = row.setting_value === "true";
      }
      if (row.setting_key === "team_upload_closed_message" && row.setting_value) {
        closedMessage = row.setting_value;
      }
    });

    if (!isEnabled) {
      return res.status(403).json({ message: closedMessage });
    }

    const { team_name, shortname, captain_name, contact, logo_url, notes, tournament_id, tournament_mode_id } = req.body;

    const normalizedTournamentId = Number(tournament_id);
    const normalizedModeId = Number(tournament_mode_id);

    const normalizedSubmission = {
      team_name: team_name?.trim(),
      shortname: shortname?.trim() || null,
      captain_name: captain_name?.trim(),
      contact: contact?.trim(),
      logo_url: logo_url?.trim() || null,
      notes: notes?.trim() || null,
    };

    if (!normalizedSubmission.team_name) {
      return res.status(400).json({ message: "Team name is required" });
    }
    if (!normalizedSubmission.captain_name) {
      return res.status(400).json({ message: "Captain name is required" });
    }
    if (!normalizedSubmission.contact) {
      return res.status(400).json({ message: "Contact is required" });
    }

    if (!Number.isInteger(normalizedTournamentId) || normalizedTournamentId <= 0) {
      return res.status(400).json({ message: "Please select a valid tournament." });
    }
    if (!Number.isInteger(normalizedModeId) || normalizedModeId <= 0) {
      return res.status(400).json({ message: "Please select a valid tournament mode." });
    }

    const [rows] = await db.query(
      `SELECT
        t.id AS tournament_id,
        t.name AS tournament_name,
        t.game_type,
        t.is_active AS tournament_is_active,
        tm.id AS tournament_mode_id,
        tm.name AS mode_name,
        tm.code AS mode_code,
        tm.is_active AS mode_is_active,
        tm.team_upload_enabled
      FROM tournaments t
      INNER JOIN tournament_modes tm ON tm.tournament_id = t.id
      WHERE t.id = ? AND tm.id = ?
      LIMIT 1`,
      [normalizedTournamentId, normalizedModeId]
    );

    if (!rows.length) {
      return res.status(400).json({ message: "Selected tournament or mode is invalid." });
    }

    const modeData = rows[0];

    const isDatabaseTrue = (value) => value === true || value === 1 || value === "1" || value === "true";

    if (!isDatabaseTrue(modeData.tournament_is_active)) {
      return res.status(403).json({ message: "This tournament is not currently active." });
    }
    if (!isDatabaseTrue(modeData.mode_is_active)) {
      return res.status(403).json({ message: "Team registration is closed for this mode." });
    }
    if (!isDatabaseTrue(modeData.team_upload_enabled)) {
      return res.status(403).json({ message: "Team registration is closed for the selected tournament mode." });
    }

    const insertSql =
      db.client === "postgres"
        ? "INSERT INTO team_submissions (team_name, shortname, captain_name, contact, logo_url, notes, status, tournament_id, tournament_mode_id) VALUES (?,?,?,?,?,?,?,?,?) RETURNING id"
        : "INSERT INTO team_submissions (team_name, shortname, captain_name, contact, logo_url, notes, status, tournament_id, tournament_mode_id) VALUES (?,?,?,?,?,?,?,?,?)";

    const insertResult = await db.query(insertSql, [
      normalizedSubmission.team_name,
      normalizedSubmission.shortname,
      normalizedSubmission.captain_name,
      normalizedSubmission.contact,
      normalizedSubmission.logo_url,
      normalizedSubmission.notes,
      "pending",
      normalizedTournamentId,
      normalizedModeId,
    ]);

    const submissionId = getInsertedId(insertResult, db.client);

    if (!submissionId) {
      throw new Error(`Team submission insert did not return an ID for ${db.client}.`);
    }

    res.status(201).json({
      success: true,
      message: "Team submitted successfully. Please wait for admin approval.",
      submission: {
        id: submissionId,
        team_name: normalizedSubmission.team_name,
        shortname: normalizedSubmission.shortname,
        captain_name: normalizedSubmission.captain_name,
        contact: normalizedSubmission.contact,
        logo_url: normalizedSubmission.logo_url,
        notes: normalizedSubmission.notes,
        status: "pending",
        tournament_id: normalizedTournamentId,
        tournament_mode_id: normalizedModeId,
        tournament_name: modeData.tournament_name,
        mode_name: modeData.mode_name,
        mode_code: modeData.mode_code
      }
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production";
    console.error("Failed to submit team", {
      client: db.client,
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
    });
    return res.status(500).json({
      message: "Failed to submit team",
      ...(!isProduction && {
        code: error.code || null,
        error: error.sqlMessage || error.message,
      }),
    });
  }
});

module.exports = router;
