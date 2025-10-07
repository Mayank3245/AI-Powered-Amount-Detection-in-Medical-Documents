import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "fs";

function contextualOCRFix(text) {
  const chars = text.split("");
  const fixed = [];
  const isDigit = c => /[0-9]/.test(c);
  const isLetter = c => /[A-Za-z]/.test(c);

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const prev = chars[i - 1] || " ";
    const next = chars[i + 1] || " ";

    if (c === "5" && isLetter(next)) { fixed.push("S"); continue; }
    if (c === "0" && isLetter(next)) { fixed.push("O"); continue; }
    if (c === "1" && isLetter(next)) { fixed.push("l"); continue; }
    if (c === "8" && isLetter(next)) { fixed.push("B"); continue; }

    if ((c === "O" || c === "o") && (isDigit(prev) || isDigit(next))) { fixed.push("0"); continue; }
    if ((c === "I" || c === "l") && (isDigit(prev) || isDigit(next))) { fixed.push("1"); continue; }
    if (c === "S" && (isDigit(prev) || isDigit(next))) { fixed.push("5"); continue; }
    if (c === "B" && (isDigit(prev) || isDigit(next))) { fixed.push("8"); continue; }

    fixed.push(c);
  }

  return fixed.join("");
}

function correctNumericValues(text) {
  return text.replace(/\b(\d+)(?=\D|$)/g, (match, num) => {
    let val = num;
    if (val.length === 1 && /Discount|Disc/i.test(text)) return val + "0";
    if (/Final|Amount|Total/i.test(text)) val = val.replace(/8$/, "0");
    if (val.length === 1 && parseInt(val) < 10) return val + "0";
    return val;
  });
}

export async function extractTextFromImage(imagePath) {
  const processedPath = imagePath + "_processed.png";
  const BILL_KEYWORDS = [
    "total", "amount", "paid", "due", "bill", "invoice",
    "rent", "payment", "charge", "discount", "subtotal", "balance"
  ];

  try {
    await sharp(imagePath)
      .flatten({ background: "#ffffff" })
      .grayscale()
      .normalize()
      .sharpen()
      .resize(1200)
      .toFile(processedPath);

    const result = await Tesseract.recognize(processedPath, "eng");
    let text = result.data.text || "";

    // Digit-weighted confidence with 2 decimal precision
    let confidence = 0;
    if (Array.isArray(result.data.words) && result.data.words.length > 0) {
      const words = result.data.words;
      const digitWords = words.filter(w => /\d/.test(w.text));
      const targetWords = digitWords.length > 0 ? digitWords : words;
      const avgConf =
        targetWords.reduce((sum, w) => sum + (w.confidence || 0), 0) /
        targetWords.length;
      confidence = +(avgConf / 100).toFixed(2);
    } else {
      confidence = +((result.data.confidence || 0) / 100).toFixed(2);
    }

    text = contextualOCRFix(text)
      .replace(/%\s*(\d+)/g, " ₹$1")
      .replace(/[#*@^~_`<>\\{}|]/g, "")
      .replace(/\b1NR\b/gi, "INR")
      .replace(/\bIINR\b/gi, "INR")
      .replace(/\bT0ta1|T0tal|Tota1|T0taI/gi, "Total")
      .replace(/\bPa1d|Pald|PaId\b/gi, "Paid")
      .replace(/\bDve|Duee?\b/gi, "Due")
      .replace(/\bAm0unt\b/gi, "Amount")
      .replace(/\b8i11\b/gi, "Bill")
      .replace(/\b5ubtotal\b/gi, "Subtotal");

    text = correctNumericValues(text)
      .replace(/\s{2,}/g, " ")
      .replace(/(@|#|&|e{2,}|o{2,})+/gi, "000")
      .replace(/\b(\d)(\d{2})%/g, "$1.$2%")
      .trim();

    const lower = text.toLowerCase();
    const isBill = BILL_KEYWORDS.some(word => lower.includes(word));

    if (!isBill) {
      return {
        status: "not_a_bill",
        reason: "No bill-related keywords found",
        text,
        confidence
      };
    }

    return { text, confidence };
  } catch {
    return { text: "", confidence: 0 };
  } finally {
    setTimeout(async () => {
      if (fs.existsSync(processedPath)) {
        await fs.promises.unlink(processedPath).catch(() => {});
      }
    }, 300);
  }
}
