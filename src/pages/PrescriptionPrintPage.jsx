import React from "react";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "../supabase/client";
import { getPrescriptionById } from "../services/prescriptionService";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

export default function PrescriptionPrintPage() {
  const { id } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const prescriptionData = await getPrescriptionById(id);

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

      setPrescription(prescriptionData);
      setProfile(profileData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!prescription) {
    return <div className="p-6">Ordonnance introuvable</div>;
  }

  const patientName = [prescription.patients?.nom, prescription.patients?.prenom]
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

        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-10 border-b border-slate-200 pb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Ordonnance</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Date : {formatDateTime(prescription.prescription_date)}
                </p>
              </div>

              <div className="text-right text-sm text-slate-700">
                <div className="font-semibold">
                  {profile?.full_name || "Médecin"}
                </div>
                <div>CabinetFlow Tunisie</div>
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
                Téléphone : {prescription.patients?.telephone || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Date de naissance : {prescription.patients?.date_naissance || "—"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Adresse : {prescription.patients?.adresse || "—"}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Titre
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {prescription.title || "Ordonnance"}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Médicaments
              </h2>
              <div className="min-h-[220px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {prescription.medicaments || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Conseils
              </h2>
              <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {prescription.conseils || "—"}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Notes
              </h2>
              <div className="min-h-[100px] whitespace-pre-wrap rounded-2xl border border-slate-200 p-5 text-sm leading-7 text-slate-800">
                {prescription.notes || "—"}
              </div>
            </section>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
              <div className="text-sm text-slate-500">Signature / cachet</div>
              <div className="mt-12 border-t border-slate-300 pt-2 text-sm text-slate-700">
                {profile?.full_name || "Médecin"}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-500">Date</div>
              <div className="mt-12 border-t border-slate-300 pt-2 text-sm text-slate-700">
                {formatDateTime(prescription.prescription_date)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
