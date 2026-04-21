function normalize(text) {
  return (text || "").replace(/\r/g, "").trim();
}

function summarizeLabExtraction(extraction) {
  const measurements = extraction?.measurements || [];
  if (measurements.length === 0) {
    return "Document biologique reçu. Valeurs structurées non détectées automatiquement. Vérification médicale recommandée.";
  }

  const preview = measurements
    .slice(0, 6)
    .map((item) => `${item.test_name}: ${item.value}${item.unit ? ` ${item.unit}` : ""}`)
    .join("\n");

  return `Résumé biologique automatique\n\n${preview}\n\nConclusion automatique: ${extraction.summary || "Analyse biologique reçue."}`;
}

function summarizeRadiologyExtraction(extraction) {
  const findings = extraction?.findings || [];
  const findingText = findings.length > 0 ? findings.slice(0, 5).join("\n") : "Aucun élément détaillé détecté.";

  return `Résumé radiologique automatique\n\nConclusion: ${extraction?.conclusion || extraction?.summary || "Non détectée"}\n\nÉléments clés:\n${findingText}`;
}

function summarizeConsultExtraction(extraction) {
  const sections = extraction?.sections || {};

  return [
    "Résumé de consultation automatique",
    "",
    `Motif: ${sections.motif || "—"}`,
    `Symptômes: ${sections.symptoms || "—"}`,
    `Diagnostic: ${sections.diagnosis || extraction?.summary || "—"}`,
    `Plan: ${sections.plan || "—"}`,
  ].join("\n");
}

function summarizeOtherExtraction(extraction, doc) {
  const keyLines = extraction?.key_lines || [];
  const fallbackLines = keyLines.length > 0 ? keyLines.slice(0, 6).join("\n") : "Aucun contenu textuel structuré détecté.";

  return [
    "Résumé automatique du document",
    "",
    `Fichier: ${doc?.file_name || "—"}`,
    `Catégorie: ${doc?.doc_category || "Autre"}`,
    `Source: ${doc?.source || "—"}`,
    "",
    fallbackLines,
  ].join("\n");
}

export function generateHeuristicSummary(doc) {
  const extraction = doc?.ocr_extracted || null;
  const ocrText = normalize(doc?.ocr_text || "");

  if (extraction?.kind === "LAB") {
    return summarizeLabExtraction(extraction);
  }

  if (extraction?.kind === "RADIOLOGY") {
    return summarizeRadiologyExtraction(extraction);
  }

  if (extraction?.kind === "CONSULT") {
    return summarizeConsultExtraction(extraction);
  }

  if (extraction?.kind) {
    return summarizeOtherExtraction(extraction, doc);
  }

  if (ocrText) {
    const lines = ocrText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12);

    return [
      "Résumé automatique basé sur le texte OCR",
      "",
      ...lines,
    ].join("\n");
  }

  return [
    "Résumé automatique minimal",
    "",
    `Fichier: ${doc?.file_name || "—"}`,
    `Catégorie: ${doc?.doc_category || "Non classé"}`,
    `Source: ${doc?.source || "—"}`,
    "",
    "Aucun texte OCR disponible, mais le document est bien enregistré et prêt pour revue manuelle.",
  ].join("\n");
}
