import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mimetype: String,
  size: Number,
}, { timestamps: true });

export default mongoose.model("File", FileSchema);
