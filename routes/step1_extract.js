import express from "express";
import fs from "fs";
import path from "path";
import { extractTextFromImage } from "../services/ocrService.js";
import { detectCurrency } from "../services/builder.js";

export default (upload) => {
  const router = express.Router();

  router.post("/", upload.single("image"), async (req, res) => {
    let uploadedPath = null;

    try {
      let text = "";
      let confidence = 0.0;

     
      if (req.file) {
        uploadedPath = path.resolve(req.file.path);
        const { text: ocrText, confidence: conf } = await extractTextFromImage(uploadedPath);
        text = (ocrText || "").trim();
        confidence = conf;
      }
      // 🟦 If text input
      else if (req.body.text) {
        text = req.body.text.trim();
        confidence = 1.0;
      } else {
        return res.status(400).json({ status: "error", reason: "no input provided" });
      }
      const rawTokens = text.match(/\d+%?/g) || [];
      if (rawTokens.length === 0)
        return res.json({ status: "no_amounts_found", reason: "document too noisy" });

      const currency_hint = detectCurrency(text);
      res.json({ raw_tokens: rawTokens, currency_hint, confidence });
    } catch (err) {
      console.error("Step 1 failed:", err);
      res.status(500).json({ status: "error", reason: err.message });
    } finally {
      if (uploadedPath && fs.existsSync(uploadedPath)) {
        await fs.promises.unlink(uploadedPath).catch(() => {});
      }
    }
  });

  return router;
};
