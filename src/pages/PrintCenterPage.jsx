import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ExternalLink, Printer, Search } from "lucide-react";
import Card from "../components/ui/Card";
import { getPatients } from "../services/patientService";
import { getCurrentProfile } from "../services/profileService";
import { getTextTemplates } from "../services/textTemplateService";

function applyTemplateText(content, context) {
  return (content || "")
    .replaceAll("{{patient_name}}", context.patientName || "")
    .replaceAll("{{patient_phone}}", context.patientPhone || "")
    .replaceAll("{{today}}", context.today || "")
    .replaceAll("{{doctor_name}}", context.doctorName || "")
    .replaceAll("{{cabinet_name}}", context.cabinetName || "")
    .replaceAll("{{purpose}}", context.purpose || "")
    .replaceAll("{{start_date}}", context.startDate || "")
    .replaceAll("{{days}}", context.days || "");
}

export default function PrintCenterPage() {
  const [searchParams] = useSearchParams();

  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [profile, setProfile] = useState(null);
  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  const [referralTo, setReferralTo] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [referralDetails, setReferralDetails] = useState("");
  const [referralTemplateId, setReferralTemplateId] = useState("");

  const [certificatePurpose, setCertificatePurpose] = useState("Attestation médicale");
  const [certificateDays, setCertificateDays] = useState("3");
  const [certificateStart, setCertificateStart] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [certificateDetails, setCertificateDetails] = useState("");
  const [certificateTemplateId, setCertificateTemplateId] = useState("");

  const patientQuery = searchParams.get("patient") || "";

  async function loadData() {
    const [patientsData, templatesData, profileData] = await Promise.all([
      getPatients(),
      getTextTemplates(),
      getCurrentProfile(),
    ]);

    const nextPatients = patientsData || [];

    setPatients(nextPatients);
    setTemplates(templatesData || []);
    setProfile(profileData || null);

    if (patientQuery && nextPatients.some((p) => p.id === patientQuery)) {
      setPatientId(patientQuery);
      const matched = nextPatients.find((p) => p.id === patientQuery);
      setPatientSearch([matched?.nom, matched?.prenom].filter(Boolean).join(" "));
    } else {
      setPatientId(nextPatients[0]?.id || "");
      setPatientSearch("");
    }
  }

  useEffect(() => {
    loadData();
  }, [patientQuery]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase().trim();
    if (!q) return patients;

    return patients.filter((p) =>
      [p.nom, p.prenom, p.telephone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === patientId) || null;
  }, [patients, patientId]);

  const referralTemplates = useMemo(
    () => templates.filter((t) => t.template_type === "REFERRAL"),
    [templates]
  );

  const certificateTemplates = useMemo(
    () => templates.filter((t) => t.template_type === "CERTIFICATE"),
    [templates]
  );

  const context = useMemo(() => {
    return {
      patientName: [selectedPatient?.nom, selectedPatient?.prenom]
        .filter(Boolean)
        .join(" "),
      patientPhone: selectedPatient?.telephone || "",
      today: new Date().toLocaleDateString("fr-FR"),
      doctorName: profile?.full_name || "",
      cabinetName: profile?.cabinet_name || "",
      purpose: certificatePurpose || "",
      startDate: certificateStart || "",
      days: certificateDays || "",
    };
  }, [selectedPatient, profile, certificatePurpose, certificateStart, certificateDays]);

  function openInNewTab(url) {
    window.open(url, "_blank");
  }

  function openPatientSummary() {
    if (!patientId) return;
    openInNewTab(`/impressions/resume/${patientId}`);
  }

  function openReferralLetter() {
    if (!patientId) return;

    const qs = new URLSearchParams({
      to: referralTo,
      reason: referralReason,
      details: referralDetails,
    });

    openInNewTab(`/impressions/orientation/${patientId}?${qs.toString()}`);
  }

  function openCertificate() {
    if (!patientId) return;

    const qs = new URLSearchParams({
      purpose: certificatePurpose,
      days: certificateDays,
      start: certificateStart,
      details: certificateDetails,
    });

    openInNewTab(`/impressions/certificat/${patientId}?${qs.toString()}`);
  }

  function handleApplyReferralTemplate() {
    const template = referralTemplates.find((t) => t.id === referralTemplateId);
    if (!template) return;
    setReferralDetails(applyTemplateText(template.content, context));
  }

  function handleApplyCertificateTemplate() {
    const template = certificateTemplates.find((t) => t.id === certificateTemplateId);
    if (!template) return;
    setCertificateDetails(applyTemplateText(template.content, context));
  }

  function handleSelectPatient(patient) {
    setPatientId(patient.id);
    setPatientSearch([patient.nom, patient.prenom].filter(Boolean).join(" "));
  }

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold">Impressions</h2>
        <p className="text-sm text-slate-500">
          Résumé patient, courrier d’orientation, certificat médical
        </p>
      </header>

      <div className="space-y-6">
        <Card title="Patient sélectionné" subtitle="Base commune" icon={Printer}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Rechercher un patient
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Nom, prénom ou téléphone..."
                  className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
                />
              </div>

              <div className="mt-3 max-h-56 space-y-2 overflow-auto rounded-2xl border border-slate-200 p-2">
                {filteredPatients.slice(0, 12).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPatient(p)}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      patientId === p.id ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-medium">
                      {[p.nom, p.prenom].filter(Boolean).join(" ")}
                    </div>
                    <div className="text-xs text-slate-500">{p.telephone || "Sans téléphone"}</div>
                  </button>
                ))}

                {filteredPatients.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500">Aucun patient trouvé</div>
                ) : null}
              </div>
            </div>

            {selectedPatient ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">
                  {[selectedPatient.nom, selectedPatient.prenom]
                    .filter(Boolean)
                    .join(" ")}
                </div>
                <div className="mt-1">{selectedPatient.telephone || "Sans téléphone"}</div>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card title="Résumé patient" subtitle="Synthèse imprimable" icon={Printer}>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Résumé clinique général avec consultations, documents et suivis récents.
              </p>

              <button
                onClick={openPatientSummary}
                disabled={!patientId}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                <ExternalLink className="mr-2 inline h-4 w-4" />
                Ouvrir résumé patient
              </button>
            </div>
          </Card>

          <Card title="Courrier d’orientation" subtitle="Spécialiste / confrère" icon={Printer}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Destinataire
                </label>
                <input
                  value={referralTo}
                  onChange={(e) => setReferralTo(e.target.value)}
                  placeholder="Dr ..., service ..., hôpital ..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Motif d’orientation
                </label>
                <input
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  placeholder="Avis cardiologique, avis ORL, etc."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                <select
                  value={referralTemplateId}
                  onChange={(e) => setReferralTemplateId(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">Choisir un modèle d’orientation</option>
                  {referralTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleApplyReferralTemplate}
                  type="button"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Appliquer
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Détails
                </label>
                <textarea
                  rows="5"
                  value={referralDetails}
                  onChange={(e) => setReferralDetails(e.target.value)}
                  placeholder="Contexte clinique, examens, traitement, demande..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={openReferralLetter}
                disabled={!patientId}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                <ExternalLink className="mr-2 inline h-4 w-4" />
                Ouvrir courrier
              </button>
            </div>
          </Card>

          <Card title="Certificat médical" subtitle="Attestation / arrêt" icon={Printer}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Type
                </label>
                <input
                  value={certificatePurpose}
                  onChange={(e) => setCertificatePurpose(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Début
                  </label>
                  <input
                    type="date"
                    value={certificateStart}
                    onChange={(e) => setCertificateStart(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nb jours
                  </label>
                  <input
                    value={certificateDays}
                    onChange={(e) => setCertificateDays(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                <select
                  value={certificateTemplateId}
                  onChange={(e) => setCertificateTemplateId(e.target.value)}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="">Choisir un modèle de certificat</option>
                  {certificateTemplates.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleApplyCertificateTemplate}
                  type="button"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Appliquer
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Détails
                </label>
                <textarea
                  rows="5"
                  value={certificateDetails}
                  onChange={(e) => setCertificateDetails(e.target.value)}
                  placeholder="Observations, repos, mention utile..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={openCertificate}
                disabled={!patientId}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                <ExternalLink className="mr-2 inline h-4 w-4" />
                Ouvrir certificat
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}