import express from "express";
import fs from "fs";
import path from "path";
import { extractTextFromImage } from "../services/ocrService.js";
import { normalizeAmounts } from "../services/normalize.js";
import { classifyAmounts } from "../services/classify.js";

export default (upload) => {
  const router = express.Router();

  router.post("/", upload.single("image"), async (req, res) => {
    let uploadedPath = null;

    try {
      let text = "";
      let normalized_amounts = [];
      
      if (req.file) {
        uploadedPath = path.resolve(req.file.path);
        const { text: ocrText } = await extractTextFromImage(uploadedPath);
        text = ocrText.trim();

        const rawTokens = text.match(/\d+%?/g) || [];
        if (rawTokens.length === 0)
          return res.json({ status: "no_amounts_found", reason: "document too noisy" });

        const normalized = normalizeAmounts(rawTokens);
        normalized_amounts = normalized.normalized_amounts;
      }
    
      else if (req.body.text) {
        text = req.body.text.trim();
        normalized_amounts = req.body.normalized_amounts || [];
      } else {
        return res.status(400).json({ status: "error", reason: "no input provided" });
      }

      const classified = classifyAmounts(text, normalized_amounts);
      res.json(classified);
    } catch (err) {
      console.error("Step 3 failed:", err);
      res.status(500).json({ status: "error", reason: err.message });
    } finally {
      if (uploadedPath && fs.existsSync(uploadedPath))
        await fs.promises.unlink(uploadedPath).catch(() => {});
    }
  });

  return router;
};
