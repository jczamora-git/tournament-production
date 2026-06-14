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
