import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Copy,
  Link2,
  PlusCircle,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import {
  createPatient,
  deletePatient,
  getPatients,
  updatePatient,
} from "../services/patientService";
import { generatePatientAccessCode } from "../services/patientPortalService";

const initialForm = {
  nom: "",
  prenom: "",
  telephone: "",
  date_naissance: "",
  adresse: "",
  antecedents: "",
  notes: "",
  upload_code: "",
  upload_active: true,
};

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await getPatients();
      setPatients(data || []);
      setActive((prev) => {
        if (prev) {
          const found = (data || []).find((p) => p.id === prev.id);
          if (found) return found;
        }
        return (data || [])[0] || null;
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
      return;
    }

    setForm({
      nom: active.nom || "",
      prenom: active.prenom || "",
      telephone: active.telephone || "",
      date_naissance: active.date_naissance || "",
      adresse: active.adresse || "",
      antecedents: active.antecedents || "",
      notes: active.notes || "",
      upload_code: active.upload_code || "",
      upload_active: active.upload_active ?? true,
    });
  }, [active]);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();

    return patients.filter((p) => {
      const text = [
        p.nom,
        p.prenom,
        p.telephone,
        p.adresse,
        p.antecedents,
        p.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !q || text.includes(q);
    });
  }, [patients, search]);

  async function handleCreate() {
    setSaving(true);
    try {
      const created = await createPatient({
        nom: "Nouveau patient",
        prenom: "",
        telephone: "",
        date_naissance: null,
        adresse: "",
        antecedents: "",
        notes: "",
        upload_code: null,
        upload_active: true,
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
      const updated = await updatePatient(active.id, {
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        date_naissance: form.date_naissance || null,
        adresse: form.adresse,
        antecedents: form.antecedents,
        notes: form.notes,
        upload_code: form.upload_code || null,
        upload_active: !!form.upload_active,
      });

      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!active) return;

    const ok = window.confirm("Supprimer ce patient ?");
    if (!ok) return;

    setSaving(true);
    try {
      await deletePatient(active.id);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePortalCode() {
    if (!active) return;

    setSaving(true);
    try {
      const updated = await updatePatient(active.id, {
        upload_code: generatePatientAccessCode(),
        upload_active: true,
      });

      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePortal() {
    if (!active) return;

    setSaving(true);
    try {
      const updated = await updatePatient(active.id, {
        upload_active: !active.upload_active,
      });

      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyPortalLink() {
    const code = form.upload_code || active?.upload_code;
    if (!code) return;

    const url = `${window.location.origin}/portail-patient/${code}`;
    await navigator.clipboard.writeText(url);
    alert("Lien patient copié");
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Patients</h2>
          <p className="text-sm text-slate-500">
            Gestion du fichier patient
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          <PlusCircle className="mr-2 inline h-4 w-4" />
          Nouveau patient
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Liste des patients" subtitle="Recherche" icon={User}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher nom, prénom, téléphone..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActive(p)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active?.id === p.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold">
                      {[p.nom, p.prenom].filter(Boolean).join(" ")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {p.telephone || "Sans téléphone"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.upload_code ? (
                        <Badge color={p.upload_active ? "green" : "amber"}>
                          {p.upload_active ? "Lien actif" : "Lien inactif"}
                        </Badge>
                      ) : (
                        <Badge color="blue">Aucun lien</Badge>
                      )}
                    </div>
                  </button>
                ))}

                {filteredPatients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun patient
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Détails patient"
          subtitle="Création / modification"
          icon={User}
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nom
                  </label>
                  <input
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Prénom
                  </label>
                  <input
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Téléphone
                  </label>
                  <input
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={form.date_naissance}
                    onChange={(e) =>
                      setForm({ ...form, date_naissance: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Adresse
                </label>
                <input
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Antécédents
                </label>
                <textarea
                  rows="4"
                  value={form.antecedents}
                  onChange={(e) =>
                    setForm({ ...form, antecedents: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      Lien patient pour ajouter un document
                    </div>
                    <div className="text-xs text-slate-500">
                      Le patient pourra envoyer une image ou un rapport via ce lien
                    </div>
                  </div>

                  {form.upload_code ? (
                    <Badge color={form.upload_active ? "green" : "amber"}>
                      {form.upload_active ? "Actif" : "Inactif"}
                    </Badge>
                  ) : (
                    <Badge color="blue">Non généré</Badge>
                  )}
                </div>

                {form.upload_code ? (
                  <div className="mb-3 break-all rounded-xl bg-white p-3 text-xs text-slate-600">
                    {window.location.origin}/portail-patient/{form.upload_code}
                  </div>
                ) : (
                  <div className="mb-3 rounded-xl bg-white p-3 text-xs text-slate-500">
                    Aucun lien généré pour ce patient
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGeneratePortalCode}
                    disabled={saving}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                  >
                    <Link2 className="mr-2 inline h-4 w-4" />
                    Générer / régénérer le lien
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPortalLink}
                    disabled={!form.upload_code}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                  >
                    <Copy className="mr-2 inline h-4 w-4" />
                    Copier le lien
                  </button>

                  <button
                    type="button"
                    onClick={handleTogglePortal}
                    disabled={!form.upload_code || saving}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                  >
                    {form.upload_active ? (
                      <>
                        <ToggleRight className="mr-2 inline h-4 w-4" />
                        Désactiver
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="mr-2 inline h-4 w-4" />
                        Activer
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>

                <Link
                  to={`/patients/${active.id}`}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Ouvrir dossier
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-sm text-slate-500">
              Aucun patient sélectionné
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
