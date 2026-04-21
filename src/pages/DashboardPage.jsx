import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  FileText,
  Inbox,
  Stethoscope,
  Users,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { getAppointments } from "../services/appointmentService";
import { getConsultations } from "../services/consultationService";
import { getDocuments } from "../services/documentService";
import { getFollowUps } from "../services/followUpService";
import { getPatientUploads } from "../services/patientPortalService";
import { getPatients } from "../services/patientService";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function patientNameFromObject(obj) {
  return [obj?.patients?.nom, obj?.patients?.prenom].filter(Boolean).join(" ") || "Sans patient";
}

function uploadSourceLabel(sourceType) {
  if (sourceType === "LAB") return "Laboratoire";
  if (sourceType === "RADIOLOGY") return "Radiologie";
  return "Patient";
}

export default function DashboardPage() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [
        patientsData,
        appointmentsData,
        followUpsData,
        documentsData,
        uploadsData,
        consultationsData,
      ] = await Promise.all([
        getPatients(),
        getAppointments(),
        getFollowUps(),
        getDocuments(),
        getPatientUploads(),
        getConsultations(),
      ]);

      setPatients(patientsData || []);
      setAppointments(appointmentsData || []);
      setFollowUps(followUpsData || []);
      setDocuments(documentsData || []);
      setUploads(uploadsData || []);
      setConsultations(consultationsData || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => {
    const today = todayDate();

    const appointmentsToday = appointments.filter((a) => a.appointment_date === today);
    const overdueFollowUps = followUps.filter(
      (f) => (f.status || "À faire") === "À faire" && f.due_date < today
    );

    return {
      patients: patients.length,
      appointmentsToday: appointmentsToday.length,
      followUpsTodo: followUps.filter((f) => (f.status || "À faire") === "À faire").length,
      followUpsToday: followUps.filter(
        (f) => (f.status || "À faire") === "À faire" && f.due_date === today
      ).length,
      documentsToValidate: documents.filter((d) => (d.statut || "À valider") === "À valider").length,
      externalNew: uploads.filter((u) => (u.status || "Nouveau") === "Nouveau").length,
      alerts: overdueFollowUps.length,
      arrived: appointmentsToday.filter((a) => a.statut === "Arrivé").length,
      enSalle: appointmentsToday.filter((a) => a.statut === "En salle").length,
      termine: appointmentsToday.filter((a) => a.statut === "Terminé").length,
      confirme: appointmentsToday.filter((a) => a.statut === "Confirmé").length,
      documentsToReview: documents.filter((d) => !d.reviewed).length,
      ocrPending: documents.filter((d) => (d.ocr_status || "PENDING") === "PENDING").length,
      consultationsTotal: consultations.length,
    };
  }, [patients, appointments, followUps, documents, uploads, consultations]);

  const todayAppointments = useMemo(() => {
    const today = todayDate();
    return appointments
      .filter((a) => a.appointment_date === today)
      .slice(0, 8);
  }, [appointments]);

  const urgentFollowUps = useMemo(() => {
    const today = todayDate();
    return followUps
      .filter((f) => (f.status || "À faire") === "À faire")
      .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))
      .filter((f) => f.due_date <= today)
      .slice(0, 8);
  }, [followUps]);

  const recentDocuments = useMemo(() => {
    return documents.slice(0, 8);
  }, [documents]);

  const recentConsultations = useMemo(() => {
    return consultations.slice(0, 8);
  }, [consultations]);

  const recentUploads = useMemo(() => {
    return uploads.slice(0, 8);
  }, [uploads]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold">Tableau de bord</h2>
        <p className="text-sm text-slate-500">
          Vue d’ensemble de l’activité clinique et administrative
        </p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-7">
        <Card title="Patients" subtitle="Total" icon={Users}>
          <div className="text-3xl font-bold">{metrics.patients}</div>
        </Card>

        <Card title="Rendez-vous" subtitle="Aujourd’hui" icon={Calendar}>
          <div className="text-3xl font-bold">{metrics.appointmentsToday}</div>
        </Card>

        <Card title="Suivis" subtitle="À faire" icon={CalendarClock}>
          <div className="text-3xl font-bold">{metrics.followUpsTodo}</div>
        </Card>

        <Card title="Suivis" subtitle="Aujourd’hui" icon={Bell}>
          <div className="text-3xl font-bold">{metrics.followUpsToday}</div>
        </Card>

        <Card title="Documents" subtitle="À valider" icon={FileText}>
          <div className="text-3xl font-bold">{metrics.documentsToValidate}</div>
        </Card>

        <Card title="Réception externes" subtitle="Nouveaux" icon={Inbox}>
          <div className="text-3xl font-bold">{metrics.externalNew}</div>
        </Card>

        <Card title="Consultations" subtitle="Total" icon={Stethoscope}>
          <div className="text-3xl font-bold">{metrics.consultationsTotal}</div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-7">
        <Card title="Alertes" subtitle="Suivis urgents" icon={Bell}>
          <div className="text-3xl font-bold">{metrics.alerts}</div>
        </Card>

        <Card title="Arrivés" subtitle="Salle d’attente" icon={Users}>
          <div className="text-3xl font-bold">{metrics.arrived}</div>
        </Card>

        <Card title="En salle" subtitle="En cours" icon={Users}>
          <div className="text-3xl font-bold">{metrics.enSalle}</div>
        </Card>

        <Card title="Terminés" subtitle="Aujourd’hui" icon={CheckCircle2}>
          <div className="text-3xl font-bold">{metrics.termine}</div>
        </Card>

        <Card title="Confirmés" subtitle="Aujourd’hui" icon={CheckCircle2}>
          <div className="text-3xl font-bold">{metrics.confirme}</div>
        </Card>

        <Card title="À revoir" subtitle="Documents" icon={FileText}>
          <div className="text-3xl font-bold">{metrics.documentsToReview}</div>
        </Card>

        <Card title="OCR" subtitle="En attente" icon={FileText}>
          <div className="text-3xl font-bold">{metrics.ocrPending}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Rendez-vous du jour" subtitle="Aujourd’hui" icon={Calendar}>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{patientNameFromObject(item)}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.appointment_time || "Sans heure"} • {item.motif || "Sans motif"}
                      </p>
                    </div>

                    <Badge color="blue">{item.statut || "Nouveau"}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aucun rendez-vous aujourd’hui
              </div>
            )}
          </div>
        </Card>

        <Card title="Suivis urgents" subtitle="En retard / aujourd’hui" icon={Bell}>
          <div className="space-y-3">
            {urgentFollowUps.length > 0 ? (
              urgentFollowUps.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{patientNameFromObject(item)}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.title || "Sans titre"}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Échéance : {item.due_date || "—"}
                      </p>
                    </div>

                    <Badge color={item.priority === "Haute" ? "amber" : "blue"}>
                      {item.priority || "Normale"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aucun suivi urgent
              </div>
            )}
          </div>
        </Card>

        <Card title="Documents récents" subtitle="Réception documentaire" icon={FileText}>
          <div className="space-y-3">
            {recentDocuments.length > 0 ? (
              recentDocuments.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{patientNameFromObject(item)}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.file_name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.source || "—"} • {new Date(item.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>

                    <Badge color={item.statut === "Validé" ? "green" : "blue"}>
                      {item.statut || "À valider"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aucun document récent
              </div>
            )}
          </div>
        </Card>

        <Card title="Consultations récentes" subtitle="Activité clinique" icon={Stethoscope}>
          <div className="space-y-3">
            {recentConsultations.length > 0 ? (
              recentConsultations.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div>
                    <p className="font-semibold">{patientNameFromObject(item)}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.motif || item.diagnostic || "Consultation"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(item.consultation_date || item.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aucune consultation récente
              </div>
            )}
          </div>
        </Card>

        <Card title="Réception externes récents" subtitle="Patient / laboratoire / radiologie" icon={Inbox}>
          <div className="space-y-3">
            {recentUploads.length > 0 ? (
              recentUploads.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{patientNameFromObject(item)}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.file_name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {uploadSourceLabel(item.source_type)} • {new Date(item.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>

                    <Badge color="blue">{item.status || "Nouveau"}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                Aucun envoi externe récent
              </div>
            )}
          </div>
        </Card>

        <Card title="Accès rapides" subtitle="Navigation" icon={Users}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Link
              to="/patients"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Patients
            </Link>

            <Link
              to="/rendez-vous"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Rendez-vous
            </Link>

            <Link
              to="/documents"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Documents
            </Link>

            <Link
              to="/uploads-patients"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Réception externe
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}