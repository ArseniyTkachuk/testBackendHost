import multer from "multer";
import fs from "fs";
import path from "path";
import FileModel from "../models/File.js";
import { getFileHash } from "../utils/fileHash.js";

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, uploadDir);
    },

    filename: async (req, file, cb) => {
        // тимчасове імʼя
        const tempName = `${Date.now()}-${file.originalname}`;
        cb(null, tempName);
    }
});

const upload = multer({ storage });

/**
 * 🔥 МАГІЯ ПІСЛЯ MULTER
 */
export const uploadWithHash = async (req, res, next) => {
    upload.any()
        (req, res, async (err) => {
            if (err) return next(err);

            if (!req.file) return next();

            const filePath = req.file.path;
            const hash = getFileHash(filePath);

            const ext = path.extname(req.file.originalname);
            const finalName = `${hash}${ext}`;
            const finalPath = path.join(uploadDir, finalName);

            // 🔍 перевірка в БД
            const existing = await FileModel.findOne({ hash });

            if (existing) {
                // ❌ видаляємо новий файл
                fs.unlinkSync(filePath);

                // 🟢 підставляємо існуючий
                req.file = {
                    ...existing.toObject(),
                    url: `/uploads/${existing.filename}`
                };
            } else {
                // ✅ новий файл
                fs.renameSync(filePath, finalPath);

                const savedFile = await FileModel.create({
                    hash,
                    filename: finalName,
                    path: finalPath,
                    mimetype: req.file.mimetype,
                    size: req.file.size
                });

                req.file = {
                    ...savedFile.toObject(),
                    url: `/uploads/${finalName}`
                };
            }

            next();
        });
};
