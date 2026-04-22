import React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  FileSearch,
  ScanLine,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import {
  getDocumentSignedUrl,
  getDocuments,
  updateDocumentOcrFields,
} from "../services/documentService";
import { buildStructuredExtraction } from "../utils/documentExtractionUtils";

const initialForm = {
  doc_category: "OTHER",
  ocr_text: "",
  ocr_operator_note: "",
};

function ocrStatusLabel(status) {
  if (status === "COMPLETED") return "Terminé";
  if (status === "FAILED") return "Échec";
  if (status === "PROCESSING") return "En cours";
  return "En attente";
}

function docCategoryLabel(category) {
  if (category === "LAB") return "Biologie";
  if (category === "RADIOLOGY") return "Radiologie";
  if (category === "CONSULT") return "Consultation";
  return "Autre";
}

function patientLabel(doc) {
  return [doc.patients?.nom, doc.patients?.prenom].filter(Boolean).join(" ") || "Sans patient";
}

function renderExtractionPreview(extraction) {
  if (!extraction) {
    return <div className="text-sm text-slate-500">Aucune extraction structurée</div>;
  }

  if (extraction.kind === "LAB") {
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-800">{extraction.summary}</div>
        <div className="space-y-2">
          {(extraction.measurements || []).map((item, index) => (
            <div
              key={`${item.test_name}-${index}`}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
            >
              <div className="font-medium">{item.test_name}</div>
              <div className="mt-1 text-slate-600">
                {item.value} {item.unit || ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (extraction.kind === "RADIOLOGY") {
    return (
      <div className="space-y-3 text-sm">
        <div>
          <div className="font-medium text-slate-800">Conclusion</div>
          <div className="mt-1 whitespace-pre-wrap text-slate-600">
            {extraction.conclusion || "—"}
          </div>
        </div>

        <div>
          <div className="font-medium text-slate-800">Éléments clés</div>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600">
            {(extraction.findings || []).map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (extraction.kind === "CONSULT") {
    return (
      <div className="space-y-3 text-sm text-slate-600">
        <div>
          <div className="font-medium text-slate-800">Résumé</div>
          <div className="mt-1">{extraction.summary || "—"}</div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="font-medium text-slate-800">Motif</div>
            <div className="mt-1">{extraction.sections?.motif || "—"}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="font-medium text-slate-800">Symptômes</div>
            <div className="mt-1">{extraction.sections?.symptoms || "—"}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="font-medium text-slate-800">Diagnostic</div>
            <div className="mt-1">{extraction.sections?.diagnosis || "—"}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="font-medium text-slate-800">Plan</div>
            <div className="mt-1">{extraction.sections?.plan || "—"}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm text-slate-600">
      <div className="font-medium text-slate-800">Résumé</div>
      <div>{extraction.summary || "—"}</div>
      {(extraction.key_lines || []).length > 0 ? (
        <ul className="list-disc space-y-1 pl-5">
          {extraction.key_lines.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function ScannerPage() {
  const [documents, setDocuments] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [extractionPreview, setExtractionPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [ocrFilter, setOcrFilter] = useState("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data || []);
      setActive((prev) => {
        if (prev) {
          const found = (data || []).find((item) => item.id === prev.id);
          if (found) return found;
        }
        return (data || [])[0] || null;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!active) {
      setForm(initialForm);
      setExtractionPreview(null);
      return;
    }

    setForm({
      doc_category: active.doc_category || "OTHER",
      ocr_text: active.ocr_text || "",
      ocr_operator_note: active.ocr_operator_note || "",
    });
    setExtractionPreview(active.ocr_extracted || null);
  }, [active]);

  const stats = useMemo(() => {
    return {
      total: documents.length,
      pending: documents.filter((d) => (d.ocr_status || "PENDING") === "PENDING").length,
      processing: documents.filter((d) => d.ocr_status === "PROCESSING").length,
      completed: documents.filter((d) => d.ocr_status === "COMPLETED").length,
      failed: documents.filter((d) => d.ocr_status === "FAILED").length,
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const q = search.toLowerCase().trim();

    return documents.filter((doc) => {
      const patientName = [doc.patients?.nom, doc.patients?.prenom]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const text = [
        doc.file_name,
        doc.source,
        doc.doc_category,
        doc.ocr_status,
        patientName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesOcr =
        ocrFilter === "ALL" || (doc.ocr_status || "PENDING") === ocrFilter;

      return matchesSearch && matchesOcr;
    });
  }, [documents, search, ocrFilter]);

  async function handleOpenDocument() {
    if (!active) return;

    const url = await getDocumentSignedUrl(active.file_path);
    if (url) window.open(url, "_blank");
  }

  function handleExtractStructured() {
    const extracted = buildStructuredExtraction(form.doc_category, form.ocr_text);
    setExtractionPreview(extracted);
  }

  async function handleMarkProcessing() {
    if (!active) return;

    setSaving(true);
    try {
      const updated = await updateDocumentOcrFields(active.id, {
        doc_category: form.doc_category,
        ocr_status: "PROCESSING",
        ocr_text: form.ocr_text,
        ocr_operator_note: form.ocr_operator_note,
        ocr_extracted: extractionPreview,
      });

      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveCompleted() {
    if (!active) return;

    setSaving(true);
    try {
      const extracted = extractionPreview || buildStructuredExtraction(form.doc_category, form.ocr_text);
      const updated = await updateDocumentOcrFields(active.id, {
        doc_category: form.doc_category,
        ocr_status: "COMPLETED",
        ocr_text: form.ocr_text,
        ocr_operator_note: form.ocr_operator_note,
        ocr_extracted: extracted,
      });

      await loadData();
      setActive(updated);
      setExtractionPreview(updated.ocr_extracted || extracted);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkFailed() {
    if (!active) return;

    setSaving(true);
    try {
      const updated = await updateDocumentOcrFields(active.id, {
        doc_category: form.doc_category,
        ocr_status: "FAILED",
        ocr_operator_note: form.ocr_operator_note,
        ocr_extracted: extractionPreview,
      });

      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  function ocrBadgeColor(status) {
    if (status === "COMPLETED") return "green";
    if (status === "FAILED") return "amber";
    if (status === "PROCESSING") return "blue";
    return "slate";
  }

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold">Scan & OCR</h2>
        <p className="text-sm text-slate-500">
          Atelier de traitement OCR et d’extraction structurée
        </p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card title="Total" subtitle="Documents" icon={ScanLine}>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>

        <Card title="En attente" subtitle="OCR" icon={ScanLine}>
          <div className="text-3xl font-bold">{stats.pending}</div>
        </Card>

        <Card title="En cours" subtitle="OCR" icon={ScanLine}>
          <div className="text-3xl font-bold">{stats.processing}</div>
        </Card>

        <Card title="Terminés" subtitle="OCR" icon={ScanLine}>
          <div className="text-3xl font-bold">{stats.completed}</div>
        </Card>

        <Card title="Échec" subtitle="OCR" icon={XCircle}>
          <div className="text-3xl font-bold">{stats.failed}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="File d’attente OCR" subtitle="Recherche et filtre" icon={FileSearch}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher patient, fichier, source..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={ocrFilter}
              onChange={(e) => setOcrFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="ALL">Tous les statuts OCR</option>
              <option value="PENDING">En attente</option>
              <option value="PROCESSING">En cours</option>
              <option value="COMPLETED">Terminé</option>
              <option value="FAILED">Échec</option>
            </select>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="space-y-3">
                {filteredDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setActive(doc)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active?.id === doc.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{patientLabel(doc)}</p>
                        <p className="mt-1 text-sm text-slate-600">{doc.file_name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {doc.source || "—"} • {docCategoryLabel(doc.doc_category)}
                        </p>
                      </div>

                      <Badge color={ocrBadgeColor(doc.ocr_status || "PENDING")}>
                        {ocrStatusLabel(doc.ocr_status || "PENDING")}
                      </Badge>
                    </div>
                  </button>
                ))}

                {filteredDocuments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun document dans la file OCR
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <Card title="Traitement OCR" subtitle="Document sélectionné" icon={ScanLine}>
          {active ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">{patientLabel(active)}</div>
                <div className="mt-1">{active.file_name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {active.source || "—"} • {active.file_type || "—"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOpenDocument}
                  type="button"
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  <ExternalLink className="mr-2 inline h-4 w-4" />
                  Ouvrir document
                </button>

                <Link
                  to={`/documents/${active.id}/review`}
                  className="rounded-2xl border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700"
                >
                  <Sparkles className="mr-2 inline h-4 w-4" />
                  Aller à la revue
                </Link>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Catégorie du document
                </label>
                <select
                  value={form.doc_category}
                  onChange={(e) =>
                    setForm({ ...form, doc_category: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="LAB">Biologie</option>
                  <option value="RADIOLOGY">Radiologie</option>
                  <option value="CONSULT">Consultation</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Texte OCR
                </label>
                <textarea
                  rows="14"
                  value={form.ocr_text}
                  onChange={(e) =>
                    setForm({ ...form, ocr_text: e.target.value })
                  }
                  placeholder="Coller ici le texte OCR extrait..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Note opérateur OCR
                </label>
                <textarea
                  rows="4"
                  value={form.ocr_operator_note}
                  onChange={(e) =>
                    setForm({ ...form, ocr_operator_note: e.target.value })
                  }
                  placeholder="Qualité du scan, remarques, doute sur le contenu..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-sm font-medium text-slate-800">
                  Extraction structurée
                </div>
                {renderExtractionPreview(extractionPreview)}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleExtractStructured}
                  disabled={!form.ocr_text.trim()}
                  type="button"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                >
                  Extraire la structure
                </button>

                <button
                  onClick={handleMarkProcessing}
                  disabled={saving}
                  type="button"
                  className="rounded-2xl border border-blue-300 px-4 py-3 text-sm font-medium text-blue-700 disabled:opacity-60"
                >
                  Marquer en cours
                </button>

                <button
                  onClick={handleSaveCompleted}
                  disabled={saving}
                  type="button"
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer OCR + extraction"}
                </button>

                <button
                  onClick={handleMarkFailed}
                  disabled={saving}
                  type="button"
                  className="rounded-2xl border border-amber-300 px-4 py-3 text-sm font-medium text-amber-700 disabled:opacity-60"
                >
                  Marquer échec
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Sélectionne un document dans la file OCR
            </div>
          )}
        </Card>
      </div>
    </>
  );
}