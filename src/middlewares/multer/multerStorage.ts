import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!(req as any).uploadFolder) {
      const userId = (req as any).user?.id ?? 'anon';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const folderName = `user-${userId}_${timestamp}`;
      const fullPath = path.join(process.cwd(), 'uploads', folderName);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      (req as any).uploadFolder = folderName;
      (req as any).uploadPath = fullPath;
    }

    cb(null, (req as any).uploadPath);
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.html', '.css', '.js'];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${ext}`));
    }
  },
});

export default upload;
