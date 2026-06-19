const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { storageDriver, localUploadsDir } = require("../services/storage");

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

const sanitizeFilename = (filename) =>
  filename
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

const slugifyTeamName = (teamName) =>
  String(teamName || "team")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "") || "team";

const createStorage = (subfolder, filenameFn) => {
  if (storageDriver !== "local") {
    return multer.memoryStorage();
  }

  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(localUploadsDir, subfolder);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      if (filenameFn) {
        cb(null, filenameFn(req, file));
        return;
      }
      const safeName = sanitizeFilename(file.originalname);
      cb(null, `${Date.now()}-${safeName}`);
    },
  });
};

const imageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    return cb(new Error("Only image files are allowed"), false);
  }
  return cb(null, true);
};

const uploadTeamLogo = multer({
  storage: createStorage("teams", (req, file) => {
    const slug = slugifyTeamName(req.body?.name);
    const ext = path.extname(file.originalname).toLowerCase();
    return `${slug}_logo_${Date.now()}${ext}`;
  }),
  fileFilter: imageFileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
});

module.exports = {
  storageDriver,
  uploadTeamLogo,
};
