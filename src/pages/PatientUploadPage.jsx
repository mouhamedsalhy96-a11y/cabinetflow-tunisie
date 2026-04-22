import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Upload } from "lucide-react";
import {
  createPatientPortalUploadRecord,
  getPatientPortalTargetByCode,
  uploadPatientPortalFile,
} from "../services/patientPortalService";

export default function PatientUploadPage() {
  const { code } = useParams();

  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [senderName, setSenderName] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadTarget() {
    setLoading(true);
    setError("");
    try {
      const data = await getPatientPortalTargetByCode(code);
      if (!data) {
        setError("Lien patient invalide ou inactif");
        setTarget(null);
      } else {
        setTarget(data);
      }
    } catch (err) {
      setError(err.message || "Erreur de chargement du portail patient");
      setTarget(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTarget();
  }, [code]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    if (!target) return;

    setSending(true);
    setMessage("");
    setError("");

    try {
      const filePath = await uploadPatientPortalFile({
        folderPrefix: "patient-portal",
        code,
        file,
      });

      await createPatientPortalUploadRecord({
        code,
        senderName,
        note,
        fileName: file.name,
        filePath,
        fileType: file.type,
      });

      setSenderName("");
      setNote("");
      setFile(null);

      const input = document.getElementById("patient-portal-file-input");
      if (input) input.value = "";

      setMessage("Document envoyé avec succès");
    } catch (err) {
      setError(err.message || "Erreur pendant l’envoi");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8">Chargement...</div>;
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-2xl font-bold">Portail patient</h1>
          <p className="mt-4 text-sm text-red-600">{error || "Lien invalide"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Envoi de document patient</h1>
          <p className="mt-2 text-sm text-slate-500">
            Patient : {[target.nom, target.prenom].filter(Boolean).join(" ")}
          </p>
        </div>

        {message ? (
          <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nom expéditeur
            </label>
            <input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Nom du patient ou proche"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Note
            </label>
            <textarea
              rows="4"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Exemple : résultat labo, ordonnance, radio..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Fichier / image
            </label>
            <input
              id="patient-portal-file-input"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending || !file}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            <Upload className="mr-2 inline h-4 w-4" />
            {sending ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      </div>
    </div>
  );
}