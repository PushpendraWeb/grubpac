const path = require("path");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

require("dotenv").config({
  path: path.join(__dirname, "..", "..", "config.env"),
});

function getS3UploadEnv() {
  const region =
    process.env.AWS_REGION || process.env.S3_REGION || "ap-south-1";
  const bucket = process.env.S3_BUCKET_NAME || "";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const uploadPrefix = (process.env.S3_UPLOAD_PREFIX || "upload").replace(
    /^\/+|\/+$/g,
    ""
  );
  const maxFileMb = Number(process.env.S3_MAX_FILE_MB || 100);
  const maxBytes =
    (Number.isFinite(maxFileMb) && maxFileMb > 0 ? maxFileMb : 100) *
    1024 *
    1024;
  const objectAcl = (process.env.S3_OBJECT_ACL || "").trim();
  const allowedMimeTypesRaw =
    process.env.S3_ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/gif";
  const allowedMimeTypes = allowedMimeTypesRaw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return {
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    uploadPrefix,
    maxBytes,
    maxFileMb: Math.round(maxBytes / (1024 * 1024)),
    objectAcl,
    allowedMimeTypes,
  };
}

function createS3Client() {
  const { region, accessKeyId, secretAccessKey } = getS3UploadEnv();
  const config = { region };
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }
  return new S3Client(config);
}

function buildS3PublicUrl(bucket, region, key) {
  const encodedKey = String(key)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;
}

function createS3Multer() {
  const env = getS3UploadEnv();
  if (!env.bucket) {
    throw new Error("S3_BUCKET_NAME is required in config.env for uploads");
  }

  const s3Client = createS3Client();
  const storageConfig = {
    s3: s3Client,
    bucket: env.bucket,
    metadata(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key(req, file, cb) {
      const fileName = `${Date.now()}_${file.originalname}`;
      const s3Key = `${env.uploadPrefix}/${fileName}`;
      cb(null, s3Key);
    },
  };

  if (env.objectAcl && env.objectAcl.toLowerCase() !== "none") {
    storageConfig.acl = env.objectAcl;
  }

  return multer({
    storage: multerS3(storageConfig),
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

function createMulterSizeErrorHandler(sendError) {
  const env = getS3UploadEnv();
  return function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(
          res,
          `File size too large. Maximum size is ${env.maxFileMb}MB`,
          400
        );
      }
      return sendError(res, `File upload error: ${err.message}`, 400);
    }
    if (err) {
      return sendError(res, err.message, 400);
    }
    next();
  };
}

module.exports = {
  getS3UploadEnv,
  createS3Client,
  createS3Multer,
  buildS3PublicUrl,
  createMulterSizeErrorHandler,
};
