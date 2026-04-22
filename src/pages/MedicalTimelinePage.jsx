import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Clock3,
  FilePlus2,
  FileText,
  Stethoscope,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { supabase } from "../supabase/client";
import { getFollowUpsByPatient } from "../services/followUpService";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

export default function MedicalTimelinePage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [
        patientRes,
        appointmentsRes,
        documentsRes,
        consultationsRes,
        prescriptionsRes,
        followUpsRes,
      ] = await Promise.all([
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
        supabase
          .from("consultations")
          .select("*")
          .eq("patient_id", id)
          .order("consultation_date", { ascending: false }),
        supabase
          .from("prescriptions")
          .select("*")
          .eq("patient_id", id)
          .order("prescription_date", { ascending: false }),
        getFollowUpsByPatient(id),
      ]);

      setPatient(patientRes.data || null);
      setAppointments(appointmentsRes.data || []);
      setDocuments(documentsRes.data || []);
      setConsultations(consultationsRes.data || []);
      setPrescriptions(prescriptionsRes.data || []);
      setFollowUps(followUpsRes || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const timelineItems = useMemo(() => {
    const a = appointments.map((item) => ({
      id: item.id,
      type: "appointment",
      dateValue: new Date(
        `${item.appointment_date}T${item.appointment_time || "00:00"}`
      ),
      title: item.motif || "Rendez-vous",
      subtitle: `${item.appointment_date} • ${item.appointment_time || "—"}`,
      status: item.statut || "—",
    }));

    const d = documents.map((item) => ({
      id: item.id,
      type: "document",
      dateValue: new Date(item.created_at),
      title: item.file_name || "Document",
      subtitle: item.source || "Document reçu",
      status: item.statut || "—",
    }));

    const c = consultations.map((item) => ({
      id: item.id,
      type: "consultation",
      dateValue: new Date(item.consultation_date),
      title: item.motif || "Consultation",
      subtitle: item.diagnostic || "Sans diagnostic",
      status: "Consultation",
    }));

    const p = prescriptions.map((item) => ({
      id: item.id,
      type: "prescription",
      dateValue: new Date(item.prescription_date),
      title: item.title || "Ordonnance",
      subtitle: "Prescription",
      status: "Ordonnance",
    }));

    const f = followUps.map((item) => ({
      id: item.id,
      type: "followup",
      dateValue: new Date(`${item.due_date}T00:00:00`),
      title: item.title || "Suivi",
      subtitle: item.note || "Rappel / tâche",
      status: item.status || "À faire",
    }));

    return [...a, ...d, ...c, ...p, ...f].sort(
      (x, y) => y.dateValue.getTime() - x.dateValue.getTime()
    );
  }, [appointments, documents, consultations, prescriptions, followUps]);

  function itemIcon(type) {
    if (type === "appointment") return <Calendar className="h-5 w-5" />;
    if (type === "document") return <FileText className="h-5 w-5" />;
    if (type === "prescription") return <FilePlus2 className="h-5 w-5" />;
    if (type === "followup") return <CalendarClock className="h-5 w-5" />;
    return <Stethoscope className="h-5 w-5" />;
  }

  function itemBadgeColor(type, status) {
    if (type === "consultation") return "blue";
    if (type === "prescription") return "blue";

    if (type === "followup") {
      if (status === "Fait") return "green";
      if (status === "Annulé") return "amber";
      return "blue";
    }

    if (type === "document") {
      return status === "Validé" ? "green" : "amber";
    }

    return status === "Confirmé"
      ? "green"
      : status === "En attente"
      ? "amber"
      : "blue";
  }

  if (loading) return <div>Chargement...</div>;
  if (!patient) return <div>Patient introuvable</div>;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to={`/patients/${id}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dossier patient
        </Link>
      </div>

      <div className="space-y-6">
        <Card
          title="Timeline médicale"
          subtitle={[patient.nom, patient.prenom].filter(Boolean).join(" ")}
        >
          <div className="space-y-4">
            {timelineItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 p-4"
              >
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  {itemIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.subtitle}
                      </p>
                    </div>

                    <Badge color={itemBadgeColor(item.type, item.status)}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-400">
                    <Clock3 className="h-4 w-4" />
                    {formatDate(item.dateValue)}
                  </div>
                </div>
              </div>
            ))}

            {timelineItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aucun élément dans la timeline
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}