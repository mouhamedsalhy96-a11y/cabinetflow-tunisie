import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "../supabase/client";
import { getCurrentProfile } from "../services/profileService";
import { getConsultationsByPatient } from "../services/consultationService";
import { getFollowUpsByPatient } from "../services/followUpService";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

export default function PatientSummaryPrintPage() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [patientRes, profileRes, appointmentsRes, documentsRes, consultationsRes, followUpsRes] =
        await Promise.all([
          supabase.from("patients").select("*").eq("id", id).single(),
          getCurrentProfile(),
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

      setPatient(patientRes.data || null);
      setProfile(profileRes || null);
      setAppointments(appointmentsRes.data || []);
      setDocuments(documentsRes.data || []);
      setConsultations(consultationsRes || []);
      setFollowUps(followUpsRes || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const latestConsultation = useMemo(() => consultations[0] || null, [consultations]);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!patient) return <div className="p-6">Patient introuvable</div>;

  const patientName = [patient.nom, patient.prenom].filter(Boolean).join(" ");

  return (
    <>
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="no-print mb-6 flex flex-wrap gap-3">
          <Link
            to="/impressions"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
        </div>

        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-10 border-b border-slate-200 pb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Résumé patient
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Date : {formatDate(new Date())}
                </p>
              </div>

              <div className="max-w-xs text-right text-sm text-slate-700">
                <div className="font-semibold">
                  {profile?.full_name || "Médecin"}
                </div>
                <div>{profile?.specialty || ""}</div>
                <div>{profile?.cabinet_name || "Cabinet"}</div>
                <div>{profile?.cabinet_phone || ""}</div>
                <div className="whitespace-pre-wrap">
                  {profile?.cabinet_address || ""}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Patient
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {patientName || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Téléphone : {patient.telephone || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Date de naissance : {patient.date_naissance || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Adresse : {patient.adresse || "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Dernière consultation
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {latestConsultation ? formatDate(latestConsultation.consultation_date) : "—"}
              </div>
              <div className="mt-2 text-sm text-slate-700">
                Motif : {latestConsultation?.motif || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                Diagnostic : {latestConsultation?.diagnostic || "—"}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Antécédents
              </h2>
              <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm text-slate-800">
                {patient.antecedents || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Notes générales
              </h2>
              <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm text-slate-800">
                {patient.notes || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Consultations récentes
              </h2>
              <div className="space-y-3">
                {consultations.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                    <div className="font-medium">{formatDate(item.consultation_date)}</div>
                    <div className="mt-1 text-slate-600">Motif : {item.motif || "—"}</div>
                    <div className="mt-1 text-slate-600">Diagnostic : {item.diagnostic || "—"}</div>
                  </div>
                ))}
                {consultations.length === 0 ? <div className="text-sm text-slate-500">Aucune consultation</div> : null}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Documents récents
              </h2>
              <div className="space-y-3">
                {documents.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                    <div className="font-medium">{item.file_name}</div>
                    <div className="mt-1 text-slate-600">{item.source || "—"}</div>
                    <div className="mt-1 text-slate-500">{formatDate(item.created_at)}</div>
                  </div>
                ))}
                {documents.length === 0 ? <div className="text-sm text-slate-500">Aucun document</div> : null}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Suivis actifs
              </h2>
              <div className="space-y-3">
                {followUps
                  .filter((item) => item.status === "À faire")
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                      <div className="font-medium">{item.title}</div>
                      <div className="mt-1 text-slate-600">Échéance : {item.due_date}</div>
                      <div className="mt-1 text-slate-600">Priorité : {item.priority}</div>
                      <div className="mt-1 text-slate-600">{item.note || "—"}</div>
                    </div>
                  ))}
                {followUps.filter((item) => item.status === "À faire").length === 0 ? (
                  <div className="text-sm text-slate-500">Aucun suivi actif</div>
                ) : null}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Rendez-vous récents
              </h2>
              <div className="space-y-3">
                {appointments.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                    <div className="font-medium">
                      {item.appointment_date} • {item.appointment_time || "—"}
                    </div>
                    <div className="mt-1 text-slate-600">Motif : {item.motif || "—"}</div>
                    <div className="mt-1 text-slate-600">Statut : {item.statut || "—"}</div>
                  </div>
                ))}
                {appointments.length === 0 ? <div className="text-sm text-slate-500">Aucun rendez-vous</div> : null}
              </div>
            </section>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <div className="text-sm text-slate-500">Signature / cachet</div>
              <div className="mt-12 border-t border-slate-300 pt-2 text-sm text-slate-700">
                {profile?.stamp_text || profile?.full_name || "Médecin"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500">Date</div>
              <div className="mt-12 border-t border-slate-300 pt-2 text-sm text-slate-700">
                {formatDate(new Date())}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}