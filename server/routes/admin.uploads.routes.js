const express = require("express");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");
const { uploadImage } = require("../services/storage");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const ALLOWED_MIMETYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function makeSafeName(originalname) {
  return originalname
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

router.post("/", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!ALLOWED_MIMETYPES.has(req.file.mimetype)) {
      return res.status(400).json({ message: "Invalid file type. Allowed: png, jpeg, webp, gif" });
    }

    const { type, tournament_id } = req.body;

    if (!type || !["cover", "logo"].includes(type)) {
      return res.status(400).json({ message: "Field 'type' must be 'cover' or 'logo'" });
    }

    const folder = `tournaments/${tournament_id || "general"}`;
    const safeName = makeSafeName(req.file.originalname);
    const filename = `${type}-${Date.now()}-${safeName}`;

    const result = await uploadImage({
      file: req.file.buffer,
      folder,
      filename,
      mimetype: req.file.mimetype,
    });

    res.json({ success: true, url: result.url, path: result.path });
  } catch (error) {
    console.error("Tournament image upload failed:", error);
    res.status(500).json({ message: error.message || "Upload failed" });
  }
});

module.exports = router;
