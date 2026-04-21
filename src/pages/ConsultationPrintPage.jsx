
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "../supabase/client";
import { getConsultationById } from "../services/consultationService";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

export default function ConsultationPrintPage() {
  const { id } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const consultationData = await getConsultationById(id);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let profileData = null;

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        profileData = data || null;
      }

      setConsultation(consultationData);
      setProfile(profileData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!consultation) return <div className="p-6">Consultation introuvable</div>;

  const patientName = [
    consultation.patients?.nom,
    consultation.patients?.prenom,
  ]
    .filter(Boolean)
    .join(" ");

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
            to="/patients"
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
                  Compte-rendu de consultation
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Date : {formatDate(consultation.consultation_date)}
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
                Téléphone : {consultation.patients?.telephone || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Date de naissance : {consultation.patients?.date_naissance || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Adresse : {consultation.patients?.adresse || "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Paramètres
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <div>TA : {consultation.tension_arterielle || "—"}</div>
                <div>FC : {consultation.frequence_cardiaque || "—"}</div>
                <div>Température : {consultation.temperature || "—"}</div>
                <div>Poids : {consultation.poids || "—"}</div>
                <div>Taille : {consultation.taille || "—"}</div>
                <div>SpO2 : {consultation.spo2 || "—"}</div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Motif</h2>
              <div className="min-h-[80px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {consultation.motif || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Symptômes</h2>
              <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {consultation.symptomes || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Examen clinique
              </h2>
              <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {consultation.examen_clinique || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Diagnostic
              </h2>
              <div className="min-h-[100px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {consultation.diagnostic || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Plan / conduite à tenir
              </h2>
              <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {consultation.plan || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Notes</h2>
              <div className="min-h-[100px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {consultation.notes || "—"}
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
                {formatDate(consultation.consultation_date)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
