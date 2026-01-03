import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import checkAuth from './checkAuth.js';
import { registerValidator, loginValidator } from './validations.js';
import * as UserController from './Controllers/UserController.js';
import * as TestController from './Controllers/TestController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 2222;

// Підключення до Mongo
mongoose
  .connect('mongodb+srv://arseniitkachuk_db_user:rashamon2009@cluster0.dcqg0py.mongodb.net/tichProject?appName=Cluster0')
  .then(() => console.log('DB OK'))
  .catch(err => console.log('DB error:', err));

const app = express();
app.use(cors());
app.use(express.json());

// Статика
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use('/uploads', express.static(uploadDir));
app.use('/utils', express.static(path.join(__dirname, 'utils')));

// --- MULTER ---
const uploadWithHash = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Тільки зображення'));
    }
    cb(null, true);
  }
});

// Middleware для хешування та збереження файлів
const hashFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files.length) return next();

  files.forEach(file => {
    const ext = path.extname(file.originalname);
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const filename = `${hash}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // якщо вже є — не записуємо
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, file.buffer);
    }

    // додаємо url
    file.url = `/uploads/${filename}`;
  });

  next();
};

// --- РОУТИ ---

// AUTH
app.post("/register", registerValidator, UserController.register);
app.post("/verify-email", UserController.verifyEmail)
app.post("/sendCode", UserController.sendCode)
app.post("/login", loginValidator, UserController.login);
app.post("/sendLink", UserController.sendLink)
app.post("/auth/reset-password", UserController.resetPassword)
app.get("/auth", checkAuth, UserController.userProfile);
app.patch("/auth", checkAuth, uploadWithHash.single('avatar'), hashFiles, UserController.update);
app.patch("/editPassword", checkAuth, UserController.editPassword)

// TESTS
app.post("/test", checkAuth, uploadWithHash.any(), hashFiles, TestController.createTest);
app.get("/test/:id", TestController.getTest);
app.get("/getOneTest/:id", TestController.getOneTest);
app.post("/test/:id/result", TestController.checkTest);
app.delete("/test/:id", TestController.remove);
app.patch("/test/:id", checkAuth, uploadWithHash.any(), hashFiles, TestController.update);
app.get("/test/:testId/result/:childSlug", checkAuth, TestController.checkUserTest)


// Слухач
app.listen(PORT, (err) => {
  if (err) return console.log(err);
  console.log(`Server OK on ${PORT}`);
});
