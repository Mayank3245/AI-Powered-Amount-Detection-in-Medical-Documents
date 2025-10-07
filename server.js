import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import "dotenv/config";


import step1Extract from "./routes/step1_extract.js";
import step2Normalize from "./routes/step2_normalize.js";
import step3Classify from "./routes/step3_classify.js";
import step4Finalize from "./routes/step4_finalize.js";


import { aiValidateAmounts } from "./services/aiValidator.js";

const app = express();
app.use(express.json());

const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

app.use("/api/step1_extract", step1Extract(upload));
app.use("/api/step2_normalize", step2Normalize(upload));
app.use("/api/step3_classify", step3Classify(upload, aiValidateAmounts));
app.use("/api/step4_finalize", step4Finalize(upload, aiValidateAmounts));

app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "OCR Service is active",
    endpoints: [
      "/api/step1_extract",
      "/api/step2_normalize",
      "/api/step3_classify",
      "/api/step4_finalize"
    ]
  });
});

setInterval(async () => {
  const cutoff = Date.now() - 10 * 60 * 1000; 
  try {
    const files = await fs.promises.readdir(uploadDir);
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      const stats = await fs.promises.stat(filePath);
      if (stats.mtimeMs < cutoff) {
        await fs.promises.unlink(filePath);
      }
    }
  } catch {
   
  }
}, 5 * 60 * 1000); 

process.on("SIGINT", () => {
  console.log("Server shutting down...");
  process.exit(0);
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
