export function buildFinalResponse(currency, classified) {
  return {
    currency,
    amounts: classified.amounts,
    status: "ok"
  };
}

export function detectCurrency(text) {
  const lower = text.toLowerCase();
  if (lower.includes("inr") || lower.includes("rs") || lower.includes("₹")) return "INR";
  if (lower.includes("usd") || lower.includes("$")) return "USD";
  if (lower.includes("eur") || lower.includes("€")) return "EUR";
  if (lower.includes("gbp") || lower.includes("£")) return "GBP";
  return "UNKNOWN";
}
