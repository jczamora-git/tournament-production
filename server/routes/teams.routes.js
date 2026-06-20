const express = require("express");
const db = require("../db");

const router = express.Router();

// Public: read-only team list with optional filters
router.get("/", async (req, res) => {
  try {
    const { tournament_id, tournament_mode_id } = req.query;

    let query = "SELECT * FROM teams";
    const conditions = [];
    const params = [];

    if (tournament_id) {
      conditions.push(db.client === "postgres" ? `tournament_id = $${params.length + 1}` : "tournament_id = ?");
      params.push(tournament_id);
    }
    if (tournament_mode_id) {
      conditions.push(db.client === "postgres" ? `tournament_mode_id = $${params.length + 1}` : "tournament_mode_id = ?");
      params.push(tournament_mode_id);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY name ASC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch teams", error);
    res.status(500).json({ message: "Failed to fetch teams" });
  }
});

module.exports = router;
