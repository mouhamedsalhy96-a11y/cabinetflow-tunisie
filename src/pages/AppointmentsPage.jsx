import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  PlusCircle,
  Search,
  Stethoscope,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { getPatients, createPatient } from "../services/patientService";
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  markAppointmentArrived,
  markAppointmentCalled,
  markAppointmentFinished,
  markAppointmentNoShow,
  updateAppointment,
} from "../services/appointmentService";
import { ensureConsultationForAppointment } from "../services/consultationService";

const appointmentInitial = {
  patient_id: "",
  appointment_date: "",
  appointment_time: "",
  motif: "",
  statut: "Nouveau",
};

const quickPatientInitial = {
  nom: "",
  prenom: "",
  telephone: "",
  date_naissance: "",
  adresse: "",
  antecedents: "",
  notes: "",
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

function sortPatients(list) {
  return [...list].sort((a, b) => {
    const left = `${a.nom || ""} ${a.prenom || ""}`.toLowerCase();
    const right = `${b.nom || ""} ${b.prenom || ""}`.toLowerCase();
    return left.localeCompare(right, "fr");
  });
}

export default function AppointmentsPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [appointmentActive, setAppointmentActive] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({
    ...appointmentInitial,
    appointment_date: todayDate(),
    appointment_time: "09:00",
  });

  const [quickPatientForm, setQuickPatientForm] = useState(quickPatientInitial);

  const [loading, setLoading] = useState(true);
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);

  const [searchAppointments, setSearchAppointments] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("today");

  async function loadData() {
    setLoading(true);
    try {
      const [patientsData, appointmentsData] = await Promise.all([
        getPatients(),
        getAppointments(),
      ]);

      setPatients(patientsData || []);
      setAppointments(appointmentsData || []);
      setAppointmentActive((prev) => {
        if (prev) {
          const found = (appointmentsData || []).find((a) => a.id === prev.id);
          if (found) return found;
        }
        return (appointmentsData || [])[0] || null;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!appointmentActive) {
      setAppointmentForm({
        ...appointmentInitial,
        appointment_date: todayDate(),
        appointment_time: "09:00",
      });
      return;
    }

    setAppointmentForm({
      patient_id: appointmentActive.patient_id || "",
      appointment_date: appointmentActive.appointment_date || todayDate(),
      appointment_time: appointmentActive.appointment_time || "09:00",
      motif: appointmentActive.motif || "",
      statut: appointmentActive.statut || "Nouveau",
    });

    const patientName = appointmentActive.patients
      ? [appointmentActive.patients.nom, appointmentActive.patients.prenom]
          .filter(Boolean)
          .join(" ")
      : "";

    setPatientSearch(patientName);
  }, [appointmentActive]);

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

  const filteredAppointments = useMemo(() => {
    const q = searchAppointments.toLowerCase().trim();
    const today = todayDate();

    return appointments.filter((a) => {
      const patientName = a.patients
        ? [a.patients.nom, a.patients.prenom, a.patients.telephone]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
        : "";

      const matchesSearch =
        !q ||
        patientName.includes(q) ||
        (a.motif || "").toLowerCase().includes(q) ||
        (a.statut || "").toLowerCase().includes(q);

      const matchesDate =
        dateFilter === "all"
          ? true
          : dateFilter === "today"
          ? a.appointment_date === today
          : a.appointment_date === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [appointments, searchAppointments, dateFilter]);

  const waitingStats = useMemo(() => {
    const today = todayDate();
    const todayAppointments = appointments.filter((a) => a.appointment_date === today);

    return {
      total: todayAppointments.length,
      nouveau: todayAppointments.filter((a) => a.statut === "Nouveau").length,
      confirme: todayAppointments.filter((a) => a.statut === "Confirmé").length,
      arrive: todayAppointments.filter((a) => a.statut === "Arrivé").length,
      enSalle: todayAppointments.filter((a) => a.statut === "En salle").length,
      termine: todayAppointments.filter((a) => a.statut === "Terminé").length,
    };
  }, [appointments]);

  async function handleCreateAppointment() {
    setSavingAppointment(true);
    try {
      const created = await createAppointment({
        patient_id: null,
        appointment_date: todayDate(),
        appointment_time: "09:00",
        motif: "",
        statut: "Nouveau",
      });

      await loadData();
      setAppointmentActive(created);
      setPatientSearch("");
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleSaveAppointment(e) {
    e.preventDefault();
    if (!appointmentActive) return;

    setSavingAppointment(true);
    try {
      const updated = await updateAppointment(appointmentActive.id, {
        patient_id: appointmentForm.patient_id || null,
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        motif: appointmentForm.motif,
        statut: appointmentForm.statut,
      });

      await loadData();
      setAppointmentActive(updated);
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleDeleteAppointment() {
    if (!appointmentActive) return;

    const ok = window.confirm("Supprimer ce rendez-vous ?");
    if (!ok) return;

    setSavingAppointment(true);
    try {
      await deleteAppointment(appointmentActive.id);
      await loadData();
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleQuickPatientCreate(e) {
    e.preventDefault();
    if (!quickPatientForm.nom.trim()) return;

    setSavingPatient(true);
    try {
      const created = await createPatient({
        nom: quickPatientForm.nom,
        prenom: quickPatientForm.prenom,
        date_naissance: quickPatientForm.date_naissance || null,
        telephone: quickPatientForm.telephone,
        adresse: quickPatientForm.adresse,
        antecedents: quickPatientForm.antecedents,
        notes: quickPatientForm.notes,
      });

      setPatients((prev) => sortPatients([...prev, created]));
      setQuickPatientForm(quickPatientInitial);
      setAppointmentForm((prev) => ({
        ...prev,
        patient_id: created.id,
      }));
      setPatientSearch([created.nom, created.prenom].filter(Boolean).join(" "));
    } finally {
      setSavingPatient(false);
    }
  }

  async function handleQuickStatus(newStatus) {
    if (!appointmentActive) return;

    setSavingAppointment(true);
    try {
      const updated = await updateAppointment(appointmentActive.id, {
        statut: newStatus,
      });

      await loadData();
      setAppointmentActive(updated);
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleMarkArrived() {
    if (!appointmentActive) return;

    setSavingAppointment(true);
    try {
      const updated = await markAppointmentArrived(appointmentActive.id);
      await loadData();
      setAppointmentActive(updated);
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleCallPatient() {
    if (!appointmentActive) return;

    setSavingAppointment(true);
    try {
      const updated = await markAppointmentCalled(appointmentActive.id);
      await loadData();
      setAppointmentActive(updated);
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleFinishAppointment() {
    if (!appointmentActive) return;

    setSavingAppointment(true);
    try {
      const updated = await markAppointmentFinished(appointmentActive.id);
      await loadData();
      setAppointmentActive(updated);
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleNoShow() {
    if (!appointmentActive) return;

    setSavingAppointment(true);
    try {
      const updated = await markAppointmentNoShow(appointmentActive.id);
      await loadData();
      setAppointmentActive(updated);
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleOpenPatient() {
    const patientId = appointmentForm.patient_id || appointmentActive?.patient_id;
    if (!patientId) return;
    navigate(`/patients/${patientId}`);
  }

  async function handleStartConsultation() {
    if (!appointmentActive) return;
    if (!appointmentForm.patient_id) {
      alert("Aucun patient lié à ce rendez-vous");
      return;
    }

    setSavingAppointment(true);
    try {
      const savedAppointment = await updateAppointment(appointmentActive.id, {
        patient_id: appointmentForm.patient_id || null,
        appointment_date: appointmentForm.appointment_date,
        appointment_time: appointmentForm.appointment_time,
        motif: appointmentForm.motif,
        statut: appointmentForm.statut,
      });

      await ensureConsultationForAppointment(savedAppointment);
      await loadData();
      navigate(`/patients/${savedAppointment.patient_id}`);
    } finally {
      setSavingAppointment(false);
    }
  }

  async function handleOpenLinkedConsultation() {
    const patientId = appointmentForm.patient_id || appointmentActive?.patient_id;
    if (!patientId) return;
    navigate(`/patients/${patientId}`);
  }

  function getBadgeColor(status) {
    if (status === "Confirmé") return "green";
    if (status === "Arrivé") return "blue";
    if (status === "En salle") return "blue";
    if (status === "Terminé") return "green";
    if (status === "Absent") return "amber";
    if (status === "Annulé") return "amber";
    return "amber";
  }

  function selectPatient(p) {
    setAppointmentForm((prev) => ({
      ...prev,
      patient_id: p.id,
    }));

    setPatientSearch([p.nom, p.prenom].filter(Boolean).join(" "));
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rendez-vous</h2>
          <p className="text-sm text-slate-500">
            Flux secrétaire + salle d’attente + consultation
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateAppointment}
            disabled={savingAppointment}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            <PlusCircle className="mr-2 inline h-4 w-4" />
            Nouveau RDV
          </button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card title="Aujourd'hui" subtitle="Total" icon={Calendar}>
          <div className="text-3xl font-bold">{waitingStats.total}</div>
        </Card>

        <Card title="Nouveaux" subtitle="À appeler" icon={Clock3}>
          <div className="text-3xl font-bold">{waitingStats.nouveau}</div>
        </Card>

        <Card title="Confirmés" subtitle="Planifiés" icon={CheckCircle2}>
          <div className="text-3xl font-bold">{waitingStats.confirme}</div>
        </Card>

        <Card title="Arrivés" subtitle="Salle d’attente" icon={Users}>
          <div className="text-3xl font-bold">{waitingStats.arrive}</div>
        </Card>

        <Card title="En salle" subtitle="En cours" icon={Users}>
          <div className="text-3xl font-bold">{waitingStats.enSalle}</div>
        </Card>

        <Card title="Terminés" subtitle="Clos" icon={CheckCircle2}>
          <div className="text-3xl font-bold">{waitingStats.termine}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr_0.95fr]">
        <Card title="Liste des rendez-vous" subtitle="Recherche et filtre" icon={Calendar}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={searchAppointments}
                onChange={(e) => setSearchAppointments(e.target.value)}
                placeholder="Rechercher patient, motif, statut..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Filtre date
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="today">Aujourd'hui</option>
                <option value="all">Tous</option>
              </select>
            </div>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((rdv) => (
                  <button
                    key={rdv.id}
                    onClick={() => setAppointmentActive(rdv)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      appointmentActive?.id === rdv.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {rdv.patients
                            ? [rdv.patients.nom, rdv.patients.prenom]
                                .filter(Boolean)
                                .join(" ")
                            : "Sans patient"}
                        </p>
                        <p className="text-sm text-slate-500">
                          {rdv.appointment_date} • {rdv.appointment_time}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {rdv.motif || "Sans motif"}
                        </p>
                        {rdv.patients?.telephone ? (
                          <p className="mt-1 text-xs text-slate-400">
                            {rdv.patients.telephone}
                          </p>
                        ) : null}
                        {rdv.consultation_id ? (
                          <p className="mt-1 text-xs font-medium text-sky-700">
                            Consultation liée
                          </p>
                        ) : null}
                      </div>

                      <Badge color={getBadgeColor(rdv.statut)}>
                        {rdv.statut}
                      </Badge>
                    </div>
                  </button>
                ))}

                {filteredAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun rendez-vous
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Détails du rendez-vous"
          subtitle="Création / modification"
          icon={Calendar}
          right={
            appointmentActive ? (
              <button
                onClick={handleDeleteAppointment}
                disabled={savingAppointment}
                className="rounded-2xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
              >
                <Trash2 className="mr-2 inline h-4 w-4" />
                Supprimer
              </button>
            ) : null
          }
        >
          {appointmentActive ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">
                  Statut actuel : {appointmentActive.statut || "Nouveau"}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Arrivé : {formatDateTime(appointmentActive.arrived_at)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Appelé / En salle : {formatDateTime(appointmentActive.called_at)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Consultation liée : {appointmentActive.consultation_id ? "Oui" : "Non"}
                </div>
              </div>

              <form onSubmit={handleSaveAppointment} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Recherche patient
                  </label>
                  <input
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Nom, prénom, téléphone..."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />

                  <div className="mt-2 max-h-48 space-y-2 overflow-auto rounded-2xl border border-slate-200 p-2">
                    {filteredPatients.slice(0, 8).map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        className={`w-full rounded-xl p-3 text-left transition ${
                          appointmentForm.patient_id === p.id
                            ? "bg-sky-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-medium">
                          {[p.nom, p.prenom].filter(Boolean).join(" ")}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.telephone || "Sans téléphone"}
                        </div>
                      </button>
                    ))}

                    {filteredPatients.length === 0 ? (
                      <div className="p-3 text-sm text-slate-500">
                        Aucun patient trouvé
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Date
                    </label>
                    <input
                      type="date"
                      value={appointmentForm.appointment_date}
                      onChange={(e) =>
                        setAppointmentForm({
                          ...appointmentForm,
                          appointment_date: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Heure
                    </label>
                    <input
                      type="time"
                      value={appointmentForm.appointment_time}
                      onChange={(e) =>
                        setAppointmentForm({
                          ...appointmentForm,
                          appointment_time: e.target.value,
                        })
                      }
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Motif
                  </label>
                  <input
                    value={appointmentForm.motif}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        motif: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    placeholder="Contrôle, résultats, douleur, certificat..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Statut manuel
                  </label>
                  <select
                    value={appointmentForm.statut}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        statut: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="Nouveau">Nouveau</option>
                    <option value="Confirmé">Confirmé</option>
                    <option value="Arrivé">Arrivé</option>
                    <option value="En salle">En salle</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Annulé">Annulé</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingAppointment}
                    className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {savingAppointment ? "Enregistrement..." : "Enregistrer"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickStatus("Confirmé")}
                    disabled={savingAppointment}
                    className="rounded-2xl border border-emerald-300 px-4 py-3 text-sm font-medium text-emerald-700 disabled:opacity-60"
                  >
                    Confirmer
                  </button>
                </div>
              </form>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-medium text-slate-800">
                  Actions salle d’attente
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleMarkArrived}
                    disabled={savingAppointment}
                    className="rounded-2xl border border-blue-300 px-4 py-3 text-sm font-medium text-blue-700 disabled:opacity-60"
                  >
                    Patient arrivé
                  </button>

                  <button
                    type="button"
                    onClick={handleCallPatient}
                    disabled={savingAppointment}
                    className="rounded-2xl border border-sky-300 px-4 py-3 text-sm font-medium text-sky-700 disabled:opacity-60"
                  >
                    Appeler / En salle
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishAppointment}
                    disabled={savingAppointment}
                    className="rounded-2xl border border-green-300 px-4 py-3 text-sm font-medium text-green-700 disabled:opacity-60"
                  >
                    Terminer
                  </button>

                  <button
                    type="button"
                    onClick={handleNoShow}
                    disabled={savingAppointment}
                    className="rounded-2xl border border-amber-300 px-4 py-3 text-sm font-medium text-amber-700 disabled:opacity-60"
                  >
                    Absent
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-medium text-slate-800">
                  Actions consultation
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleOpenPatient}
                    disabled={!appointmentForm.patient_id}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                  >
                    Ouvrir dossier patient
                  </button>

                  <button
                    type="button"
                    onClick={handleStartConsultation}
                    disabled={savingAppointment || !appointmentForm.patient_id}
                    className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <Stethoscope className="mr-2 inline h-4 w-4" />
                    Démarrer consultation
                  </button>

                  {appointmentActive.consultation_id ? (
                    <button
                      type="button"
                      onClick={handleOpenLinkedConsultation}
                      disabled={!appointmentForm.patient_id}
                      className="rounded-2xl border border-sky-300 px-4 py-3 text-sm font-medium text-sky-700 disabled:opacity-60"
                    >
                      Ouvrir consultation liée
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Sélectionne un rendez-vous
            </div>
          )}
        </Card>

        <Card title="Nouveau patient rapide" subtitle="Pour accueil" icon={UserPlus}>
          <form onSubmit={handleQuickPatientCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom
                </label>
                <input
                  value={quickPatientForm.nom}
                  onChange={(e) =>
                    setQuickPatientForm({ ...quickPatientForm, nom: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Prénom
                </label>
                <input
                  value={quickPatientForm.prenom}
                  onChange={(e) =>
                    setQuickPatientForm({ ...quickPatientForm, prenom: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Téléphone
              </label>
              <input
                value={quickPatientForm.telephone}
                onChange={(e) =>
                  setQuickPatientForm({ ...quickPatientForm, telephone: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                placeholder="+216 ..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Date de naissance
              </label>
              <input
                type="date"
                value={quickPatientForm.date_naissance}
                onChange={(e) =>
                  setQuickPatientForm({
                    ...quickPatientForm,
                    date_naissance: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Adresse
              </label>
              <input
                value={quickPatientForm.adresse}
                onChange={(e) =>
                  setQuickPatientForm({ ...quickPatientForm, adresse: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Antécédents rapides
              </label>
              <textarea
                rows="3"
                value={quickPatientForm.antecedents}
                onChange={(e) =>
                  setQuickPatientForm({
                    ...quickPatientForm,
                    antecedents: e.target.value,
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
                rows="3"
                value={quickPatientForm.notes}
                onChange={(e) =>
                  setQuickPatientForm({ ...quickPatientForm, notes: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPatient}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {savingPatient ? "Création..." : "Créer patient + sélectionner"}
            </button>

            {appointmentForm.patient_id ? (
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                <div className="font-medium">Patient sélectionné pour le RDV</div>
                <div className="mt-2 inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {patientSearch || "Patient sélectionné"}
                </div>
              </div>
            ) : null}
          </form>
        </Card>
      </div>
    </>
  );
}