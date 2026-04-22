import React from "react";
import { useEffect, useMemo, useState } from "react";
import { FileText, PlusCircle, Search, Trash2 } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import {
  createTextTemplate,
  deleteTextTemplate,
  getTextTemplates,
  updateTextTemplate,
} from "../services/textTemplateService";

const initialForm = {
  template_type: "REFERRAL",
  title: "",
  content: "",
};

function typeColor(type) {
  if (type === "CERTIFICATE") return "green";
  return "blue";
}

function typeLabel(type) {
  if (type === "CERTIFICATE") return "Certificat";
  return "Orientation";
}

const placeholderList = [
  "{{patient_name}}",
  "{{patient_phone}}",
  "{{today}}",
  "{{doctor_name}}",
  "{{cabinet_name}}",
  "{{purpose}}",
  "{{start_date}}",
  "{{days}}",
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const data = await getTextTemplates();
      setTemplates(data || []);
      setActive((prev) => {
        if (prev) {
          const found = (data || []).find((item) => item.id === prev.id);
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
      template_type: active.template_type || "REFERRAL",
      title: active.title || "",
      content: active.content || "",
    });
  }, [active]);

  const filteredTemplates = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return templates;

    return templates.filter((item) =>
      [item.title, item.template_type, item.content]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [templates, search]);

  async function handleCreate() {
    setSaving(true);
    try {
      const created = await createTextTemplate({
        template_type: "REFERRAL",
        title: "Nouveau modèle",
        content: "",
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
      const updated = await updateTextTemplate(active.id, {
        template_type: form.template_type,
        title: form.title,
        content: form.content,
      });

      await loadData();
      setActive(updated);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!active) return;

    const ok = window.confirm("Supprimer ce modèle ?");
    if (!ok) return;

    setSaving(true);
    try {
      await deleteTextTemplate(active.id);
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Modèles</h2>
          <p className="text-sm text-slate-500">Bibliothèque de textes réutilisables</p>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          <PlusCircle className="mr-2 inline h-4 w-4" />
          Nouveau modèle
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Liste des modèles" subtitle="Recherche" icon={FileText}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher titre ou contenu..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-500"
              />
            </div>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((item) => (
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
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                          {item.content || "Sans contenu"}
                        </p>
                      </div>

                      <Badge color={typeColor(item.template_type || "REFERRAL")}>
                        {typeLabel(item.template_type || "REFERRAL")}
                      </Badge>
                    </div>
                  </button>
                ))}

                {filteredTemplates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Aucun modèle trouvé
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Éditeur de modèle"
          subtitle="Création / modification"
          icon={FileText}
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
                <label className="mb-1 block text-sm font-medium text-slate-700">Type de modèle</label>
                <select
                  value={form.template_type}
                  onChange={(e) => setForm({ ...form, template_type: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="REFERRAL">Orientation</option>
                  <option value="CERTIFICATE">Certificat</option>
                </select>
              </div>

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
                <label className="mb-1 block text-sm font-medium text-slate-700">Contenu</label>
                <textarea
                  rows="14"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  placeholder="Texte du modèle..."
                  required
                />
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium text-slate-900">Placeholders utiles</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {placeholderList.map((item) => (
                    <span key={item} className="rounded-full border px-2 py-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          ) : (
            <div className="text-sm text-slate-500">Sélectionne un modèle</div>
          )}
        </Card>
      </div>
    </>
  );
}
