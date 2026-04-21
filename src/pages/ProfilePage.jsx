import { useEffect, useState } from "react";
import { Building2, Save, UserCircle2 } from "lucide-react";
import Card from "../components/ui/Card";
import { supabase } from "../supabase/client";

const initialForm = {
  full_name: "",
  role: "",
  cabinet_name: "",
  specialty: "",
  cabinet_phone: "",
  cabinet_email: "",
  cabinet_address: "",
  cabinet_city: "",
  office_hours: "",
  professional_id: "",
  stamp_text: "",
  footer_text: "",
  referral_signoff: "",
  certificate_signoff: "",
};

export default function ProfilePage() {
  const [profileId, setProfileId] = useState(null);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadProfile() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfileId(null);
        setEmail("");
        setForm(initialForm);
        return;
      }

      setProfileId(user.id);
      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setForm({
        full_name: data?.full_name || "",
        role: data?.role || "",
        cabinet_name: data?.cabinet_name || "",
        specialty: data?.specialty || "",
        cabinet_phone: data?.cabinet_phone || "",
        cabinet_email: data?.cabinet_email || "",
        cabinet_address: data?.cabinet_address || "",
        cabinet_city: data?.cabinet_city || "",
        office_hours: data?.office_hours || "",
        professional_id: data?.professional_id || "",
        stamp_text: data?.stamp_text || "",
        footer_text: data?.footer_text || "",
        referral_signoff: data?.referral_signoff || "",
        certificate_signoff: data?.certificate_signoff || "",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!profileId) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          role: form.role,
          cabinet_name: form.cabinet_name,
          specialty: form.specialty,
          cabinet_phone: form.cabinet_phone,
          cabinet_email: form.cabinet_email,
          cabinet_address: form.cabinet_address,
          cabinet_city: form.cabinet_city,
          office_hours: form.office_hours,
          professional_id: form.professional_id,
          stamp_text: form.stamp_text,
          footer_text: form.footer_text,
          referral_signoff: form.referral_signoff,
          certificate_signoff: form.certificate_signoff,
        })
        .eq("id", profileId);

      if (error) throw error;

      setMessage("Profil enregistré");
    } catch (error) {
      setMessage(error.message || "Erreur");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold">Profil / Cabinet</h2>
        <p className="text-sm text-slate-500">
          Informations utilisées dans les impressions et documents
        </p>
      </header>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card title="Compte connecté" subtitle="Utilisateur" icon={UserCircle2}>
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <div className="text-xs text-slate-400">Email de connexion</div>
                <div className="font-medium">{email || "—"}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Rôle</div>
                <div className="font-medium">{form.role || "doctor"}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Nom affiché</div>
                <div className="font-medium">{form.full_name || "—"}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Cabinet</div>
                <div className="font-medium">{form.cabinet_name || "—"}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400">Spécialité</div>
                <div className="font-medium">{form.specialty || "—"}</div>
              </div>
            </div>
          </Card>

          <Card title="Informations cabinet" subtitle="Modification" icon={Building2}>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nom complet médecin
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cabinet / Clinique
                  </label>
                  <input
                    value={form.cabinet_name}
                    onChange={(e) =>
                      setForm({ ...form, cabinet_name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Spécialité
                  </label>
                  <input
                    value={form.specialty}
                    onChange={(e) =>
                      setForm({ ...form, specialty: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    placeholder="Médecine générale, cardiologie, pédiatrie..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Téléphone cabinet
                  </label>
                  <input
                    value={form.cabinet_phone}
                    onChange={(e) =>
                      setForm({ ...form, cabinet_phone: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email cabinet
                  </label>
                  <input
                    value={form.cabinet_email}
                    onChange={(e) =>
                      setForm({ ...form, cabinet_email: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Ville
                  </label>
                  <input
                    value={form.cabinet_city}
                    onChange={(e) =>
                      setForm({ ...form, cabinet_city: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Adresse cabinet
                </label>
                <textarea
                  rows="3"
                  value={form.cabinet_address}
                  onChange={(e) =>
                    setForm({ ...form, cabinet_address: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Horaires
                  </label>
                  <textarea
                    rows="3"
                    value={form.office_hours}
                    onChange={(e) =>
                      setForm({ ...form, office_hours: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    placeholder="Lun-Ven 08:00-17:00 ..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Identifiant professionnel
                  </label>
                  <input
                    value={form.professional_id}
                    onChange={(e) =>
                      setForm({ ...form, professional_id: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                    placeholder="RPPS / matricule / identifiant"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Texte cachet / signature
                </label>
                <textarea
                  rows="3"
                  value={form.stamp_text}
                  onChange={(e) =>
                    setForm({ ...form, stamp_text: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  placeholder="Dr ..., spécialiste ..., cachet ..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pied de page / texte légal
                </label>
                <textarea
                  rows="4"
                  value={form.footer_text}
                  onChange={(e) =>
                    setForm({ ...form, footer_text: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  placeholder="Cabinet ..., adresse ..., téléphone ..., mentions ..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Formule de fin courrier d’orientation
                </label>
                <textarea
                  rows="3"
                  value={form.referral_signoff}
                  onChange={(e) =>
                    setForm({ ...form, referral_signoff: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  placeholder="Je vous remercie de bien vouloir donner votre avis..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Formule de fin certificat
                </label>
                <textarea
                  rows="3"
                  value={form.certificate_signoff}
                  onChange={(e) =>
                    setForm({ ...form, certificate_signoff: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                  placeholder="Certificat remis à l’intéressé(e) pour servir..."
                />
              </div>

              {message ? (
                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                <Save className="mr-2 inline h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}