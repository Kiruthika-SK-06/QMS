import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize original filename and append unique timestamp
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

// Allowed file types: PDF, Word, Excel, Images, Text
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv|png|jpg|jpeg/i;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype;

  if (extname || mimetype) {
    return cb(null, true);
  }
  cb(new Error("File format not supported. Please upload PDF, Word, Excel, or image files."));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max limit
  },
  fileFilter
});

export const UPLOAD_DIR = uploadDir;
export default upload;
