export function classifyAmounts(text, normalized = []) {
  const lines = text.split(/\r?\n/);
  const results = [];

  for (const line of lines) {
    if (!line.includes(":")) continue;


    const [labelRaw, valueRaw] = line.split(":").map(x => x.trim());
    if (!labelRaw || !valueRaw) continue;

    const match = valueRaw.match(/\d+(\.\d+)?/);
    if (!match) continue;

    const numValue = parseFloat(match[0]);

    const type = labelRaw
      .toLowerCase()
      .replace(/[^a-z\s]/g, "") 
      .trim()
      .replace(/\s+/g, "_");

   
    results.push({
      type: type || "unknown",
      value: numValue,
      source: `text: '${line.trim()}'`,
      confidence: 0.9
    });
  }

 
  if (results.length === 0 && normalized.length > 0) {
    for (const n of normalized) {
      results.push({ type: "unknown", value: n, confidence: 0.75 });
    }
  }

  return { amounts: results, confidence: 0.9 };
}
