const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/tournaments
router.get("/", async (req, res) => {
  try {
    const { game_type, status } = req.query;
    
    let query = "SELECT * FROM tournaments WHERE is_active = true";
    const params = [];
    
    if (game_type) {
      if (db.client === "postgres") {
        query += ` AND game_type = $${params.length + 1}`;
      } else {
        query += ` AND game_type = ?`;
      }
      params.push(game_type);
    }
    
    if (status) {
      if (db.client === "postgres") {
        query += ` AND status = $${params.length + 1}`;
      } else {
        query += ` AND status = ?`;
      }
      params.push(status);
    }
    
    query += " ORDER BY start_date DESC";
    
    const [rows] = await db.query(query, params);

    // Fetch active modes for all returned tournaments
    if (rows.length > 0) {
      const tournamentIds = rows.map((t) => t.id);
      let modesQuery, modesParams;

      if (db.client === "postgres") {
        const placeholders = tournamentIds.map((_, i) => `$${i + 1}`).join(", ");
        modesQuery = `SELECT * FROM tournament_modes WHERE tournament_id IN (${placeholders}) AND is_active = true ORDER BY sort_order ASC, id ASC`;
        modesParams = tournamentIds;
      } else {
        const placeholders = tournamentIds.map(() => "?").join(", ");
        modesQuery = `SELECT * FROM tournament_modes WHERE tournament_id IN (${placeholders}) AND is_active = true ORDER BY sort_order ASC, id ASC`;
        modesParams = tournamentIds;
      }

      const [modes] = await db.query(modesQuery, modesParams);
      const modesByTournament = {};
      for (const m of modes) {
        if (!modesByTournament[m.tournament_id]) {
          modesByTournament[m.tournament_id] = [];
        }
        modesByTournament[m.tournament_id].push(m);
      }

      for (const t of rows) {
        t.modes = modesByTournament[t.id] || [];
      }
    }

    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch tournaments", error);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
});

// GET /api/tournaments/:slug
router.get("/:slug", async (req, res) => {
  try {
    let query = "SELECT * FROM tournaments WHERE slug = ";
    query += db.client === "postgres" ? "$1" : "?";
    
    const [rows] = await db.query(query, [req.params.slug]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error("Failed to fetch tournament", error);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
});

// GET /api/tournaments/:id/modes — returns active modes for a tournament by ID
router.get("/:id/modes", async (req, res) => {
  try {
    const tournamentId = req.params.id;

    // Check if id is numeric (tournament ID) vs slug
    if (!/^\d+$/.test(tournamentId)) {
      // Might be a slug hitting the videos route below; skip
      return res.status(400).json({ message: "Invalid tournament ID" });
    }

    let modesQuery;
    if (db.client === "postgres") {
      modesQuery = "SELECT * FROM tournament_modes WHERE tournament_id = $1 AND is_active = true ORDER BY sort_order ASC, id ASC";
    } else {
      modesQuery = "SELECT * FROM tournament_modes WHERE tournament_id = ? AND is_active = true ORDER BY sort_order ASC, id ASC";
    }

    const [modes] = await db.query(modesQuery, [tournamentId]);
    res.json(modes);
  } catch (error) {
    console.error("Failed to fetch tournament modes", error);
    res.status(500).json({ message: "Failed to fetch tournament modes" });
  }
});

// GET /api/tournaments/:slug/videos
router.get("/:slug/videos", async (req, res) => {
  try {
    // 1. Find tournament by slug
    let tQuery = "SELECT id FROM tournaments WHERE slug = ";
    tQuery += db.client === "postgres" ? "$1" : "?";
    const [tRows] = await db.query(tQuery, [req.params.slug]);
    
    if (tRows.length === 0) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    
    const tournamentId = tRows[0].id;
    
    // 2. Fetch published videos for this tournament
    let vQuery = "SELECT * FROM video_archives WHERE tournament_id = ";
    vQuery += db.client === "postgres" ? "$1" : "?";
    vQuery += " AND is_published = true ORDER BY sort_order ASC, recorded_at DESC";
    
    const [vRows] = await db.query(vQuery, [tournamentId]);
    
    res.json(vRows);
  } catch (error) {
    console.error("Failed to fetch tournament videos", error);
    res.status(500).json({ message: "Failed to fetch tournament videos" });
  }
});

module.exports = router;
