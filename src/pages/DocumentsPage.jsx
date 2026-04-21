import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Search,
  Upload,
  XCircle,
} from "lucide-react";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { supabase } from "../supabase/client";
import {
  getDocumentSignedUrl,
  getDocuments,
  markDocumentReviewed,
  updateDocumentCategory,
  updateDocumentStatus,
  uploadDocument,
} from "../services/documentService";

function patientLabel(doc) {
  return [doc.patients?.nom, doc.patients?.prenom].filter(Boolean).join(" ") || "Sans patient";
}

export default function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const patientQuery = searchParams.get("patient") || "";

  const [patients, setPatients] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);

  const [file, setFile] = useState(null);
  const [patientId, setPatientId] = useState(patientQuery);
  const [uploadPatientSearch, setUploadPatientSearch] = useState("");
  const [source, setSource] = useState("Envoi manuel");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [ocrFilter, setOcrFilter] = useState("ALL");
  const [reviewedFilter, setReviewedFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [patientFilter, setPatientFilter] = useState(patientQuery);

  useEffect(() => {
    setPatientFilter(patientQuery);
    if (patientQuery) {
      setPatientId(patientQuery);
    }
  }, [patientQuery]);

  async function loadData() {
    setLoading(true);
    try {
      const [patientsRes, documentsData] = await Promise.all([
        supabase
          .from("patients")
          .select("id, nom, prenom, telephone")
          .order("nom", { ascending: true })
          .order("prenom", { ascending: true }),
        getDocuments(),
      ]);

      if (patientsRes.error) throw patientsRes.error;

      const nextPatients = patientsRes.data || [];
      setPatients(nextPatients);
      setDocuments(documentsData || []);

      if (patientQuery) {
        const matched = nextPatients.find((p) => p.id === patientQuery);
        if (matched) {
          setUploadPatientSearch([matched.nom, matched.prenom].filter(Boolean).join(" "));
        }
      }
    } catch (error) {
      setMessage(error.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedUploadPatient = useMemo(() => {
    return patients.find((p) => p.id === patientId) || null;
  }, [patients, patientId]);

  const filteredUploadPatients = useMemo(() => {
    const q = uploadPatientSearch.toLowerCase().trim();
    if (!q) return patients.slice(0, 12);

    return patients
      .filter((p) =>
        [p.nom, p.prenom, p.telephone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 12);
  }, [patients, uploadPatientSearch]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    setSaving(true);
    setMessage("");

    try {
      await uploadDocument({
        file,
        patientId,
        source,
        statut: "À valider",
      });

      setFile(null);
      if (!patientQuery) {
        setPatientId("");
        setUploadPatientSearch("");
      }
      setSource("Envoi manuel");
      setMessage("Document envoyé avec succès");

      const input = document.getElementById("documents-upload-input");
      if (input) input.value = "";

      await loadData();
    } catch (error) {
      setMessage(error.message || "Erreur pendant l’envoi");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpen(filePath) {
    try {
      const url = await getDocumentSignedUrl(filePath);
      if (url) window.open(url, "_blank");
    } catch (error) {
      setMessage(error.message || "Impossible d'ouvrir le document");
    }
  }

  async function handleSetCategory(docId, category) {
    setWorkingId(docId);
    setMessage("");
    try {
      await updateDocumentCategory(docId, category);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Erreur de classification");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleSetStatus(docId, statut) {
    setWorkingId(docId);
    setMessage("");
    try {
      await updateDocumentStatus(docId, statut);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Erreur de statut");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleMarkReviewed(docId) {
    setWorkingId(docId);
    setMessage("");
    try {
      await markDocumentReviewed(docId);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Erreur de validation");
    } finally {
      setWorkingId(null);
    }
  }

  function handleSelectUploadPatient(patient) {
    setPatientId(patient.id);
    setUploadPatientSearch([patient.nom, patient.prenom].filter(Boolean).join(" "));
  }

  function handleClearUploadPatient() {
    if (patientQuery) return;
    setPatientId("");
    setUploadPatientSearch("");
  }

  const effectivePatientFilter = patientQuery || patientFilter;

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
        doc.file_type,
        patientName,
        doc.doc_category,
        doc.ocr_status,
        doc.statut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesCategory =
        categoryFilter === "ALL" ||
        (doc.doc_category || "OTHER") === categoryFilter;
      const matchesOcr =
        ocrFilter === "ALL" || (doc.ocr_status || "PENDING") === ocrFilter;
      const matchesReviewed =
        reviewedFilter === "ALL" ||
        (reviewedFilter === "YES" ? !!doc.reviewed : !doc.reviewed);
      const matchesStatus =
        statusFilter === "ALL" || (doc.statut || "À valider") === statusFilter;
      const matchesPatient = !effectivePatientFilter || doc.patient_id === effectivePatientFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesOcr &&
        matchesReviewed &&
        matchesStatus &&
        matchesPatient
      );
    });
  }, [documents, search, categoryFilter, ocrFilter, reviewedFilter, statusFilter, patientFilter, patientQuery]);

  const stats = useMemo(() => {
    return {
      total: documents.length,
      reviewed: documents.filter((d) => d.reviewed).length,
      pendingReview: documents.filter((d) => !d.reviewed).length,
      pendingOcr: documents.filter((d) => (d.ocr_status || "PENDING") === "PENDING").length,
      lab: documents.filter((d) => d.doc_category === "LAB").length,
      radio: documents.filter((d) => d.doc_category === "RADIOLOGY").length,
      consult: documents.filter((d) => d.doc_category === "CONSULT").length,
      validated: documents.filter((d) => d.statut === "Validé").length,
      toValidate: documents.filter((d) => d.statut === "À valider").length,
      unreadable: documents.filter((d) => d.statut === "Illisible").length,
    };
  }, [documents]);

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold">Documents</h2>
        <p className="text-sm text-slate-500">
          Envoi manuel + triage documentaire + revue clinique
        </p>
      </header>

      {message ? (
        <div className="mb-6 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-9">
        <Card title="Total" subtitle="Tous" icon={FileText}>
          <div className="text-3xl font-bold">{stats.total}</div>
        </Card>

        <Card title="À revoir" subtitle="Non vérifiés" icon={FileText}>
          <div className="text-3xl font-bold">{stats.pendingReview}</div>
        </Card>

        <Card title="OCR" subtitle="En attente" icon={FileText}>
          <div className="text-3xl font-bold">{stats.pendingOcr}</div>
        </Card>

        <Card title="LAB" subtitle="Classés" icon={FileText}>
          <div className="text-3xl font-bold">{stats.lab}</div>
        </Card>

        <Card title="RADIO" subtitle="Classés" icon={FileText}>
          <div className="text-3xl font-bold">{stats.radio}</div>
        </Card>

        <Card title="CONSULT" subtitle="Classés" icon={FileText}>
          <div className="text-3xl font-bold">{stats.consult}</div>
        </Card>

        <Card title="Validés" subtitle="Statut" icon={CheckCircle2}>
          <div className="text-3xl font-bold">{stats.validated}</div>
        </Card>

        <Card title="À valider" subtitle="Statut" icon={FileText}>
          <div className="text-3xl font-bold">{stats.toValidate}</div>
        </Card>

        <Card title="Illisibles" subtitle="Statut" icon={AlertTriangle}>
          <div className="text-3xl font-bold">{stats.unreadable}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card title="Envoi manuel" subtitle="Ajouter un document" icon={Upload}>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Fichier
              </label>
              <input
                id="documents-upload-input"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Rechercher un patient
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={uploadPatientSearch}
                  onChange={(e) => setUploadPatientSearch(e.target.value)}
                  placeholder="Nom, prénom ou téléphone..."
                  className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="mt-3 max-h-56 space-y-2 overflow-auto rounded-2xl border border-slate-200 p-2">
                <button
                  type="button"
                  onClick={handleClearUploadPatient}
                  disabled={!!patientQuery}
                  className={`w-full rounded-xl p-3 text-left transition ${
                    !patientId ? "bg-sky-50" : "hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div className="font-medium">Sans patient</div>
                  <div className="text-xs text-slate-500">Document non lié pour le moment</div>
                </button>

                {filteredUploadPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectUploadPatient(p)}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      patientId === p.id ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-medium">
                      {[p.nom, p.prenom].filter(Boolean).join(" ")}
                    </div>
                    <div className="text-xs text-slate-500">{p.telephone || "Sans téléphone"}</div>
                  </button>
                ))}

                {filteredUploadPatients.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500">Aucun patient trouvé</div>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {selectedUploadPatient ? (
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                    Patient sélectionné : <span className="font-medium">{[selectedUploadPatient.nom, selectedUploadPatient.prenom].filter(Boolean).join(" ")}</span>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                    Aucun patient sélectionné
                  </div>
                )}

                {patientId && !patientQuery ? (
                  <button
                    type="button"
                    onClick={handleClearUploadPatient}
                    className="rounded-2xl border border-red-300 px-4 py-3 text-sm font-medium text-red-600"
                  >
                    <XCircle className="mr-2 inline h-4 w-4" />
                    Retirer le patient
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Source
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Envoi..." : "Envoyer le document"}
            </button>
          </form>
        </Card>

        <Card title="Documents reçus" subtitle="Liste complète + filtres" icon={FileText}>
          {loading ? (
            <div>Chargement...</div>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-6">
                <div className="relative lg:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher fichier, patient, source..."
                    className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
                  />
                </div>

                <select
                  value={patientFilter}
                  onChange={(e) => setPatientFilter(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">Tous patients</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {[p.nom, p.prenom].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="ALL">Tous types</option>
                  <option value="LAB">LAB</option>
                  <option value="RADIOLOGY">RADIO</option>
                  <option value="CONSULT">CONSULT</option>
                  <option value="OTHER">OTHER</option>
                </select>

                <select
                  value={reviewedFilter}
                  onChange={(e) => setReviewedFilter(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="ALL">Tous</option>
                  <option value="YES">Vérifiés</option>
                  <option value="NO">À revoir</option>
                </select>

                <select
                  value={ocrFilter}
                  onChange={(e) => setOcrFilter(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="ALL">Tous OCR</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="FAILED">FAILED</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="ALL">Tous statuts doc</option>
                  <option value="À valider">À valider</option>
                  <option value="Validé">Validé</option>
                  <option value="Illisible">Illisible</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{patientLabel(doc)}</p>
                        <p className="mt-1 text-sm text-slate-600">{doc.file_name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {doc.source} • {new Date(doc.created_at).toLocaleString("fr-FR")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          color={
                            doc.statut === "Validé"
                              ? "green"
                              : doc.statut === "Illisible"
                              ? "amber"
                              : "blue"
                          }
                        >
                          {doc.statut || "À valider"}
                        </Badge>

                        <button
                          type="button"
                          onClick={() => handleOpen(doc.file_path)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium"
                        >
                          <ExternalLink className="inline h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border px-2 py-1">
                        Type : {doc.doc_category || "Non classé"}
                      </span>

                      <span className="rounded-full border px-2 py-1">
                        OCR : {doc.ocr_status || "PENDING"}
                      </span>

                      <span className="rounded-full border px-2 py-1">
                        IA : {doc.ai_summary_status || "NONE"}
                      </span>

                      {doc.reviewed ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                          ✔ Vérifié
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                          À revoir
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(doc.id, "À valider")}
                        disabled={workingId === doc.id}
                        className="rounded-xl border px-3 py-2 text-xs"
                      >
                        À valider
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(doc.id, "Validé")}
                        disabled={workingId === doc.id}
                        className="rounded-xl border border-green-300 px-3 py-2 text-xs font-medium text-green-700"
                      >
                        Validé
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetStatus(doc.id, "Illisible")}
                        disabled={workingId === doc.id}
                        className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700"
                      >
                        Illisible
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetCategory(doc.id, "LAB")}
                        disabled={workingId === doc.id}
                        className="rounded-xl border px-3 py-2 text-xs"
                      >
                        LAB
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetCategory(doc.id, "RADIOLOGY")}
                        disabled={workingId === doc.id}
                        className="rounded-xl border px-3 py-2 text-xs"
                      >
                        RADIO
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetCategory(doc.id, "CONSULT")}
                        disabled={workingId === doc.id}
                        className="rounded-xl border px-3 py-2 text-xs"
                      >
                        CONSULT
                      </button>

                      {!doc.reviewed ? (
                        <button
                          type="button"
                          onClick={() => handleMarkReviewed(doc.id)}
                          disabled={workingId === doc.id}
                          className="rounded-xl border border-green-300 px-3 py-2 text-xs font-medium text-green-700"
                        >
                          <CheckCircle2 className="mr-1 inline h-4 w-4" />
                          Marquer vérifié
                        </button>
                      ) : null}

                      {doc.patient_id ? (
                        <Link
                          to={`/patients/${doc.patient_id}`}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                        >
                          Ouvrir patient
                        </Link>
                      ) : null}

                      <Link
                        to={`/documents/${doc.id}/review`}
                        className="rounded-xl border border-sky-300 px-3 py-2 text-xs font-medium text-sky-700"
                      >
                        Revoir
                      </Link>
                    </div>

                    {doc.ai_summary ? (
                      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                        <strong>Résumé enregistré :</strong>
                        <pre className="mt-2 whitespace-pre-wrap">
                          {doc.ai_summary.slice(0, 1000)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                ))}

                {filteredDocuments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun document trouvé
                  </div>
                ) : null}
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}