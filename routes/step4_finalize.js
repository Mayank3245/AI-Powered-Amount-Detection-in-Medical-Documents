import express from "express";
import fs from "fs";
import path from "path";
import { extractTextFromImage } from "../services/ocrService.js";
import { normalizeAmounts } from "../services/normalize.js";
import { classifyAmounts } from "../services/classify.js";
import { buildFinalResponse, detectCurrency } from "../services/builder.js";

export default (upload) => {
  const router = express.Router();

  router.post("/", upload.single("image"), async (req, res) => {
    let uploadedPath = null;

    try {
      let text = "";
      let source = "text";

      if (req.file) {
        source = "image";
        uploadedPath = path.resolve(req.file.path);

        const ocrResult = await extractTextFromImage(uploadedPath);
        if (ocrResult.status === "not_a_bill") {
          return res.json(ocrResult);
        }

        text = (ocrResult.text || "").trim();
      }

      else if (req.body.text) {
        text = req.body.text.trim();
      } else {
        return res.status(400).json({ status: "error", reason: "no input provided" });
      }

      const rawTokens = text.match(/\d+%?/g) || [];
      if (rawTokens.length === 0)
        return res.json({ status: "no_amounts_found", reason: "document too noisy" });

    
      const normalized = normalizeAmounts(rawTokens);

      
      const classified = classifyAmounts(text, normalized.normalized_amounts);
      const currency = detectCurrency(text);

      const response = buildFinalResponse(currency, classified);

      res.json(response);
    } catch (err) {
      console.error(" Step 4 failed:", err);
      res.status(500).json({ status: "error", reason: err.message });
    } finally {
      if (uploadedPath && fs.existsSync(uploadedPath)) {
        await fs.promises.unlink(uploadedPath).catch(() => {});
      }
    }
  });

  return router;
};
