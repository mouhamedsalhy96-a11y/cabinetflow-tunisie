import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  CalendarClock,
  FileText,
  Inbox,
  Printer,
  Search,
  CheckCircle2,
  Stethoscope,
  XCircle,
} from "lucide-react";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { getAppointments } from "../services/appointmentService";
import { getDocuments } from "../services/documentService";
import { getPatientUploads } from "../services/patientPortalService";
import {
  cancelFollowUp,
  getFollowUps,
  markFollowUpDone,
} from "../services/followUpService";
import { ensureConsultationForAppointment } from "../services/consultationService";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function WorklistPage() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [workingFollowUpId, setWorkingFollowUpId] = useState(null);
  const [workingAppointmentId, setWorkingAppointmentId] = useState(null);

  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [appointmentsData, documentsData, uploadsData, followUpsData] =
        await Promise.all([
          getAppointments(),
          getDocuments(),
          getPatientUploads(),
          getFollowUps(),
        ]);

      setAppointments(appointmentsData || []);
      setDocuments(documentsData || []);
      setUploads(uploadsData || []);
      setFollowUps(followUpsData || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const today = todayDate();

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.appointment_date === today)
      .sort((a, b) => {
        const left = `${a.appointment_date} ${a.appointment_time}`;
        const right = `${b.appointment_date} ${b.appointment_time}`;
        return left.localeCompare(right);
      });
  }, [appointments, today]);

  const overdueFollowUps = useMemo(() => {
    return followUps
      .filter((f) => f.status === "À faire" && f.due_date < today)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [followUps, today]);

  const dueTodayFollowUps = useMemo(() => {
    return followUps
      .filter((f) => f.status === "À faire" && f.due_date === today)
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [followUps, today]);

  const reviewDocuments = useMemo(() => {
    return documents.filter((d) => !d.reviewed);
  }, [documents]);

  const pendingUploads = useMemo(() => {
    return uploads.filter((u) => u.status !== "Importé");
  }, [uploads]);

  const filteredAppointments = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return todayAppointments;

    return todayAppointments.filter((item) => {
      const patientName = [item.patients?.nom, item.patients?.prenom]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const text = [
        patientName,
        item.motif,
        item.statut,
        item.appointment_time,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [todayAppointments, search]);

  async function handleDoneFollowUp(id) {
    setWorkingFollowUpId(id);
    try {
      await markFollowUpDone(id);
      await loadData();
    } finally {
      setWorkingFollowUpId(null);
    }
  }

  async function handleCancelFollowUp(id) {
    setWorkingFollowUpId(id);
    try {
      await cancelFollowUp(id);
      await loadData();
    } finally {
      setWorkingFollowUpId(null);
    }
  }

  async function handleStartConsultation(appointment) {
    if (!appointment?.patient_id) return;

    setWorkingAppointmentId(appointment.id);
    try {
      await ensureConsultationForAppointment(appointment);
      await loadData();
      navigate(`/patients/${appointment.patient_id}`);
    } finally {
      setWorkingAppointmentId(null);
    }
  }

  function followUpPriorityColor(priority) {
    if (priority === "Haute") return "amber";
    if (priority === "Basse") return "blue";
    return "blue";
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Travail du jour</h2>
          <p className="text-sm text-slate-500">
            Centre opérationnel pour aujourd’hui
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher patient, rendez-vous..."
            className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
          />
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card title="RDV aujourd’hui" subtitle={today} icon={Calendar}>
          <div className="text-3xl font-bold">{todayAppointments.length}</div>
        </Card>

        <Card title="Suivis en retard" subtitle="Overdue" icon={Bell}>
          <div className="text-3xl font-bold">{overdueFollowUps.length}</div>
        </Card>

        <Card title="Suivis du jour" subtitle="À faire" icon={CalendarClock}>
          <div className="text-3xl font-bold">{dueTodayFollowUps.length}</div>
        </Card>

        <Card title="Docs à revoir" subtitle="Revue clinique" icon={FileText}>
          <div className="text-3xl font-bold">{reviewDocuments.length}</div>
        </Card>

        <Card title="Uploads en attente" subtitle="Inbox externe" icon={Inbox}>
          <div className="text-3xl font-bold">{pendingUploads.length}</div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Rendez-vous du jour" subtitle="Planning" icon={Calendar}>
          <div className="space-y-3">
            {filteredAppointments.map((rdv) => (
              <div
                key={rdv.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {rdv.appointment_time} •{" "}
                      {rdv.patients
                        ? [rdv.patients.nom, rdv.patients.prenom]
                            .filter(Boolean)
                            .join(" ")
                        : "Sans patient"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {rdv.motif || "Sans motif"}
                    </p>
                    {rdv.consultation_id ? (
                      <p className="mt-1 text-xs font-medium text-sky-700">
                        Consultation liée
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      color={
                        rdv.statut === "Confirmé"
                          ? "green"
                          : rdv.statut === "Arrivé"
                          ? "blue"
                          : rdv.statut === "En salle"
                          ? "blue"
                          : rdv.statut === "Terminé"
                          ? "green"
                          : "amber"
                      }
                    >
                      {rdv.statut}
                    </Badge>

                    {rdv.patient_id ? (
                      <Link
                        to={`/patients/${rdv.patient_id}`}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        Ouvrir patient
                      </Link>
                    ) : null}

                    {rdv.patient_id ? (
                      <Link
                        to={`/documents?patient=${rdv.patient_id}`}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        Documents
                      </Link>
                    ) : null}

                    {rdv.patient_id ? (
                      <Link
                        to={`/impressions?patient=${rdv.patient_id}`}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        <Printer className="mr-1 inline h-4 w-4" />
                        Imprimer
                      </Link>
                    ) : null}

                    {rdv.patient_id ? (
                      <button
                        onClick={() => handleStartConsultation(rdv)}
                        disabled={workingAppointmentId === rdv.id}
                        className="rounded-xl border border-sky-300 px-3 py-2 text-xs font-medium text-sky-700 disabled:opacity-60"
                      >
                        <Stethoscope className="mr-1 inline h-4 w-4" />
                        {rdv.consultation_id ? "Ouvrir consultation" : "Démarrer consultation"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aucun rendez-vous aujourd’hui
              </div>
            ) : null}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="Suivis en retard" subtitle="Priorité haute" icon={Bell}>
            <div className="space-y-3">
              {overdueFollowUps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-amber-300 bg-amber-50 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {[item.patients?.nom, item.patients?.prenom]
                          .filter(Boolean)
                          .join(" ") || "Sans patient"}
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        Échéance: {item.due_date}
                      </p>
                      {item.note ? (
                        <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge color={followUpPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleDoneFollowUp(item.id)}
                          disabled={workingFollowUpId === item.id}
                          className="rounded-xl border border-green-300 px-3 py-2 text-xs font-medium text-green-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="mr-1 inline h-4 w-4" />
                          Fait
                        </button>

                        <button
                          onClick={() => handleCancelFollowUp(item.id)}
                          disabled={workingFollowUpId === item.id}
                          className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 disabled:opacity-60"
                        >
                          <XCircle className="mr-1 inline h-4 w-4" />
                          Annuler
                        </button>

                        {item.patient_id ? (
                          <Link
                            to={`/patients/${item.patient_id}`}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                          >
                            Ouvrir patient
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {overdueFollowUps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Aucun suivi en retard
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Suivis du jour" subtitle="À traiter" icon={CalendarClock}>
            <div className="space-y-3">
              {dueTodayFollowUps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {[item.patients?.nom, item.patients?.prenom]
                          .filter(Boolean)
                          .join(" ") || "Sans patient"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Échéance: {item.due_date}
                      </p>
                      {item.note ? (
                        <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge color={followUpPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleDoneFollowUp(item.id)}
                          disabled={workingFollowUpId === item.id}
                          className="rounded-xl border border-green-300 px-3 py-2 text-xs font-medium text-green-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="mr-1 inline h-4 w-4" />
                          Fait
                        </button>

                        <button
                          onClick={() => handleCancelFollowUp(item.id)}
                          disabled={workingFollowUpId === item.id}
                          className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 disabled:opacity-60"
                        >
                          <XCircle className="mr-1 inline h-4 w-4" />
                          Annuler
                        </button>

                        {item.patient_id ? (
                          <Link
                            to={`/patients/${item.patient_id}`}
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                          >
                            Ouvrir patient
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {dueTodayFollowUps.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Aucun suivi prévu aujourd’hui
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card title="Documents à revoir" subtitle="Revue clinique" icon={FileText}>
            <div className="space-y-3">
              {reviewDocuments.slice(0, 10).map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {[doc.patients?.nom, doc.patients?.prenom]
                          .filter(Boolean)
                          .join(" ") || "Sans patient"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {doc.source} • {doc.doc_category || "Non classé"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color={doc.reviewed ? "green" : "amber"}>
                        {doc.reviewed ? "Vérifié" : "À revoir"}
                      </Badge>

                      <Link
                        to={`/documents/${doc.id}/review`}
                        className="rounded-xl border border-sky-300 px-3 py-2 text-xs font-medium text-sky-700"
                      >
                        Revoir
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {reviewDocuments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Aucun document à revoir
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Uploads externes" subtitle="Patient / Labo / Radio" icon={Inbox}>
            <div className="space-y-3">
              {pendingUploads.slice(0, 10).map((upload) => (
                <div
                  key={upload.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{upload.file_name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {[upload.patients?.nom, upload.patients?.prenom]
                          .filter(Boolean)
                          .join(" ") || "Sans patient"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {(upload.source_type || "PATIENT")} • {upload.status}
                      </p>
                    </div>

                    <Link
                      to={
                        upload.patient_id
                          ? `/uploads-patients?patient=${upload.patient_id}`
                          : "/uploads-patients"
                      }
                      className="rounded-xl border border-sky-300 px-3 py-2 text-xs font-medium text-sky-700"
                    >
                      Ouvrir inbox
                    </Link>
                  </div>
                </div>
              ))}

              {pendingUploads.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Aucun upload en attente
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}