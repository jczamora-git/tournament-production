const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tournaments ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch admin tournaments", error);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
});

router.post("/", async (req, res) => {
  const { name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date, end_date, is_active } = req.body;

  if (!name || !slug || !game_type) {
    return res.status(400).json({ message: "Name, slug, and game type are required." });
  }

  try {
    let query, params;
    if (db.client === "postgres") {
      query = `
        INSERT INTO tournaments (name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date, end_date, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
      `;
      params = [name, slug, game_type, season, description, status || 'upcoming', banner_url, logo_url, cover_image_url, logo_image_url, start_date || null, end_date || null, is_active !== false];
    } else {
      query = `
        INSERT INTO tournaments (name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date, end_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [name, slug, game_type, season, description, status || 'upcoming', banner_url, logo_url, cover_image_url, logo_image_url, start_date || null, end_date || null, is_active !== false];
    }

    const [result] = await db.query(query, params);
    res.json(result);
  } catch (error) {
    console.error("Failed to create tournament", error);
    if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      return res.status(400).json({ message: "A tournament with this slug already exists." });
    }
    res.status(500).json({ message: "Failed to create tournament" });
  }
});

router.put("/:id", async (req, res) => {
  const { name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date, end_date, is_active } = req.body;

  try {
    let query, params;
    if (db.client === "postgres") {
      query = `
        UPDATE tournaments
        SET name=$1, slug=$2, game_type=$3, season=$4, description=$5, status=$6, banner_url=$7, logo_url=$8, cover_image_url=$9, logo_image_url=$10, start_date=$11, end_date=$12, is_active=$13, updated_at=NOW()
        WHERE id=$14 RETURNING *
      `;
      params = [name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date || null, end_date || null, is_active, req.params.id];
    } else {
      query = `
        UPDATE tournaments
        SET name=?, slug=?, game_type=?, season=?, description=?, status=?, banner_url=?, logo_url=?, cover_image_url=?, logo_image_url=?, start_date=?, end_date=?, is_active=?
        WHERE id=?
      `;
      params = [name, slug, game_type, season, description, status, banner_url, logo_url, cover_image_url, logo_image_url, start_date || null, end_date || null, is_active, req.params.id];
    }

    await db.query(query, params);
    res.json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Failed to update tournament", error);
    res.status(500).json({ message: "Failed to update tournament" });
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
