const express = require('express');
const router = express.Router();
const { auth } = require('../../middlewares/auth.middleware');
const { sendSuccess, sendError } = require('../../utils/response');
const {
  getS3UploadEnv,
  createS3Multer,
  buildS3PublicUrl,
  createMulterSizeErrorHandler,
} = require('../../utils/s3Upload.util');
const { createLocalMulter, buildLocalFileUrl } = require("../../utils/localUpload.util");

let cachedUpload;
let cachedHandleMulterError;

function getS3MulterPair() {
  if (!cachedUpload) {
    cachedUpload = createS3Multer();
    cachedHandleMulterError = createMulterSizeErrorHandler(sendError);
  }
  return { upload: cachedUpload, handleMulterError: cachedHandleMulterError };
}

function runS3Upload(multerMethod) {
  return (req, res, next) => {
    try {
      const { upload, handleMulterError } = getS3MulterPair();
      multerMethod(upload)(req, res, (err) => {
        if (err) return handleMulterError(err, req, res, next);
        next();
      });
    } catch (e) {
      return sendError(res, e.message, 503);
    }
  };
}

function filePublicUrl(key) {
  const { bucket, region } = getS3UploadEnv();
  return buildS3PublicUrl(bucket, region, key);
}

function isS3Configured() {
  const env = getS3UploadEnv();
  return Boolean(env.bucket && env.region);
}

let cachedLocalUpload;
let cachedLocalHandleMulterError;

function getLocalMulterPair() {
  if (!cachedLocalUpload) {
    cachedLocalUpload = createLocalMulter();
    cachedLocalHandleMulterError = createMulterSizeErrorHandler(sendError);
  }
  return { upload: cachedLocalUpload, handleMulterError: cachedLocalHandleMulterError };
}

function runLocalUpload(multerMethod) {
  return (req, res, next) => {
    try {
      const { upload, handleMulterError } = getLocalMulterPair();
      multerMethod(upload)(req, res, (err) => {
        if (err) return handleMulterError(err, req, res, next);
        next();
      });
    } catch (e) {
      return sendError(res, e.message, 500);
    }
  };
}


router.post('/upload',  (req, res, next) => {
    const runner = isS3Configured() ? runS3Upload : runLocalUpload;
    return runner((upload) => upload.single('file'))(req, res, next);
  },
  (req, res) => {
    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded', 400);
      }

      const usingS3 = isS3Configured() && req.file.key;
      const filePath = usingS3 ? req.file.key : req.file.filename;
      const fileUrl = usingS3
        ? filePublicUrl(req.file.key)
        : buildLocalFileUrl(req, req.file.filename);
      const fileName = req.file.originalname || String(filePath || '').split('/').pop();

      return res.status(200).json({
        fileName,
        file_url: fileUrl,
        file_path: filePath,
        file_type: req.file.mimetype,
        file_size: req.file.size,
      });
    } catch (error) {
      console.error('Upload error:', error);
      if (error.name === 'AccessDenied' || error.message.includes('Access Denied')) {
        return sendError(res, 'S3 Access Denied: Please check AWS credentials and bucket permissions', 403);
      }
      if (error.code === 'SignatureDoesNotMatch') {
        return sendError(res, 'S3 Signature Error: Please check AWS credentials are correct', 403);
      }
      return sendError(res, error.message || 'Failed to upload file', 500);
    }
  }
);

module.exports = router;
