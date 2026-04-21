import { AlertTriangle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "../services/authService";

function reasonTitle(reason) {
  if (reason === "missing-clinic") return "Compte sans clinique liée";
  if (reason === "inactive-clinic") return "Clinique inactive";
  return "Compte non configuré";
}

function reasonMessage(reason) {
  if (reason === "missing-clinic") {
    return "Ce compte existe bien, mais aucune clinique n’a encore été attribuée. Merci de contacter l’administrateur.";
  }

  if (reason === "inactive-clinic") {
    return "La clinique liée à ce compte est actuellement inactive. Merci de contacter l’administrateur.";
  }

  return "Ce compte existe dans l’authentification, mais il n’a pas encore été configuré dans la plateforme. Merci de contacter l’administrateur.";
}

export default function AccountNotConfiguredPage({ reason = "missing-profile" }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOutUser();
    navigate("/connexion");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="inline-flex rounded-2xl bg-amber-50 p-3 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h1 className="mt-6 text-2xl font-bold">{reasonTitle(reason)}</h1>

        <p className="mt-3 text-sm text-slate-600">
          {reasonMessage(reason)}
        </p>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-medium text-slate-900">Que faire ?</div>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Vérifier que le compte a bien été créé dans l’authentification</li>
            <li>Vérifier qu’une ligne existe dans la table <strong>profiles</strong></li>
            <li>Vérifier que le rôle et la clinique sont bien renseignés</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleLogout}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
          >
            <LogOut className="mr-2 inline h-4 w-4" />
            Déconnexion
          </button>

          <button
            onClick={() => navigate("/connexion")}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}