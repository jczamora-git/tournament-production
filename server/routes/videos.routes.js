const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/videos
router.get("/", async (req, res) => {
  try {
    const { tournament_id, game_type, source_type, video_type, featured } = req.query;
    
    let query = `
      SELECT v.*, t.name as tournament_name, t.game_type, t.season 
      FROM video_archives v
      LEFT JOIN tournaments t ON v.tournament_id = t.id
      WHERE v.is_published = true
    `;
    const params = [];
    
    if (tournament_id) {
      params.push(tournament_id);
      query += ` AND v.tournament_id = ${db.client === "postgres" ? `$${params.length}` : "?"}`;
    }
    
    if (game_type) {
      params.push(game_type);
      query += ` AND t.game_type = ${db.client === "postgres" ? `$${params.length}` : "?"}`;
    }
    
    if (source_type) {
      params.push(source_type);
      query += ` AND v.source_type = ${db.client === "postgres" ? `$${params.length}` : "?"}`;
    }
    
    if (video_type) {
      params.push(video_type);
      query += ` AND v.video_type = ${db.client === "postgres" ? `$${params.length}` : "?"}`;
    }
    
    if (featured === 'true' || featured === '1') {
      query += ` AND v.is_featured = true`;
    }
    
    query += " ORDER BY v.sort_order ASC, v.recorded_at DESC";
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch videos", error);
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

module.exports = router;
