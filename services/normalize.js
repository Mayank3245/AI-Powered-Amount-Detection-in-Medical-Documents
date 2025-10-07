export function normalizeAmounts(rawTokens) {
  if (!Array.isArray(rawTokens) || rawTokens.length === 0) {
    return { normalized_amounts: [], normalization_confidence: 0 };
  }

  const cleaned = rawTokens.map(token => {
    let num = token.replace(/[₹$,]/g, "").replace(/[^0-9.]/g, "");
    if ((num.match(/\./g) || []).length > 1) num = num.replace(/\./g, "");
    if (num.endsWith(".")) num = num.slice(0, -1);
    const val = parseFloat(num);
    return isNaN(val) ? null : val;
  });

  const normalized_amounts = cleaned.filter(v => v && v > 0);

  let normalization_confidence = 0.9;
  if (normalized_amounts.length === 0) normalization_confidence = 0;
  else if (normalized_amounts.length < rawTokens.length / 2)
    normalization_confidence = 0.7;

  return {
    normalized_amounts,
    normalization_confidence: +normalization_confidence.toFixed(2)
  };
}
