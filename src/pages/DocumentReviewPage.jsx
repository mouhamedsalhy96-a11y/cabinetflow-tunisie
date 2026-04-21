import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { generateHeuristicSummary } from "../utils/documentHeuristics";
import { buildStructuredExtraction } from "../utils/documentExtractionUtils";
import {
  getDocumentById,
  getDocumentSignedUrl,
  updateDocumentReviewFields,
} from "../services/documentService";

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

export default function DocumentReviewPage() {
  const { id } = useParams();

  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [summaryDraft, setSummaryDraft] = useState("");
  const [doctorNote, setDoctorNote] = useState("");
  const [extractionPreview, setExtractionPreview] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getDocumentById(id);
      setDoc(data);
      setSummaryDraft(data.ai_summary || "");
      setDoctorNote(data.doctor_note || "");
      setExtractionPreview(data.ocr_extracted || null);
    } catch (error) {
      setMessage(error.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleOpen() {
    try {
      const url = await getDocumentSignedUrl(doc.file_path);
      if (url) window.open(url, "_blank");
    } catch (error) {
      setMessage(error.message || "Impossible d'ouvrir le document");
    }
  }

  function handleGenerateDraft() {
    if (!doc) return;
    const generated = generateHeuristicSummary({
      ...doc,
      ai_summary: summaryDraft,
    });
    setSummaryDraft(generated);
    setMessage("Brouillon généré localement");
  }

  function handleExtractStructured() {
    if (!doc) return;
    const extracted = buildStructuredExtraction(doc.doc_category, doc.ocr_text || "");
    setExtractionPreview(extracted);
    setMessage("Extraction structurée régénérée");
  }

  async function handleSaveDraft() {
    if (!doc) return;

    setSaving(true);
    setMessage("");
    try {
      const updated = await updateDocumentReviewFields(doc.id, {
        ai_summary: summaryDraft,
        ai_summary_status: summaryDraft ? "DRAFT" : "NONE",
        doctor_note: doctorNote,
        ocr_extracted: extractionPreview,
      });

      setDoc(updated);
      setMessage("Brouillon enregistré");
    } catch (error) {
      setMessage(error.message || "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmReview() {
    if (!doc) return;

    setSaving(true);
    setMessage("");
    try {
      const updated = await updateDocumentReviewFields(doc.id, {
        ai_summary: summaryDraft,
        ai_summary_status: summaryDraft ? "CONFIRMED" : "NONE",
        doctor_note: doctorNote,
        reviewed: true,
        reviewed_at: new Date().toISOString(),
        ocr_extracted: extractionPreview,
      });

      setDoc(updated);
      setMessage("Document confirmé et vérifié");
    } catch (error) {
      setMessage(error.message || "Erreur de confirmation");
    } finally {
      setSaving(false);
    }
  }

  const ocrSummary = useMemo(() => {
    if (!doc?.ocr_text) return "Aucun texte OCR disponible";
    return `${doc.ocr_text.length} caractères OCR disponibles`;
  }, [doc]);

  if (loading) return <div>Chargement...</div>;
  if (!doc) return <div>Document introuvable</div>;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <button
          onClick={handleOpen}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir le document
        </button>
      </div>

      {message ? (
        <div className="mb-6 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card title="Résumé document" subtitle={doc.file_name} icon={FileText}>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <div className="text-xs text-slate-400">Patient</div>
              <div className="font-medium">
                {[doc.patients?.nom, doc.patients?.prenom]
                  .filter(Boolean)
                  .join(" ") || "Sans patient"}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Source</div>
              <div className="font-medium">{doc.source || "—"}</div>
            </div>

            <div>
              <div className="text-xs text-slate-400">OCR</div>
              <div className="font-medium">{ocrSummary}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge color="blue">{doc.doc_category || "Non classé"}</Badge>
              <Badge color="amber">{doc.ocr_status || "PENDING"}</Badge>
              <Badge color={doc.ai_summary_status === "CONFIRMED" ? "green" : "blue"}>
                {doc.ai_summary_status || "NONE"}
              </Badge>
              {doc.reviewed ? (
                <Badge color="green">Vérifié</Badge>
              ) : (
                <Badge color="amber">À revoir</Badge>
              )}
            </div>
          </div>
        </Card>

        <Card title="Revue clinique" subtitle="Brouillon + validation" icon={Sparkles}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateDraft}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
              >
                <Sparkles className="mr-2 inline h-4 w-4" />
                Générer brouillon
              </button>

              <button
                onClick={handleExtractStructured}
                className="rounded-2xl border border-sky-300 px-4 py-3 text-sm font-medium text-sky-700"
              >
                Extraire structure
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Brouillon de résumé
              </label>
              <textarea
                rows="10"
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Note médecin
              </label>
              <textarea
                rows="6"
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
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
                onClick={handleSaveDraft}
                disabled={saving}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer brouillon"}
              </button>

              <button
                onClick={handleConfirmReview}
                disabled={saving}
                className="rounded-2xl border border-green-300 px-4 py-3 text-sm font-medium text-green-700 disabled:opacity-60"
              >
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                Confirmer la revue
              </button>
            </div>
          </div>
        </Card>

        <div className="xl:col-span-2">
          <Card title="Texte OCR" subtitle="Lecture brute">
            {doc.ocr_text ? (
              <pre className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                {doc.ocr_text}
              </pre>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aucun texte OCR disponible pour ce document.
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}