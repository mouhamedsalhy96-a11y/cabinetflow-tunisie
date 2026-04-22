import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Calendar,
  CalendarClock,
  FileText,
  Home,
  Inbox,
  LogOut,
  Printer,
  ScanLine,
  Stethoscope,
  UserCircle2,
  Users,
} from "lucide-react";
import { signOutUser } from "../../services/authService";
import { getCurrentProfile } from "../../services/profileService";

export default function AppLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getCurrentProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const menu = [
    { to: "/", label: "Tableau de bord", icon: Home, end: true },
    { to: "/travail", label: "Travail du jour", icon: Bell },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/rendez-vous", label: "Rendez-vous", icon: Calendar },
    { to: "/suivis", label: "Suivis", icon: CalendarClock },
    { to: "/documents", label: "Documents", icon: FileText },
    { to: "/uploads-patients", label: "Réception externe", icon: Inbox },
    { to: "/partenaires", label: "Partenaires", icon: Building2 },
    { to: "/impressions", label: "Impressions", icon: Printer },
    { to: "/modeles", label: "Modèles", icon: FileText },
    { to: "/scanner", label: "Scan & OCR", icon: ScanLine },
    { to: "/profil", label: "Profil", icon: UserCircle2 },
  ];

  async function handleLogout() {
    await signOutUser();
    navigate("/connexion");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-4">
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 p-4 text-white">
            <div className="mb-2 flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">
                CabinetFlow Tunisie
              </span>
            </div>
            <h1 className="text-2xl font-bold">Dossier médical privé</h1>
            <p className="mt-2 text-sm text-sky-50">
              {profile?.role === "secretary"
                ? "Mode secrétariat"
                : "Mode médecin"}
            </p>
          </div>

          <nav className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </aside>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
