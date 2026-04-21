function normalizeText(text) {
  return (text || "")
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .trim();
}

function cleanNumber(value) {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function firstUsefulLines(text, limit = 8) {
  return normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function uniqueByRaw(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.raw || `${item.test_name}-${item.value}-${item.unit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractLabData(text) {
  const lines = normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const measurements = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, " ").trim();

    const match = line.match(
      /^([A-Za-zÀ-ÿ0-9()./%µμ+\-\s]{2,80}?)(?:\s{2,}|\s*[:=]\s*|\s+-\s+)(-?\d+(?:[.,]\d+)?)(?:\s*([A-Za-z%/µμ°²³0-9.-]+))?$/
    );

    if (!match) continue;

    const testName = match[1].trim();
    const value = cleanNumber(match[2]);
    const unit = (match[3] || "").trim();

    if (!testName || value === null) continue;
    if (testName.length < 2) continue;
    if (/date|heure|age|telephone/i.test(testName)) continue;

    measurements.push({
      test_name: testName,
      value,
      unit,
      raw: rawLine,
    });
  }

  const uniqueMeasurements = uniqueByRaw(measurements).slice(0, 30);

  return {
    kind: "LAB",
    summary:
      uniqueMeasurements.length > 0
        ? `${uniqueMeasurements.length} valeur(s) biologique(s) extraite(s)`
        : "Aucune valeur biologique structurée détectée",
    measurements: uniqueMeasurements,
    key_lines: firstUsefulLines(text, 10),
  };
}

function extractRadiologyData(text) {
  const lines = normalizeText(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const findingLines = lines.slice(0, 10);

  let conclusion = "";
  const conclusionIndex = lines.findIndex((line) =>
    /conclusion|impression|synthese|synthèse/i.test(line)
  );

  if (conclusionIndex >= 0) {
    conclusion = lines.slice(conclusionIndex, conclusionIndex + 3).join(" ");
  } else if (lines.length > 0) {
    conclusion = lines.slice(-2).join(" ");
  }

  return {
    kind: "RADIOLOGY",
    summary: conclusion || "Résumé radiologique non détecté",
    conclusion,
    findings: findingLines,
  };
}

function captureSection(text, patterns) {
  const lines = normalizeText(text).split("\n");
  const startIndex = lines.findIndex((line) =>
    patterns.some((pattern) => pattern.test(line))
  );

  if (startIndex < 0) return "";

  const collected = [];
  for (let i = startIndex; i < lines.length; i += 1) {
    const current = lines[i].trim();
    if (!current) break;
    if (
      i > startIndex &&
      /^(motif|sympt|examen|diagnostic|plan|note|conclusion)[:\s]/i.test(current)
    ) {
      break;
    }
    collected.push(current);
    if (collected.length >= 4) break;
  }

  return collected.join(" ");
}

function extractConsultData(text) {
  const motif = captureSection(text, [/^motif[:\s]/i, /^reason[:\s]/i]);
  const symptoms = captureSection(text, [/^sympt/i, /^plainte/i]);
  const diagnosis = captureSection(text, [/^diagnostic[:\s]/i]);
  const plan = captureSection(text, [/^plan[:\s]/i, /^conduite/i]);

  const keyPoints = firstUsefulLines(text, 8);

  return {
    kind: "CONSULT",
    summary: diagnosis || motif || keyPoints[0] || "Résumé de consultation non détecté",
    sections: {
      motif,
      symptoms,
      diagnosis,
      plan,
    },
    key_points: keyPoints,
  };
}

function extractOtherData(text) {
  const keyLines = firstUsefulLines(text, 10);

  return {
    kind: "OTHER",
    summary: keyLines.slice(0, 3).join(" ") || "Aucun résumé détecté",
    key_lines: keyLines,
  };
}

export function buildStructuredExtraction(docCategory, ocrText) {
  const text = normalizeText(ocrText);

  if (!text) {
    return {
      kind: docCategory || "OTHER",
      summary: "Aucun texte OCR disponible",
      key_lines: [],
    };
  }

  if (docCategory === "LAB") {
    return extractLabData(text);
  }

  if (docCategory === "RADIOLOGY") {
    return extractRadiologyData(text);
  }

  if (docCategory === "CONSULT") {
    return extractConsultData(text);
  }

  return extractOtherData(text);
}