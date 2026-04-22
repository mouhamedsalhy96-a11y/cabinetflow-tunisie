import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import { supabase } from "../supabase/client";
import { signIn } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          navigate("/");
        }
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn({ email, password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return <div className="min-h-screen bg-slate-50 p-8">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-cyan-500 p-8 text-white shadow-sm">
          <div className="inline-flex rounded-2xl bg-white/15 p-3">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="mt-6 text-3xl font-bold">CabinetFlow Tunisie</h1>
          <p className="mt-3 text-sm text-sky-50">
            Plateforme médicale privée avec accès contrôlé par l’administrateur.
          </p>

          <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm">
            <div className="font-medium">Création de compte</div>
            <p className="mt-2 text-sky-50">
              La création de compte est désactivée sur le site.
              <br />
              Merci de contacter l’administrateur pour obtenir un accès.
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-bold">Connexion</h2>
          <p className="mt-2 text-sm text-slate-500">
            Accès réservé aux comptes créés par l’administrateur
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              <LogIn className="mr-2 inline h-4 w-4" />
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}