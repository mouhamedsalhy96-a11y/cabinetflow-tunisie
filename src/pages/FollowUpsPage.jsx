import React from "react";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, PlusCircle, Search, Trash2, XCircle } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { getPatients } from "../services/patientService";
import {
  cancelFollowUp,
  createFollowUp,
  deleteFollowUp,
  getFollowUps,
  markFollowUpDone,
  updateFollowUp,
} from "../services/followUpService";

const initialForm = {
  patient_id: "",
  title: "",
  note: "",
  due_date: new Date().toISOString().slice(0, 10),
  priority: "Normale",
  status: "À faire",
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function FollowUpsPage() {
  const [patients, setPatients] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateMode, setDateMode] = useState("ALL");
  const [patientSearch, setPatientSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [patientsData, followUpsData] = await Promise.all([
        getPatients(),
        getFollowUps(),
      ]);

      setPatients(patientsData || []);
      setFollowUps(followUpsData || []);
      setActive((prev) => {
        if (prev) {
          const found = (followUpsData || []).find((item) => item.id === prev.id);
          if (found) return found;
        }
        return (followUpsData || [])[0] || null;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!active) {
      setForm(initialForm);
      setPatientSearch("");
      return;
    }

    setForm({
      patient_id: active.patient_id || "",
      title: active.title || "",
      note: active.note || "",
      due_date: active.due_date || todayDate(),
      priority: active.priority || "Normale",
      status: active.status || "À faire",
    });

    const linkedPatientName = [active.patients?.nom, active.patients?.prenom]
      .filter(Boolean)
      .join(" ");
    setPatientSearch(linkedPatientName || "");
  }, [active]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase().trim();
    if (!q) return patients.slice(0, 10);

    return patients
      .filter((p) =>
        [p.nom, p.prenom, p.telephone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 10);
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === form.patient_id) || null;
  }, [patients, form.patient_id]);

  const filteredFollowUps = useMemo(() => {
    const q = search.toLowerCase().trim();
    const today = todayDate();

    return followUps.filter((item) => {
      const patientName = [item.patients?.nom, item.patients?.prenom]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const text = [
        item.title,
        item.note,
        item.priority,
        item.status,
        patientName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesStatus = statusFilter === "ALL" || (item.status || "À faire") === statusFilter;
      const matchesDate =
        dateMode === "ALL"
          ? true
          : dateMode === "TODAY"
          ? item.due_date === today
          : item.status === "À faire" && item.due_date < today;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [followUps, search, statusFilter, dateMode]);

  function priorityColor(priority) {
    if (priority === "Haute") return "amber";
    if (priority === "Basse") return "blue";
    return "blue";
  }

  function statusColor(status) {
    if (status === "Fait") return "green";
    if (status === "Annulé") return "amber";
    return "blue";
  }

  async function handleCreate() {
    setSaving(true);
    try {
      const created = await createFollowUp({
        patient_id: null,
        title: "Nouveau suivi",
        note: "",
        due_date: todayDate(),
        priority: "Normale",
        status: "À faire",
      });

      await loadData();
      setActive(created);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!active) return;

    setSaving(true);
    try {
      const updated = await updateFollowUp(active.id, {
        patient_id: form.patient_id || null,
        title: form.title,
        note: form.note,
        due_date: form.due_date,
        priority: form.priority,
        status: form.status,
      });

      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!active) return;

    const ok = window.confirm("Supprimer ce suivi ?");
    if (!ok) return;

    setSaving(true);
    try {
      await deleteFollowUp(active.id);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleDone(id) {
    setSaving(true);
    try {
      const updated = await markFollowUpDone(id);
      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id) {
    setSaving(true);
    try {
      const updated = await cancelFollowUp(id);
      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  function handleSelectPatient(patient) {
    setForm((prev) => ({ ...prev, patient_id: patient.id }));
    setPatientSearch([patient.nom, patient.prenom].filter(Boolean).join(" "));
  }

  function handleClearPatient() {
    setForm((prev) => ({ ...prev, patient_id: "" }));
    setPatientSearch("");
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Suivis</h2>
          <p className="text-sm text-slate-500">Organisation des rappels et tâches patient</p>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          <PlusCircle className="mr-2 inline h-4 w-4" />
          Nouveau suivi
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Liste des suivis" subtitle="Recherche et filtres" icon={CalendarClock}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher patient, titre, note..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="ALL">Tous statuts</option>
                <option value="À faire">À faire</option>
                <option value="Fait">Fait</option>
                <option value="Annulé">Annulé</option>
              </select>

              <select
                value={dateMode}
                onChange={(e) => setDateMode(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                <option value="ALL">Toutes dates</option>
                <option value="TODAY">Aujourd’hui</option>
                <option value="OVERDUE">En retard</option>
              </select>
            </div>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="space-y-3">
                {filteredFollowUps.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActive(item)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active?.id === item.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {[item.patients?.nom, item.patients?.prenom].filter(Boolean).join(" ") || "Sans patient"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{item.title || "Sans titre"}</p>
                        <p className="mt-1 text-xs text-slate-400">Échéance : {item.due_date}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge color={statusColor(item.status || "À faire")}>{item.status || "À faire"}</Badge>
                        <Badge color={priorityColor(item.priority || "Normale")}>{item.priority || "Normale"}</Badge>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredFollowUps.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun suivi trouvé
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Détails du suivi"
          subtitle="Création / modification"
          icon={CalendarClock}
          right={
            active ? (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-2xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-60"
              >
                <Trash2 className="mr-2 inline h-4 w-4" />
                Supprimer
              </button>
            ) : null
          }
        >
          {active ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Titre</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Rechercher un patient</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Nom, prénom ou téléphone..."
                    className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
                  />
                </div>

                <div className="mt-3 max-h-48 space-y-2 overflow-auto rounded-2xl border border-slate-200 p-2">
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      !form.patient_id ? "bg-sky-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-medium">Sans patient</div>
                    <div className="text-xs text-slate-500">Suivi général non lié</div>
                  </button>

                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPatient(p)}
                      className={`w-full rounded-xl p-3 text-left transition ${
                        form.patient_id === p.id ? "bg-sky-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-medium">{[p.nom, p.prenom].filter(Boolean).join(" ")}</div>
                      <div className="text-xs text-slate-500">{p.telephone || "Sans téléphone"}</div>
                    </button>
                  ))}

                  {filteredPatients.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500">Aucun patient trouvé</div>
                  ) : null}
                </div>

                <div className="mt-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {selectedPatient
                    ? `Patient sélectionné : ${[selectedPatient.nom, selectedPatient.prenom].filter(Boolean).join(" ")}`
                    : "Aucun patient sélectionné"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Date d’échéance</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Priorité</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="Basse">Basse</option>
                    <option value="Normale">Normale</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="À faire">À faire</option>
                    <option value="Fait">Fait</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
                <textarea
                  rows="6"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Rappel, analyse, action à faire..."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>

                {active.status === "À faire" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDone(active.id)}
                      disabled={saving}
                      className="rounded-2xl border border-green-300 px-4 py-3 text-sm font-medium text-green-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="mr-2 inline h-4 w-4" />
                      Marquer fait
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCancel(active.id)}
                      disabled={saving}
                      className="rounded-2xl border border-amber-300 px-4 py-3 text-sm font-medium text-amber-700 disabled:opacity-60"
                    >
                      <XCircle className="mr-2 inline h-4 w-4" />
                      Annuler
                    </button>
                  </>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="text-sm text-slate-500">Sélectionne un suivi</div>
          )}
        </Card>
      </div>
    </>
  );
}