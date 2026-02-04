import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { documentController } from "../controllers/document.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadRateLimiter } from "../middleware/rate-limit.middleware";
import { config } from "../config";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Upload document
router.post("/upload", uploadRateLimiter, upload.single("file"), (req, res) =>
  documentController.upload(req, res),
);

// List documents
router.get("/", (req, res) => documentController.list(req, res));

// Get document status
router.get("/:id/status", (req, res) => documentController.getStatus(req, res));

// Delete document
router.delete("/:id", (req, res) => documentController.delete(req, res));

export default router;
