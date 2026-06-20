const express = require("express");
const db = require("../db");

const router = express.Router();

// Valid mode codes per game type
const GAME_MODE_MAP = {
  MLBB: {
    MOBA: { name: "MOBA", competition_type: "head_to_head" },
    MAGIC_CHESS: { name: "Magic Chess", competition_type: "free_for_all" },
  },
  HOK: {
    MOBA: { name: "MOBA", competition_type: "head_to_head" },
  },
  CODM: {
    MP: { name: "Multiplayer", competition_type: "head_to_head" },
    BR: { name: "Battle Royale", competition_type: "battle_royale" },
  },
};

function validateModesForGame(game_type, modes) {
  if (!modes || !Array.isArray(modes) || modes.length === 0) {
    return "At least one mode is required.";
  }

  if (game_type === "OTHER") {
    for (const m of modes) {
      if (!m.code || !m.code.trim()) return "Each custom mode must have a code.";
      if (!m.name || !m.name.trim()) return "Each custom mode must have a name.";
      const validTypes = ["head_to_head", "battle_royale", "free_for_all"];
      if (m.competition_type && !validTypes.includes(m.competition_type)) {
        return `Invalid competition type: ${m.competition_type}`;
      }
    }
    return null;
  }

  const allowed = GAME_MODE_MAP[game_type];
  if (!allowed) return `Unknown game type: ${game_type}`;

  for (const m of modes) {
    if (!allowed[m.code]) {
      return `Invalid mode "${m.code}" for game type "${game_type}". Allowed: ${Object.keys(allowed).join(", ")}`;
    }
  }

  return null;
}

function normalizeModes(game_type, modes) {
  return modes.map((m, i) => {
    const code = m.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
    if (game_type !== "OTHER") {
      const def = GAME_MODE_MAP[game_type][code];
      return {
        code,
        name: def.name,
        competition_type: def.competition_type,
        team_upload_enabled: m.team_upload_enabled !== false,
        is_active: m.is_active !== false,
        sort_order: m.sort_order ?? i,
      };
    }
    return {
      code,
      name: m.name?.trim() || code,
      competition_type: m.competition_type || "head_to_head",
      team_upload_enabled: m.team_upload_enabled !== false,
      is_active: m.is_active !== false,
      sort_order: m.sort_order ?? i,
    };
  });
}

function getInsertedId(queryResult, client) {
  const [rowsOrResult, meta] = queryResult;

  if (client === "postgres") {
    return rowsOrResult?.[0]?.id ?? meta?.insertId ?? null;
  }

  return rowsOrResult?.insertId ?? null;
}

// GET all tournaments with their modes (admin)
router.get("/", async (req, res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0"
  });

  try {
    const [tournaments] = await db.query("SELECT * FROM tournaments ORDER BY created_at DESC");

    if (tournaments.length === 0) {
      return res.json([]);
    }

    // Fetch all modes in one query to avoid N+1
    const tournamentIds = tournaments.map((t) => t.id);
    let modesQuery, modesParams;

    if (db.client === "postgres") {
      const placeholders = tournamentIds.map((_, i) => `$${i + 1}`).join(", ");
      modesQuery = `SELECT * FROM tournament_modes WHERE tournament_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`;
      modesParams = tournamentIds;
    } else {
      const placeholders = tournamentIds.map(() => "?").join(", ");
      modesQuery = `SELECT * FROM tournament_modes WHERE tournament_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`;
      modesParams = tournamentIds;
    }

    const [modes] = await db.query(modesQuery, modesParams);

    // Group modes by tournament_id
    const modesByTournament = {};
    for (const m of modes) {
      if (!modesByTournament[m.tournament_id]) {
        modesByTournament[m.tournament_id] = [];
      }
      modesByTournament[m.tournament_id].push(m);
    }

    const result = tournaments.map((t) => ({
      ...t,
      modes: modesByTournament[t.id] || [],
    }));

    res.json(result);
  } catch (error) {
    console.error("Failed to fetch admin tournaments", error);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
});

// POST create tournament with modes
router.post("/", async (req, res) => {
  const { name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date, end_date, is_active, modes } = req.body;

  if (!name || !slug || !game_type) {
    return res.status(400).json({ message: "Name, slug, and game type are required." });
  }

  if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ message: "End date must not be earlier than start date." });
  }

  const modeError = validateModesForGame(game_type, modes);
  if (modeError) {
    return res.status(400).json({ message: modeError });
  }

  const normalizedModes = normalizeModes(game_type, modes);

  const conn = await db.getConnection();
  let createdTournament;

  try {
    if (conn.beginTransaction) await conn.beginTransaction();

    // Insert tournament
    const tournamentInsertSql = db.client === "postgres"
      ? `INSERT INTO tournaments (name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date, end_date, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id`
      : `INSERT INTO tournaments (name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date, end_date, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const tournamentInsertResult = await conn.query(tournamentInsertSql, [
      name.trim(), 
      slug.trim(), 
      game_type, 
      season?.trim() || null, 
      description?.trim() || null, 
      status || "upcoming", 
      banner_url?.trim() || null, 
      logo_url?.trim() || null, 
      cover_image_url?.trim() || null, 
      logo_image_url?.trim() || null, 
      start_date || null, 
      end_date || null, 
      Boolean(is_active)
    ]);

    const tournamentId = getInsertedId(tournamentInsertResult, db.client);

    if (!tournamentId) {
      throw new Error(`Tournament insert did not return an ID for ${db.client}.`);
    }

    // Insert modes
    for (const m of normalizedModes) {
      const modeInsert = db.client === "postgres"
        ? "INSERT INTO tournament_modes (tournament_id, code, name, competition_type, team_upload_enabled, is_active, sort_order) VALUES (?,?,?,?,?,?,?) RETURNING id"
        : "INSERT INTO tournament_modes (tournament_id, code, name, competition_type, team_upload_enabled, is_active, sort_order) VALUES (?,?,?,?,?,?,?)";
      await conn.query(modeInsert, [tournamentId, m.code, m.name, m.competition_type, m.team_upload_enabled, m.is_active, m.sort_order]);
    }

    // Fetch created tournament with modes
    const [created] = await conn.query("SELECT * FROM tournaments WHERE id = ?", [tournamentId]);
    const [createdModes] = await conn.query("SELECT * FROM tournament_modes WHERE tournament_id = ? ORDER BY sort_order ASC", [tournamentId]);

    createdTournament = { ...created[0], modes: createdModes };

    if (conn.commit) await conn.commit();
  } catch (error) {
    try {
      if (conn.rollback) await conn.rollback();
    } catch (rollbackError) {
      console.error("Tournament rollback failed", rollbackError);
    }
    const isProduction = process.env.NODE_ENV === "production";
    console.error("Failed to create tournament", {
      client: db.client,
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    if (error.code === "ER_DUP_ENTRY" || error.code === "23505") {
      return res.status(409).json({ message: "A tournament with this slug already exists." });
    }
    return res.status(500).json({ 
      message: "Failed to create tournament",
      ...(!isProduction && {
        code: error.code || null,
        error: error.sqlMessage || error.message
      })
    });
  } finally {
    if (conn.release) conn.release();
  }

  return res.status(201).json({
    success: true,
    message: "Tournament created successfully.",
    tournament: createdTournament
  });
});

// PUT update tournament with modes
router.put("/:id", async (req, res) => {
  const { name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date, end_date, is_active, modes } = req.body;
  const tournamentId = req.params.id;

  if (modes !== undefined) {
    const modeError = validateModesForGame(game_type, modes);
    if (modeError) {
      return res.status(400).json({ message: modeError });
    }
  }

  const conn = await db.getConnection();
  try {
    if (conn.beginTransaction) await conn.beginTransaction();

    // Update tournament fields
    if (db.client === "postgres") {
      await conn.query(
        `UPDATE tournaments
         SET name=$1, slug=$2, game_type=$3, season=$4, description=$5, status=$6, banner_url=$7, logo_url=$8, cover_image_url=$9, logo_image_url=$10, start_date=$11, end_date=$12, is_active=$13, updated_at=NOW()
         WHERE id=$14`,
        [name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date || null, end_date || null, is_active, tournamentId]
      );
    } else {
      await conn.query(
        `UPDATE tournaments
         SET name=?, slug=?, game_type=?, season=?, description=?, status=?, banner_url=?, logo_url=?, cover_image_url=?, logo_image_url=?, start_date=?, end_date=?, is_active=?
         WHERE id=?`,
        [name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date || null, end_date || null, is_active, tournamentId]
      );
    }

    // Update modes if provided
    const warnings = [];
    if (modes !== undefined && Array.isArray(modes)) {
      const normalizedModes = normalizeModes(game_type, modes);

      // Fetch existing modes
      const [existingModes] = await conn.query(
        "SELECT * FROM tournament_modes WHERE tournament_id = ?",
        [tournamentId]
      );
      const existingByCode = {};
      for (const em of existingModes) {
        existingByCode[em.code] = em;
      }

      const submittedCodes = new Set(normalizedModes.map((m) => m.code));

      // Upsert submitted modes
      for (const m of normalizedModes) {
        const existing = existingByCode[m.code];
        if (existing) {
          // Update existing mode
          await conn.query(
            "UPDATE tournament_modes SET name=?, competition_type=?, team_upload_enabled=?, is_active=?, sort_order=?, updated_at=NOW() WHERE id=?",
            [m.name, m.competition_type, m.team_upload_enabled, m.is_active, m.sort_order, existing.id]
          );
        } else {
          // Insert new mode
          const modeInsert = db.client === "postgres"
            ? "INSERT INTO tournament_modes (tournament_id, code, name, competition_type, team_upload_enabled, is_active, sort_order) VALUES (?,?,?,?,?,?,?) RETURNING id"
            : "INSERT INTO tournament_modes (tournament_id, code, name, competition_type, team_upload_enabled, is_active, sort_order) VALUES (?,?,?,?,?,?,?)";
          await conn.query(modeInsert, [tournamentId, m.code, m.name, m.competition_type, m.team_upload_enabled, m.is_active, m.sort_order]);
        }
      }

      // Handle removed modes
      for (const em of existingModes) {
        if (!submittedCodes.has(em.code)) {
          // Check if mode has related data
          const [teamCount] = await conn.query(
            "SELECT COUNT(*) as cnt FROM teams WHERE tournament_mode_id = ?", [em.id]
          );
          const [subCount] = await conn.query(
            "SELECT COUNT(*) as cnt FROM team_submissions WHERE tournament_mode_id = ?", [em.id]
          );
          const [matchCount] = await conn.query(
            "SELECT COUNT(*) as cnt FROM matches WHERE tournament_mode_id = ?", [em.id]
          );

          const total = Number(teamCount[0].cnt) + Number(subCount[0].cnt) + Number(matchCount[0].cnt);
          if (total > 0) {
            // Mark inactive instead of deleting
            await conn.query(
              "UPDATE tournament_modes SET is_active = false, updated_at = NOW() WHERE id = ?",
              [em.id]
            );
            warnings.push(`Mode "${em.name}" (${em.code}) has ${total} related record(s) and was deactivated instead of removed.`);
          } else {
            await conn.query("DELETE FROM tournament_modes WHERE id = ?", [em.id]);
          }
        }
      }
    }

    if (conn.commit) await conn.commit();

    // Fetch updated tournament with modes
    const [updated] = await db.query("SELECT * FROM tournaments WHERE id = ?", [tournamentId]);
    const [updatedModes] = await db.query("SELECT * FROM tournament_modes WHERE tournament_id = ? ORDER BY sort_order ASC", [tournamentId]);

    const response = { ...updated[0], modes: updatedModes, message: "Updated successfully" };
    if (warnings.length > 0) {
      response.warnings = warnings;
    }
    res.json(response);
  } catch (error) {
    if (conn.rollback) await conn.rollback();
    console.error("Failed to update tournament", error);
    res.status(500).json({ message: "Failed to update tournament" });
  } finally {
    if (conn.release) conn.release();
  }
});

router.delete("/:id", async (req, res) => {
  try {
    let query = "DELETE FROM tournaments WHERE id = ";
    query += db.client === "postgres" ? "$1" : "?";
    await db.query(query, [req.params.id]);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Failed to delete tournament", error);
    res.status(500).json({ message: "Failed to delete tournament" });
  }
});

module.exports = router;
