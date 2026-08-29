import util from 'util';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { assetsUrl } from '../config/config.js';

const uploadPath = assetsUrl;

// Ensure assets folder exists
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const getExtension = (filename) => {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex !== -1
    ? filename.substring(dotIndex + 1)
    : '';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = getExtension(file.originalname);
    const timestamp = Date.now();
    cb(null, `${ext}_${timestamp}.${ext}`);
  },
});

const uploadFile = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
}).array("images");

export default util.promisify(uploadFile);