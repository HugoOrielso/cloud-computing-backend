import multer, { StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = path.join(__dirname, '..', 'uploads', path.dirname(file.originalname));
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, path.basename(file.originalname));
  }
});

const upload = multer({ storage });

export default upload;
