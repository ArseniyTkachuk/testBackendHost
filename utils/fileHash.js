import fs from "fs";
import crypto from "crypto";

export const getFileHash = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
};
