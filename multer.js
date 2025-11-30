import multer from "multer";
import fs from "fs";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir("./uploads/profile");
ensureDir("./uploads/gallery");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname.startsWith("prof")) cb(null, "./uploads/profile");
    else cb(null, "./uploads/gallery");
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/"))
      return cb(new Error("Only images allowed"), false);
    cb(null, true);
  },
});

export default upload;
