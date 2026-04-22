import React from "react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "../supabase/client";
import { getCurrentProfile } from "../services/profileService";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function ReferralLetterPrintPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [patient, setPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const to = searchParams.get("to") || "";
  const reason = searchParams.get("reason") || "";
  const details = searchParams.get("details") || "";

  async function loadData() {
    setLoading(true);
    try {
      const [patientRes, profileRes] = await Promise.all([
        supabase.from("patients").select("*").eq("id", id).single(),
        getCurrentProfile(),
      ]);

      setPatient(patientRes.data || null);
      setProfile(profileRes || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

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

        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-10 border-b border-slate-200 pb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Courrier d’orientation
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
                <div>{profile?.cabinet_email || ""}</div>
                <div>{profile?.cabinet_city || ""}</div>
                <div className="whitespace-pre-wrap">
                  {profile?.cabinet_address || ""}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-7 text-slate-800">
            <section>
              <div className="mb-2 font-semibold text-slate-900">
                Destinataire
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                {to || "Confrère / Spécialiste"}
              </div>
            </section>

            <section>
              <div className="mb-2 font-semibold text-slate-900">
                Patient concerné
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div>{patientName || "—"}</div>
                <div>Téléphone : {patient.telephone || "—"}</div>
                <div>Date de naissance : {patient.date_naissance || "—"}</div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-5">
              <p>Je vous adresse le patient suivant pour avis spécialisé :</p>
              <p className="mt-4 font-semibold">{patientName || "—"}</p>

              <p className="mt-6">
                <span className="font-semibold">Motif d’orientation :</span>{" "}
                {reason || "Avis spécialisé"}
              </p>

              <div className="mt-6 whitespace-pre-wrap">
                {details || "Merci de bien vouloir donner votre avis spécialisé et conduite à tenir."}
              </div>

              {profile?.referral_signoff ? (
                <div className="mt-8 whitespace-pre-wrap">
                  {profile.referral_signoff}
                </div>
              ) : null}
            </section>
          </div>

          {profile?.footer_text ? (
            <div className="mt-10 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 whitespace-pre-wrap">
              {profile.footer_text}
            </div>
          ) : null}

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