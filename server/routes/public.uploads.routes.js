const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../services/storage");
const db = require("../db");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});

const ALLOWED_MIMETYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

function makeSafeName(originalname) {
  return originalname
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

router.post("/", upload.single("file"), async (req, res) => {
  console.log("[team-logo-upload] route reached", {
    contentType: req.headers["content-type"],
    origin: req.headers.origin,
  });
  try {
    const [settingRows] = await db.query(
      "SELECT setting_value FROM app_settings WHERE setting_key = 'team_upload_enabled'"
    );
    if (settingRows.length > 0 && settingRows[0].setting_value === "false") {
      return res.status(403).json({ message: "Team logo upload is currently closed." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!ALLOWED_MIMETYPES.has(req.file.mimetype)) {
      return res.status(400).json({ message: "Invalid logo file type. Please upload PNG, JPG, or WebP." });
    }

    const safeName = makeSafeName(req.file.originalname);
    const date = new Date().toISOString().split("T")[0];
    const filename = `${Date.now()}-${safeName}`;

    const result = await uploadImage({
      file: req.file.buffer,
      folder: `team-submissions/${date}`,
      filename,
      mimetype: req.file.mimetype,
    });

    res.json({ success: true, url: result.url, path: result.path });
  } catch (error) {
    console.error("Team logo upload error:", error);
    res.status(500).json({ message: error.message || "Logo upload failed. Please try again." });
  }
});

module.exports = router;
