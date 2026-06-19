const path = require("path");
const express = require("express");
const db = require("../db");
const requireAdmin = require("../middleware/requireAdmin");
const { storageDriver, uploadTeamLogo } = require("../middleware/upload");
const { uploadImage } = require("../services/storage");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM teams ORDER BY name ASC");
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch teams", error);
    res.status(500).json({ message: "Failed to fetch teams" });
  }
});

router.post("/", uploadTeamLogo.single("logo"), async (req, res) => {
  try {
    const { name, shortname, logo } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Team name is required" });
    }

    let logoPath = logo || null;

    if (req.file) {
      if (storageDriver === "local") {
        logoPath = `/uploads/teams/${req.file.filename}`;
      } else {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `team_logo_${Date.now()}${ext}`;
        const result = await uploadImage({
          file: req.file.buffer,
          folder: "teams",
          filename,
          mimetype: req.file.mimetype,
        });
        logoPath = result.url;
      }
    }

    const insertSql =
      db.client === "postgres"
        ? "INSERT INTO teams (name, shortname, logo) VALUES (?,?,?) RETURNING id"
        : "INSERT INTO teams (name, shortname, logo) VALUES (?,?,?)";
    const [, result] = await db.query(insertSql, [name, shortname || null, logoPath]);

    res.status(201).json({
      id: result.insertId,
      name,
      shortname: shortname || null,
      logo: logoPath,
    });
  } catch (error) {
    console.error("Failed to create team", error);
    res.status(500).json({ message: "Failed to create team" });
  }
});

router.put("/:id", uploadTeamLogo.single("logo"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, shortname, logo } = req.body;

    let nextLogo = null;
    const hasLogoField = Object.prototype.hasOwnProperty.call(req.body, "logo");

    if (req.file) {
      if (storageDriver === "local") {
        nextLogo = `/uploads/teams/${req.file.filename}`;
      } else {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = `team_logo_${Date.now()}${ext}`;
        const result = await uploadImage({
          file: req.file.buffer,
          folder: "teams",
          filename,
          mimetype: req.file.mimetype,
        });
        nextLogo = result.url;
      }
    } else if (hasLogoField) {
      nextLogo = logo || null;
    } else {
      const [rows] = await db.query("SELECT logo FROM teams WHERE id = ?", [id]);
      nextLogo = rows[0]?.logo ?? null;
    }

    await db.query(
      "UPDATE teams SET name = ?, shortname = ?, logo = ? WHERE id = ?",
      [name, shortname || null, nextLogo, id]
    );

    res.json({ id: Number(id), name, shortname: shortname || null, logo: nextLogo });
  } catch (error) {
    console.error("Failed to update team", error);
    res.status(500).json({ message: "Failed to update team" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT id FROM teams WHERE id = ?", [id]);
    if (!rows.length) {
      return res.status(404).json({ message: "Team not found" });
    }

    await db.query("DELETE FROM teams WHERE id = ?", [id]);
    res.json({ id: Number(id), deleted: true });
  } catch (error) {
    console.error("Failed to delete team", error);
    res.status(500).json({ message: "Failed to delete team" });
  }
});

module.exports = router;
