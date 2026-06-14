const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT v.*, t.name as tournament_name 
      FROM video_archives v
      LEFT JOIN tournaments t ON v.tournament_id = t.id
      ORDER BY v.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch admin videos", error);
    res.status(500).json({ message: "Failed to fetch videos" });
  }
});

router.post("/", async (req, res) => {
  const { tournament_id, title, description, source_type, source_url, embed_url, thumbnail_url, video_type, recorded_at, sort_order, is_featured, is_published } = req.body;
  
  if (!title || !source_url || !source_type) {
    return res.status(400).json({ message: "Title, source URL, and source type are required." });
  }

  try {
    let query, params;
    if (db.client === "postgres") {
      query = `
        INSERT INTO video_archives (tournament_id, title, description, source_type, source_url, embed_url, thumbnail_url, video_type, recorded_at, sort_order, is_featured, is_published)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *
      `;
      params = [tournament_id || null, title, description, source_type, source_url, embed_url, thumbnail_url, video_type, recorded_at || null, sort_order || 0, is_featured || false, is_published !== false];
    } else {
      query = `
        INSERT INTO video_archives (tournament_id, title, description, source_type, source_url, embed_url, thumbnail_url, video_type, recorded_at, sort_order, is_featured, is_published)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [tournament_id || null, title, description, source_type, source_url, embed_url, thumbnail_url, video_type, recorded_at || null, sort_order || 0, is_featured || false, is_published !== false];
    }

    const [result] = await db.query(query, params);
    res.json(result);
  } catch (error) {
    console.error("Failed to create video", error);
    res.status(500).json({ message: "Failed to create video" });
  }
});

router.put("/:id", async (req, res) => {
  const { tournament_id, title, description, source_type, source_url, embed_url, thumbnail_url, video_type, recorded_at, sort_order, is_featured, is_published } = req.body;
  
  try {
    let query, params;
    if (db.client === "postgres") {
      query = `
        UPDATE video_archives
        SET tournament_id=$1, title=$2, description=$3, source_type=$4, source_url=$5, embed_url=$6, thumbnail_url=$7, video_type=$8, recorded_at=$9, sort_order=$10, is_featured=$11, is_published=$12, updated_at=NOW()
        WHERE id=$13 RETURNING *
      `;
      params = [tournament_id || null, title, description, source_type, source_url, embed_url, thumbnail_url, video_type, recorded_at || null, sort_order || 0, is_featured, is_published, req.params.id];
    } else {
      query = `
        UPDATE video_archives
        SET tournament_id=?, title=?, description=?, source_type=?, source_url=?, embed_url=?, thumbnail_url=?, video_type=?, recorded_at=?, sort_order=?, is_featured=?, is_published=?
        WHERE id=?
      `;
      params = [tournament_id || null, title, description, source_type, source_url, embed_url, thumbnail_url, video_type, recorded_at || null, sort_order || 0, is_featured, is_published, req.params.id];
    }

    await db.query(query, params);
    res.json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Failed to update video", error);
    res.status(500).json({ message: "Failed to update video" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    let query = "DELETE FROM video_archives WHERE id = ";
    query += db.client === "postgres" ? "$1" : "?";
    await db.query(query, [req.params.id]);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Failed to delete video", error);
    res.status(500).json({ message: "Failed to delete video" });
  }
});

module.exports = router;
