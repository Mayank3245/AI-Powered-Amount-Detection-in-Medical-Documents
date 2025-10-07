import "dotenv/config";

export async function aiValidateAmounts(ocrText, extractedAmounts) {
  const amountsForAI = extractedAmounts || [];

  const prompt = `
You are an AI assistant that extracts all monetary amounts from an invoice, receipt, or bill. 
Read the text carefully, correct any OCR mistakes (like T0tal -> Total, Il -> 1), 
and assign a type to each amount: total_bill, paid, due, subtotal, tax, discount. 
If uncertain, label as "unknown". 

OCR Text:
${ocrText}

Already extracted amounts:
${JSON.stringify(amountsForAI)}

Return a JSON array with each amount as:
[
  { "type": "<label>", "value": <number>, "confidence": <0-1> }
]
Include all amounts found in the text, even if they were missed by OCR.
`;
const apiKey = process.env.GEMINI_API_KEY;
const url = process.env.GEMINI_API_URL;

if (!apiKey || !url) throw new Error("AI API key or URL not configured");


  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    const aiOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "[]";

    const jsonMatch = aiOutput.match(/\[.*\]/s);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return { amounts: parsed, confidence: 0.95 };
  } catch (err) {
    return { amounts: amountsForAI, confidence: 0.8 };
  }
}
