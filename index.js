import express from 'express'
import mongoose from 'mongoose'
import multer from 'multer'
import cors from 'cors'
import path from 'path'
import crypto from 'crypto';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import checkAuth from './checkAuth.js'

import { registerValidator, loginValidator } from './validations.js'

import * as UserController from './Controllers/UserController.js'
import * as TestController from './Controllers/TestController.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

mongoose
  .connect('mongodb+srv://arseniitkachuk_db_user:rashamon2009@cluster0.dcqg0py.mongodb.net/tichProject?appName=Cluster0',)
  .then(() => console.log('DB OK'))
  .catch((err) => console.log('DB error: ', err))


const app = express();

app.use(cors())


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/utils', express.static(path.join(__dirname, 'utils')));


const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, 'uploads');
  },

  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName =
      crypto.randomBytes(16).toString('hex') + ext;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Тільки зображення'));
    }
    cb(
      null,
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)
    );
  }
});

app.use(express.json());


app.post("/register", registerValidator, UserController.register)
app.post("/login", loginValidator, UserController.login)
app.get("/auth", checkAuth, UserController.userProfile)

app.post('/test', checkAuth, upload.any(), TestController.createTest)
app.get('/test/:id', TestController.getTest)
app.get('/getOneTest/:id', TestController.getOneTest)
app.post('/test/:id/result', TestController.checkTest)

app.listen(PORT, (err) => {
  if (err) {
    return console.log(err)
  }

  console.log('Server OK')
});