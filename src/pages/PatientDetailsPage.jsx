import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  FilePlus2,
  FileText,
  History,
  Inbox,
  Link2,
  Phone,
  Printer,
  Stethoscope,
  Trash2,
  Unlink2,
  User,
  XCircle,
} from "lucide-react";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { supabase } from "../supabase/client";
import { getDocumentSignedUrl } from "../services/documentService";
import {
  createConsultation,
  deleteConsultation,
  getConsultationsByPatient,
  updateConsultation,
} from "../services/consultationService";
import {
  createPrescription,
  deletePrescription,
  getPrescriptionsByConsultation,
  updatePrescription,
} from "../services/prescriptionService";
import {
  getLinkedDocumentsByConsultation,
  linkDocumentToConsultation,
  unlinkDocumentFromConsultation,
} from "../services/consultationDocumentService";
import {
  cancelFollowUp,
  createFollowUp,
  getFollowUpsByPatient,
  markFollowUpDone,
} from "../services/followUpService";

const consultationInitial = {
  consultation_date: "",
  motif: "",
  symptomes: "",
  examen_clinique: "",
  diagnostic: "",
  plan: "",
  notes: "",
  tension_arterielle: "",
  frequence_cardiaque: "",
  temperature: "",
  poids: "",
  taille: "",
  spo2: "",
};

const prescriptionInitial = {
  prescription_date: "",
  title: "Ordonnance",
  medicaments: "",
  conseils: "",
  notes: "",
};

const quickFollowUpInitial = {
  title: "",
  note: "",
  due_date: "",
  priority: "Normale",
};

function toDateTimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function toReadableDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function PatientDetailsPage() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [consultations, setConsultations] = useState([]);

  const [consultationActive, setConsultationActive] = useState(null);
  const [consultationForm, setConsultationForm] = useState(consultationInitial);

  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionActive, setPrescriptionActive] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState(prescriptionInitial);

  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [quickFollowUp, setQuickFollowUp] = useState({
    ...quickFollowUpInitial,
    due_date: todayDate(),
  });

  const [loading, setLoading] = useState(true);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [linkingDocument, setLinkingDocument] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  async function loadPatientBaseData() {
    setLoading(true);
    try {
      const [patientRes, appointmentsRes, documentsRes, consultationsRes, followUpsRes] =
        await Promise.all([
          supabase.from("patients").select("*").eq("id", id).single(),
          supabase
            .from("appointments")
            .select("*")
            .eq("patient_id", id)
            .order("appointment_date", { ascending: false })
            .order("appointment_time", { ascending: false }),
          supabase
            .from("documents")
            .select("*")
            .eq("patient_id", id)
            .order("created_at", { ascending: false }),
          getConsultationsByPatient(id),
          getFollowUpsByPatient(id),
        ]);

        const nextConsultations = consultationsRes || [];

      setPatient(patientRes.data || null);
      setAppointments(appointmentsRes.data || []);
      setDocuments(documentsRes.data || []);
      setConsultations(nextConsultations);
      setFollowUps(followUpsRes || []);

      setConsultationActive((prev) => {
        if (prev) {
          const found = nextConsultations.find((c) => c.id === prev.id);
          if (found) return found;
        }
        return nextConsultations[0] || null;
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadPrescriptionsForConsultation(consultationId) {
    if (!consultationId) {
      setPrescriptions([]);
      setPrescriptionActive(null);
      return;
    }

    const data = await getPrescriptionsByConsultation(consultationId);
    const nextPrescriptions = data || [];

    setPrescriptions(nextPrescriptions);
    setPrescriptionActive((prev) => {
      if (prev) {
        const found = nextPrescriptions.find((p) => p.id === prev.id);
        if (found) return found;
      }
      return nextPrescriptions[0] || null;
    });
  }

  async function loadLinkedDocumentsForConsultation(consultationId) {
    if (!consultationId) {
      setLinkedDocuments([]);
      return;
    }

    const data = await getLinkedDocumentsByConsultation(consultationId);
    setLinkedDocuments(data || []);
  }

  useEffect(() => {
    loadPatientBaseData();
  }, [id]);

  useEffect(() => {
    if (!consultationActive) {
      setConsultationForm(consultationInitial);
      setPrescriptions([]);
      setPrescriptionActive(null);
      setLinkedDocuments([]);
      return;
    }

    setConsultationForm({
      consultation_date: toDateTimeLocal(consultationActive.consultation_date),
      motif: consultationActive.motif || "",
      symptomes: consultationActive.symptomes || "",
      examen_clinique: consultationActive.examen_clinique || "",
      diagnostic: consultationActive.diagnostic || "",
      plan: consultationActive.plan || "",
      notes: consultationActive.notes || "",
      tension_arterielle: consultationActive.tension_arterielle || "",
      frequence_cardiaque: consultationActive.frequence_cardiaque || "",
      temperature: consultationActive.temperature || "",
      poids: consultationActive.poids || "",
      taille: consultationActive.taille || "",
      spo2: consultationActive.spo2 || "",
    });

    loadPrescriptionsForConsultation(consultationActive.id);
    loadLinkedDocumentsForConsultation(consultationActive.id);
  }, [consultationActive]);

  useEffect(() => {
    if (!prescriptionActive) {
      setPrescriptionForm(prescriptionInitial);
      return;
    }

    setPrescriptionForm({
      prescription_date: toDateTimeLocal(prescriptionActive.prescription_date),
      title: prescriptionActive.title || "Ordonnance",
      medicaments: prescriptionActive.medicaments || "",
      conseils: prescriptionActive.conseils || "",
      notes: prescriptionActive.notes || "",
    });
  }, [prescriptionActive]);

  const consultationCount = useMemo(() => consultations.length, [consultations]);

  const linkedDocumentIds = useMemo(() => {
    return new Set(linkedDocuments.map((item) => item.document_id));
  }, [linkedDocuments]);

  function getLinkRowForDocument(documentId) {
    return linkedDocuments.find((item) => item.document_id === documentId);
  }

  async function handleOpenDocument(filePath) {
    const url = await getDocumentSignedUrl(filePath);
    window.open(url, "_blank");
  }

  async function handleNewConsultation() {
    setSavingConsultation(true);
    try {
      const created = await createConsultation({
        patient_id: id,
        consultation_date: new Date().toISOString(),
        motif: "",
        symptomes: "",
        examen_clinique: "",
        diagnostic: "",
        plan: "",
        notes: "",
        tension_arterielle: "",
        frequence_cardiaque: null,
        temperature: null,
        poids: null,
        taille: null,
        spo2: null,
      });

      await loadPatientBaseData();
      setConsultationActive(created);
    } finally {
      setSavingConsultation(false);
    }
  }

  async function handleSaveConsultation(e) {
    e.preventDefault();
    if (!consultationActive) return;

    setSavingConsultation(true);
    try {
      const updated = await updateConsultation(consultationActive.id, {
        consultation_date: consultationForm.consultation_date
          ? new Date(consultationForm.consultation_date).toISOString()
          : new Date().toISOString(),
        motif: consultationForm.motif,
        symptomes: consultationForm.symptomes,
        examen_clinique: consultationForm.examen_clinique,
        diagnostic: consultationForm.diagnostic,
        plan: consultationForm.plan,
        notes: consultationForm.notes,
        tension_arterielle: consultationForm.tension_arterielle || null,
        frequence_cardiaque: consultationForm.frequence_cardiaque
          ? Number(consultationForm.frequence_cardiaque)
          : null,
        temperature: consultationForm.temperature
          ? Number(consultationForm.temperature)
          : null,
        poids: consultationForm.poids ? Number(consultationForm.poids) : null,
        taille: consultationForm.taille ? Number(consultationForm.taille) : null,
        spo2: consultationForm.spo2 ? Number(consultationForm.spo2) : null,
      });

      await loadPatientBaseData();
      setConsultationActive(updated);
    } finally {
      setSavingConsultation(false);
    }
  }

  async function handleDeleteConsultation() {
    if (!consultationActive) return;

    const ok = window.confirm("Supprimer cette consultation ?");
    if (!ok) return;

    setSavingConsultation(true);
    try {
      await deleteConsultation(consultationActive.id);
      await loadPatientBaseData();
    } finally {
      setSavingConsultation(false);
    }
  }

  async function handleNewPrescription() {
    if (!consultationActive) return;

    setSavingPrescription(true);
    try {
      const created = await createPrescription({
        patient_id: id,
        consultation_id: consultationActive.id,
        prescription_date: new Date().toISOString(),
        title: "Ordonnance",
        medicaments: "",
        conseils: "",
        notes: "",
      });

      await loadPrescriptionsForConsultation(consultationActive.id);
      setPrescriptionActive(created);
    } finally {
      setSavingPrescription(false);
    }
  }

  async function handleSavePrescription(e) {
    e.preventDefault();
    if (!prescriptionActive) return;

    setSavingPrescription(true);
    try {
      const updated = await updatePrescription(prescriptionActive.id, {
        prescription_date: prescriptionForm.prescription_date
          ? new Date(prescriptionForm.prescription_date).toISOString()
          : new Date().toISOString(),
        title: prescriptionForm.title,
        medicaments: prescriptionForm.medicaments,
        conseils: prescriptionForm.conseils,
        notes: prescriptionForm.notes,
      });

      await loadPrescriptionsForConsultation(consultationActive.id);
      setPrescriptionActive(updated);
    } finally {
      setSavingPrescription(false);
    }
  }

  async function handleDeletePrescription() {
    if (!prescriptionActive) return;

    const ok = window.confirm("Supprimer cette ordonnance ?");
    if (!ok) return;

    setSavingPrescription(true);
    try {
      await deletePrescription(prescriptionActive.id);
      await loadPrescriptionsForConsultation(consultationActive.id);
    } finally {
      setSavingPrescription(false);
    }
  }

  async function handleLinkDocument(documentId) {
    if (!consultationActive) return;

    setLinkingDocument(true);
    try {
      await linkDocumentToConsultation({
        consultationId: consultationActive.id,
        documentId,
      });
      await loadLinkedDocumentsForConsultation(consultationActive.id);
    } finally {
      setLinkingDocument(false);
    }
  }

  async function handleUnlinkDocument(linkId) {
    setLinkingDocument(true);
    try {
      await unlinkDocumentFromConsultation(linkId);
      await loadLinkedDocumentsForConsultation(consultationActive.id);
    } finally {
      setLinkingDocument(false);
    }
  }

  async function handleCreateQuickFollowUp(e) {
    e.preventDefault();
    if (!quickFollowUp.title.trim()) return;

    setSavingFollowUp(true);
    try {
      await createFollowUp({
        patient_id: id,
        title: quickFollowUp.title,
        note: quickFollowUp.note,
        due_date: quickFollowUp.due_date || todayDate(),
        priority: quickFollowUp.priority,
        status: "À faire",
      });

      setQuickFollowUp({
        ...quickFollowUpInitial,
        due_date: todayDate(),
      });

      await loadPatientBaseData();
    } finally {
      setSavingFollowUp(false);
    }
  }

  async function handleDoneFollowUp(followUpId) {
    setSavingFollowUp(true);
    try {
      await markFollowUpDone(followUpId);
      await loadPatientBaseData();
    } finally {
      setSavingFollowUp(false);
    }
  }

  async function handleCancelFollowUp(followUpId) {
    setSavingFollowUp(true);
    try {
      await cancelFollowUp(followUpId);
      await loadPatientBaseData();
    } finally {
      setSavingFollowUp(false);
    }
  }

  function getPriorityColor(priority) {
    if (priority === "Haute") return "amber";
    if (priority === "Basse") return "blue";
    return "blue";
  }

  function getFollowUpStatusColor(status) {
    if (status === "Fait") return "green";
    if (status === "Annulé") return "amber";
    return "blue";
  }

  function isFollowUpOverdue(item) {
    return item.status === "À faire" && item.due_date < todayDate();
  }

  if (loading) return <div>Chargement...</div>;
  if (!patient) return <div>Patient introuvable</div>;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        <Link
          to={`/patients/${id}/historique`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <History className="h-4 w-4" />
          Timeline médicale
        </Link>

        <Link
          to={`/impressions?patient=${id}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <Printer className="h-4 w-4" />
          Impressions patient
        </Link>

        <Link
          to={`/documents?patient=${id}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <FileText className="h-4 w-4" />
          Documents patient
        </Link>

        <Link
          to={`/uploads-patients?patient=${id}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <Inbox className="h-4 w-4" />
          Uploads liés
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <Card title="Identité" subtitle="Patient" icon={User}>
            <div className="space-y-3 text-sm text-slate-700">
              <div>
                <div className="text-xs text-slate-400">Nom complet</div>
                <div className="font-medium">
                  {[patient.nom, patient.prenom].filter(Boolean).join(" ")}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Téléphone</div>
                <div className="font-medium inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {patient.telephone || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Date de naissance</div>
                <div className="font-medium">{patient.date_naissance || "—"}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Adresse</div>
                <div className="font-medium">{patient.adresse || "—"}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Antécédents</div>
                <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-3">
                  {patient.antecedents || "—"}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Notes</div>
                <div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-3">
                  {patient.notes || "—"}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Rendez-vous" subtitle="Historique" icon={Calendar}>
            <div className="space-y-3">
              {appointments.map((rdv) => (
                <div key={rdv.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {rdv.appointment_date} • {rdv.appointment_time}
                      </p>
                      <p className="text-sm text-slate-500">
                        {rdv.motif || "Sans motif"}
                      </p>
                    </div>

                    <Badge
                      color={
                        rdv.statut === "Confirmé"
                          ? "green"
                          : rdv.statut === "En salle"
                          ? "blue"
                          : rdv.statut === "Terminé"
                          ? "green"
                          : "amber"
                      }
                    >
                      {rdv.statut}
                    </Badge>
                  </div>
                </div>
              ))}

              {appointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Aucun rendez-vous
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Documents patient" subtitle="Tous les documents" icon={FileText}>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-slate-500">
                        {doc.source} • {new Date(doc.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge color={doc.statut === "Validé" ? "green" : "amber"}>
                        {doc.statut}
                      </Badge>

                      <button
                        type="button"
                        onClick={() => handleOpenDocument(doc.file_path)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium"
                      >
                        Ouvrir
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {documents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Aucun document
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Suivis patient" subtitle={`${followUps.length} suivi(s)`} icon={CalendarClock}>
            <form onSubmit={handleCreateQuickFollowUp} className="mb-4 space-y-3 rounded-2xl border border-slate-200 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_1fr_0.8fr]">
                <input
                  value={quickFollowUp.title}
                  onChange={(e) =>
                    setQuickFollowUp({ ...quickFollowUp, title: e.target.value })
                  }
                  placeholder="Titre du suivi"
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />

                <input
                  type="date"
                  value={quickFollowUp.due_date}
                  onChange={(e) =>
                    setQuickFollowUp({ ...quickFollowUp, due_date: e.target.value })
                  }
                  className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />

                <select
                  value={quickFollowUp.priority}
                  onChange={(e) =>
                    setQuickFollowUp({ ...quickFollowUp, priority: e.target.value })
                  }
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="Basse">Basse</option>
                  <option value="Normale">Normale</option>
                  <option value="Haute">Haute</option>
                </select>
              </div>

              <textarea
                rows="3"
                value={quickFollowUp.note}
                onChange={(e) =>
                  setQuickFollowUp({ ...quickFollowUp, note: e.target.value })
                }
                placeholder="Note du suivi"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />

              <button
                type="submit"
                disabled={savingFollowUp}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingFollowUp ? "Création..." : "Créer suivi"}
              </button>
            </form>

            <div className="space-y-3">
              {followUps.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    isFollowUpOverdue(item)
                      ? "border-amber-300 bg-amber-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.note || "Sans note"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Échéance: {item.due_date}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge color={getFollowUpStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <Badge color={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>

                  {item.status === "À faire" ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleDoneFollowUp(item.id)}
                        disabled={savingFollowUp}
                        className="rounded-xl border border-green-300 px-3 py-2 text-xs font-medium text-green-700 disabled:opacity-60"
                      >
                        <CheckCircle2 className="mr-1 inline h-4 w-4" />
                        Fait
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelFollowUp(item.id)}
                        disabled={savingFollowUp}
                        className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 disabled:opacity-60"
                      >
                        <XCircle className="mr-1 inline h-4 w-4" />
                        Annuler
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}

              {followUps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Aucun suivi pour ce patient
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Consultations"
            subtitle={`${consultationCount} consultation(s)`}
            icon={Stethoscope}
            right={
              <button
                type="button"
                onClick={handleNewConsultation}
                disabled={savingConsultation}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Nouvelle consultation
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                {consultations.map((consultation) => (
                  <button
                    key={consultation.id}
                    type="button"
                    onClick={() => setConsultationActive(consultation)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      consultationActive?.id === consultation.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {toReadableDate(consultation.consultation_date)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {consultation.motif || "Sans motif"}
                        </p>
                      </div>
                      <Badge color="blue">Consultation</Badge>
                    </div>
                  </button>
                ))}

                {consultations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucune consultation
                  </div>
                ) : null}
              </div>

              <div>
                {consultationActive ? (
                  <form onSubmit={handleSaveConsultation} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Date et heure
                      </label>
                      <input
                        type="datetime-local"
                        value={consultationForm.consultation_date}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            consultation_date: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          TA
                        </label>
                        <input
                          value={consultationForm.tension_arterielle}
                          onChange={(e) =>
                            setConsultationForm({
                              ...consultationForm,
                              tension_arterielle: e.target.value,
                            })
                          }
                          placeholder="120/80"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          FC
                        </label>
                        <input
                          value={consultationForm.frequence_cardiaque}
                          onChange={(e) =>
                            setConsultationForm({
                              ...consultationForm,
                              frequence_cardiaque: e.target.value,
                            })
                          }
                          placeholder="72"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Temp
                        </label>
                        <input
                          value={consultationForm.temperature}
                          onChange={(e) =>
                            setConsultationForm({
                              ...consultationForm,
                              temperature: e.target.value,
                            })
                          }
                          placeholder="37.0"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Poids
                        </label>
                        <input
                          value={consultationForm.poids}
                          onChange={(e) =>
                            setConsultationForm({
                              ...consultationForm,
                              poids: e.target.value,
                            })
                          }
                          placeholder="70"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Taille
                        </label>
                        <input
                          value={consultationForm.taille}
                          onChange={(e) =>
                            setConsultationForm({
                              ...consultationForm,
                              taille: e.target.value,
                            })
                          }
                          placeholder="175"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          SpO2
                        </label>
                        <input
                          value={consultationForm.spo2}
                          onChange={(e) =>
                            setConsultationForm({
                              ...consultationForm,
                              spo2: e.target.value,
                            })
                          }
                          placeholder="98"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Motif
                      </label>
                      <input
                        value={consultationForm.motif}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            motif: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Symptômes
                      </label>
                      <textarea
                        rows="4"
                        value={consultationForm.symptomes}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            symptomes: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Examen clinique
                      </label>
                      <textarea
                        rows="4"
                        value={consultationForm.examen_clinique}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            examen_clinique: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Diagnostic
                      </label>
                      <textarea
                        rows="3"
                        value={consultationForm.diagnostic}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            diagnostic: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Plan / conduite à tenir
                      </label>
                      <textarea
                        rows="4"
                        value={consultationForm.plan}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            plan: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Notes
                      </label>
                      <textarea
                        rows="4"
                        value={consultationForm.notes}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            notes: e.target.value,
                          })
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={savingConsultation}
                        className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {savingConsultation ? "Enregistrement..." : "Enregistrer"}
                      </button>

                      {consultationActive ? (
                        <Link
                          to={`/consultation/${consultationActive.id}/impression`}
                          target="_blank"
                          className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                        >
                          <Printer className="mr-2 inline h-4 w-4" />
                          Imprimer consultation
                        </Link>
                      ) : null}

                      <button
                        type="button"
                        onClick={handleDeleteConsultation}
                        disabled={savingConsultation}
                        className="rounded-2xl border border-red-300 px-4 py-3 text-sm font-medium text-red-600 disabled:opacity-60"
                      >
                        <Trash2 className="mr-2 inline h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucune consultation sélectionnée
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card
            title="Ordonnances"
            subtitle={
              consultationActive
                ? `${prescriptions.length} ordonnance(s)`
                : "Sélectionne une consultation"
            }
            icon={FilePlus2}
            right={
              consultationActive ? (
                <button
                  type="button"
                  onClick={handleNewPrescription}
                  disabled={savingPrescription}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Nouvelle ordonnance
                </button>
              ) : null
            }
          >
            {consultationActive ? (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <button
                      key={prescription.id}
                      type="button"
                      onClick={() => setPrescriptionActive(prescription)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        prescriptionActive?.id === prescription.id
                          ? "border-sky-500 bg-sky-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {toReadableDate(prescription.prescription_date)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {prescription.title || "Ordonnance"}
                          </p>
                        </div>
                        <Badge color="blue">Ordonnance</Badge>
                      </div>
                    </button>
                  ))}

                  {prescriptions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                      Aucune ordonnance
                    </div>
                  ) : null}
                </div>

                <div>
                  {prescriptionActive ? (
                    <form onSubmit={handleSavePrescription} className="space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Date et heure
                        </label>
                        <input
                          type="datetime-local"
                          value={prescriptionForm.prescription_date}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              prescription_date: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Titre
                        </label>
                        <input
                          value={prescriptionForm.title}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              title: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Médicaments
                        </label>
                        <textarea
                          rows="8"
                          value={prescriptionForm.medicaments}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              medicaments: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Conseils
                        </label>
                        <textarea
                          rows="4"
                          value={prescriptionForm.conseils}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              conseils: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Notes
                        </label>
                        <textarea
                          rows="4"
                          value={prescriptionForm.notes}
                          onChange={(e) =>
                            setPrescriptionForm({
                              ...prescriptionForm,
                              notes: e.target.value,
                            })
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={savingPrescription}
                          className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {savingPrescription ? "Enregistrement..." : "Enregistrer"}
                        </button>

                        {prescriptionActive ? (
                          <Link
                            to={`/ordonnance/${prescriptionActive.id}`}
                            target="_blank"
                            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                          >
                            <Printer className="mr-2 inline h-4 w-4" />
                            Imprimer
                          </Link>
                        ) : null}

                        <button
                          type="button"
                          onClick={handleDeletePrescription}
                          disabled={savingPrescription}
                          className="rounded-2xl border border-red-300 px-4 py-3 text-sm font-medium text-red-600 disabled:opacity-60"
                        >
                          <Trash2 className="mr-2 inline h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                      Aucune ordonnance sélectionnée
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Sélectionne une consultation pour gérer les ordonnances
              </div>
            )}
          </Card>

          <Card
            title="Documents liés à cette consultation"
            subtitle={
              consultationActive
                ? `${linkedDocuments.length} document(s) lié(s)`
                : "Sélectionne une consultation"
            }
            icon={Link2}
          >
            {consultationActive ? (
              <div className="space-y-3">
                {documents.map((doc) => {
                  const linkRow = getLinkRowForDocument(doc.id);
                  const isLinked = linkedDocumentIds.has(doc.id);

                  return (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 p-4"
                    >
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-slate-500">
                          {doc.source} • {new Date(doc.created_at).toLocaleString("fr-FR")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge color={isLinked ? "green" : "blue"}>
                          {isLinked ? "Lié" : "Non lié"}
                        </Badge>

                        <button
                          type="button"
                          onClick={() => handleOpenDocument(doc.file_path)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium"
                        >
                          Ouvrir
                        </button>

                        {isLinked ? (
                          <button
                            type="button"
                            onClick={() => handleUnlinkDocument(linkRow.id)}
                            disabled={linkingDocument}
                            className="rounded-xl border border-red-300 px-3 py-2 text-xs font-medium text-red-600 disabled:opacity-60"
                          >
                            <Unlink2 className="mr-1 inline h-4 w-4" />
                            Retirer
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleLinkDocument(doc.id)}
                            disabled={linkingDocument}
                            className="rounded-xl border border-sky-300 px-3 py-2 text-xs font-medium text-sky-700 disabled:opacity-60"
                          >
                            <Link2 className="mr-1 inline h-4 w-4" />
                            Lier
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {documents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun document patient à lier
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Sélectionne une consultation pour lier des documents
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}