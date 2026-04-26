const path = require("path");
const fs = require("fs");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function getLocalUploadEnv() {
  const allowedMimeTypesRaw =
    process.env.S3_ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/gif";
  const allowedMimeTypes = allowedMimeTypesRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const maxFileMb = Number(process.env.S3_MAX_FILE_MB || 10);
  const maxBytes =
    (Number.isFinite(maxFileMb) && maxFileMb > 0 ? maxFileMb : 10) * 1024 * 1024;

  const publicBase = (process.env.LOCAL_UPLOAD_PUBLIC_BASE || "/uploads").replace(
    /\/+$/g,
    ""
  );

  return { allowedMimeTypes, maxBytes, maxFileMb, publicBase };
}

function createLocalMulter() {
  ensureUploadDir();
  const env = getLocalUploadEnv();

  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, UPLOAD_DIR);
    },
    filename(req, file, cb) {
      const safeOriginal = String(file.originalname || "file").replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );
      cb(null, `${Date.now()}_${safeOriginal}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: env.maxBytes },
    fileFilter(req, file, cb) {
      const mime = String(file.mimetype || "").toLowerCase();
      if (!env.allowedMimeTypes.includes(mime)) {
        return cb(
          new Error(
            `Unsupported file format. Supported: JPG, PNG, GIF. Received: ${mime || "unknown"}`
          )
        );
      }
      cb(null, true);
    },
  });
}

function buildLocalFileUrl(req, filename) {
  const env = getLocalUploadEnv();
  const host = req.get("host");
  const proto =
    (req.headers["x-forwarded-proto"] && String(req.headers["x-forwarded-proto"]).split(",")[0]) ||
    req.protocol;
  return `${proto}://${host}${env.publicBase}/${encodeURIComponent(filename)}`;
}

module.exports = {
  ensureUploadDir,
  getLocalUploadEnv,
  createLocalMulter,
  buildLocalFileUrl,
  UPLOAD_DIR,
};

