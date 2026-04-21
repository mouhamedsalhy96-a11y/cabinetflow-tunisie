import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Copy,
  Link2,
  PlusCircle,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import {
  createExternalPartner,
  deleteExternalPartner,
  generatePartnerAccessCode,
  getExternalPartners,
  toggleExternalPartnerActive,
  updateExternalPartner,
} from "../services/externalPartnerService";

const initialForm = {
  name: "",
  partner_type: "LAB",
  access_code: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  notes: "",
  active: true,
};

function partnerTypeLabel(type) {
  if (type === "LAB") return "Laboratoire";
  if (type === "RADIOLOGY") return "Radiologie";
  return type || "—";
}

export default function ExternalPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({
    ...initialForm,
    access_code: generatePartnerAccessCode(),
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const data = await getExternalPartners();
      setPartners(data || []);
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
      setForm({
        ...initialForm,
        access_code: generatePartnerAccessCode(),
      });
      return;
    }

    setForm({
      name: active.name || "",
      partner_type: active.partner_type || "LAB",
      access_code: active.access_code || "",
      contact_name: active.contact_name || "",
      contact_phone: active.contact_phone || "",
      contact_email: active.contact_email || "",
      notes: active.notes || "",
      active: active.active ?? true,
    });
  }, [active]);

  const filteredPartners = useMemo(() => {
    const q = search.toLowerCase().trim();

    return partners.filter((item) => {
      const text = [
        item.name,
        item.partner_type,
        item.access_code,
        item.contact_name,
        item.contact_phone,
        item.contact_email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !q || text.includes(q);
      const matchesType =
        typeFilter === "ALL" || item.partner_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [partners, search, typeFilter]);

  async function handleCreate() {
    setSaving(true);
    try {
      const created = await createExternalPartner({
        name: "Nouveau partenaire",
        partner_type: "LAB",
        access_code: generatePartnerAccessCode(),
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        notes: "",
        active: true,
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
      const updated = await updateExternalPartner(active.id, {
        name: form.name,
        partner_type: form.partner_type,
        access_code: form.access_code,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        notes: form.notes,
        active: form.active,
      });

      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!active) return;

    const ok = window.confirm("Supprimer ce partenaire ?");
    if (!ok) return;

    setSaving(true);
    try {
      await deleteExternalPartner(active.id);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    if (!active) return;

    setSaving(true);
    try {
      const updated = await toggleExternalPartnerActive(active.id, !active.active);
      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateCode() {
    setForm({
      ...form,
      access_code: generatePartnerAccessCode(),
    });
  }

  async function handleCopyLink() {
    const code = form.access_code || active?.access_code;
    if (!code) return;

    const url = `${window.location.origin}/portail-partenaire/${code}`;
    await navigator.clipboard.writeText(url);
    alert("Lien copié");
  }

  function typeBadgeColor(type) {
    if (type === "LAB") return "blue";
    if (type === "RADIOLOGY") return "amber";
    return "blue";
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Partenaires externes</h2>
          <p className="text-sm text-slate-500">
            Laboratoires, radiologie, liens d’upload externes
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          <PlusCircle className="mr-2 inline h-4 w-4" />
          Nouveau partenaire
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Liste des partenaires" subtitle="Recherche et filtre" icon={Building2}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher nom, code, contact..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="ALL">Tous types</option>
              <option value="LAB">Laboratoire</option>
              <option value="RADIOLOGY">Radiologie</option>
            </select>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="space-y-3">
                {filteredPartners.map((item) => (
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
                        <p className="font-semibold">{item.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Code : {item.access_code || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.contact_name || "Sans contact"}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge color={typeBadgeColor(item.partner_type)}>
                          {partnerTypeLabel(item.partner_type)}
                        </Badge>
                        <Badge color={item.active ? "green" : "amber"}>
                          {item.active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredPartners.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun partenaire
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Détails partenaire"
          subtitle="Modification"
          icon={Link2}
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
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom du partenaire
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Type
                  </label>
                  <select
                    value={form.partner_type}
                    onChange={(e) =>
                      setForm({ ...form, partner_type: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  >
                    <option value="LAB">Laboratoire</option>
                    <option value="RADIOLOGY">Radiologie</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Code d’accès
                  </label>
                  <input
                    value={form.access_code}
                    onChange={(e) =>
                      setForm({ ...form, access_code: e.target.value.toUpperCase() })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleGenerateCode}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    Générer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Contact
                  </label>
                  <input
                    value={form.contact_name}
                    onChange={(e) =>
                      setForm({ ...form, contact_name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Téléphone
                  </label>
                  <input
                    value={form.contact_phone}
                    onChange={(e) =>
                      setForm({ ...form, contact_phone: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    value={form.contact_email}
                    onChange={(e) =>
                      setForm({ ...form, contact_email: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium">Lien portail partenaire</div>
                <div className="mt-2 break-all text-xs text-slate-500">
                  {window.location.origin}/portail-partenaire/{form.access_code || "CODE"}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  Enregistrer
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  <Copy className="mr-2 inline h-4 w-4" />
                  Copier le lien
                </button>

                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={saving}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 disabled:opacity-60"
                >
                  {active.active ? (
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
            </form>
          ) : (
            <div className="text-sm text-slate-500">
              Sélectionne un partenaire
            </div>
          )}
        </Card>
      </div>
    </>
  );
}