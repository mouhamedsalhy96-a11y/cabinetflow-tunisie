import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  Inbox,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { getPatients } from "../services/patientService";
import { getDocumentSignedUrl } from "../services/documentService";
import {
  getPatientUploads,
  importPatientUploadToDocuments,
  markPatientUploadReviewed,
  rejectPatientUpload,
  updatePatientUpload,
} from "../services/patientPortalService";

const initialForm = {
  patient_id: "",
  triage_note: "",
};

function sourceLabel(sourceType) {
  if (sourceType === "LAB") return "Laboratoire";
  if (sourceType === "RADIOLOGY") return "Radiologie";
  return "Patient";
}

export default function PatientUploadsInboxPage() {
  const [searchParams] = useSearchParams();
  const patientQuery = searchParams.get("patient") || "";

  const [uploads, setUploads] = useState([]);
  const [patients, setPatients] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [patientFilter, setPatientFilter] = useState(patientQuery);

  useEffect(() => {
    setPatientFilter(patientQuery);
  }, [patientQuery]);

  async function loadData() {
    setLoading(true);
    try {
      const [uploadsData, patientsData] = await Promise.all([
        getPatientUploads(),
        getPatients(),
      ]);

      setUploads(uploadsData || []);
      setPatients(patientsData || []);
      setActive((prev) => {
        if (prev) {
          const found = (uploadsData || []).find((u) => u.id === prev.id);
          if (found) return found;
        }
        return (uploadsData || [])[0] || null;
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
      return;
    }

    setForm({
      patient_id: active.patient_id || "",
      triage_note: active.triage_note || "",
    });
  }, [active]);

  const filteredUploads = useMemo(() => {
    const q = search.toLowerCase().trim();

    return uploads.filter((upload) => {
      const patientName = [upload.patients?.nom, upload.patients?.prenom]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const text = [
        upload.file_name,
        upload.sender_name,
        upload.note,
        upload.triage_note,
        upload.source_type,
        upload.status,
        patientName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesSource =
        sourceFilter === "ALL" || (upload.source_type || "PATIENT") === sourceFilter;
      const matchesStatus =
        statusFilter === "ALL" || (upload.status || "Nouveau") === statusFilter;
      const matchesPatient =
        !patientFilter || upload.patient_id === patientFilter;

      return matchesSearch && matchesSource && matchesStatus && matchesPatient;
    });
  }, [uploads, search, sourceFilter, statusFilter, patientFilter]);

  async function handleOpen(filePath) {
    const url = await getDocumentSignedUrl(filePath);
    if (url) window.open(url, "_blank");
  }

  async function handleSaveTriage() {
    if (!active) return;

    setWorkingId(active.id);
    try {
      const updated = await updatePatientUpload(active.id, {
        patient_id: form.patient_id || null,
        triage_note: form.triage_note,
      });

      await loadData();
      setActive(updated);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleMarkReviewed() {
    if (!active) return;

    setWorkingId(active.id);
    try {
      const updated = await markPatientUploadReviewed(active.id);
      await loadData();
      setActive(updated);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleReject() {
    if (!active) return;

    const ok = window.confirm("Rejeter cet envoi ?");
    if (!ok) return;

    setWorkingId(active.id);
    try {
      const updated = await rejectPatientUpload(active.id);
      await loadData();
      setActive(updated);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleImport() {
    if (!active) return;

    setWorkingId(active.id);
    try {
      await importPatientUploadToDocuments({
        ...active,
        patient_id: form.patient_id || active.patient_id || null,
      });

      await loadData();
    } finally {
      setWorkingId(null);
    }
  }

  function sourceBadgeColor(sourceType) {
    if (sourceType === "LAB") return "blue";
    if (sourceType === "RADIOLOGY") return "amber";
    return "green";
  }

  function statusBadgeColor(status) {
    if (status === "Importé") return "green";
    if (status === "Rejeté") return "amber";
    if (status === "Vu") return "blue";
    return "blue";
  }

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold">Réception externe</h2>
        <p className="text-sm text-slate-500">
          Boîte unique pour les envois du patient, du laboratoire et de la radiologie
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Boîte de réception externe" subtitle="Recherche et filtre" icon={Inbox}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher patient, fichier, expéditeur..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="ALL">Toutes sources</option>
                <option value="PATIENT">Patient</option>
                <option value="LAB">Laboratoire</option>
                <option value="RADIOLOGY">Radiologie</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="ALL">Tous statuts</option>
                <option value="Nouveau">Nouveau</option>
                <option value="Vu">Vu</option>
                <option value="Importé">Importé</option>
                <option value="Rejeté">Rejeté</option>
              </select>
            </div>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="space-y-3">
                {filteredUploads.map((upload) => (
                  <button
                    key={upload.id}
                    onClick={() => setActive(upload)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active?.id === upload.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {[upload.patients?.nom, upload.patients?.prenom]
                            .filter(Boolean)
                            .join(" ") || "Sans patient lié"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {upload.file_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {upload.sender_name || "Expéditeur non renseigné"} •{" "}
                          {new Date(upload.created_at).toLocaleString("fr-FR")}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge color={sourceBadgeColor(upload.source_type || "PATIENT")}>
                          {sourceLabel(upload.source_type || "PATIENT")}
                        </Badge>
                        <Badge color={statusBadgeColor(upload.status || "Nouveau")}>
                          {upload.status || "Nouveau"}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredUploads.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun envoi externe
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <Card title="Triage de l’envoi" subtitle="Affectation et traitement" icon={UserPlus}>
          {active ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">
                  {[active.patients?.nom, active.patients?.prenom]
                    .filter(Boolean)
                    .join(" ") || "Sans patient lié"}
                </div>
                <div className="mt-1">{active.file_name}</div>
                <div className="mt-1">
                  Source : {sourceLabel(active.source_type || "PATIENT")}
                </div>
                <div className="mt-1">
                  Expéditeur : {active.sender_name || "Non renseigné"}
                </div>
                <div className="mt-1">
                  Statut : {active.status || "Nouveau"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(active.created_at).toLocaleString("fr-FR")}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpen(active.file_path)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  <ExternalLink className="mr-2 inline h-4 w-4" />
                  Ouvrir le fichier
                </button>

                {active.patient_id ? (
                  <Link
                    to={`/patients/${active.patient_id}`}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Ouvrir le patient
                  </Link>
                ) : null}

                {active.imported_document_id ? (
                  <Link
                    to={`/documents/${active.imported_document_id}/review`}
                    className="rounded-2xl border border-sky-300 px-4 py-2 text-sm font-medium text-sky-700"
                  >
                    Voir le document importé
                  </Link>
                ) : null}
              </div>

              {active.note ? (
                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                  <div className="font-medium text-slate-800">Note envoyée</div>
                  <div className="mt-2 whitespace-pre-wrap">{active.note}</div>
                </div>
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Lier à un patient
                </label>
                <select
                  value={form.patient_id}
                  onChange={(e) =>
                    setForm({ ...form, patient_id: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">Sans patient lié</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {[p.nom, p.prenom].filter(Boolean).join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Note de triage
                </label>
                <textarea
                  rows="5"
                  value={form.triage_note}
                  onChange={(e) =>
                    setForm({ ...form, triage_note: e.target.value })
                  }
                  placeholder="Analyse, remarque, action à faire..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSaveTriage}
                  disabled={workingId === active.id}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  Enregistrer triage
                </button>

                <button
                  type="button"
                  onClick={handleMarkReviewed}
                  disabled={workingId === active.id}
                  className="rounded-2xl border border-blue-300 px-4 py-3 text-sm font-medium text-blue-700 disabled:opacity-60"
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                  Marquer vu
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={workingId === active.id}
                  className="rounded-2xl border border-green-300 px-4 py-3 text-sm font-medium text-green-700 disabled:opacity-60"
                >
                  Importer dans documents
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  disabled={workingId === active.id}
                  className="rounded-2xl border border-red-300 px-4 py-3 text-sm font-medium text-red-600 disabled:opacity-60"
                >
                  <Trash2 className="mr-2 inline h-4 w-4" />
                  Rejeter
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Sélectionne un envoi externe
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
