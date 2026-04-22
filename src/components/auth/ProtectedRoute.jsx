import React from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../supabase/client";
import { getCurrentAccountState } from "../../services/profileService";
import AccountNotConfiguredPage from "../../pages/AccountNotConfiguredPage";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [accountState, setAccountState] = useState({
    status: "checking",
    user: null,
    profile: null,
    clinic: null,
  });

  useEffect(() => {
    async function checkAccess() {
      setLoading(true);

      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        setSession(currentSession || null);

        if (!currentSession) {
          setAccountState({
            status: "no-session",
            user: null,
            profile: null,
            clinic: null,
          });
          return;
        }

        const state = await getCurrentAccountState();
        setAccountState(state);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-8">Chargement...</div>;
  }

  if (!session || accountState.status === "no-session") {
    return <Navigate to="/connexion" replace />;
  }

  if (accountState.status !== "ready") {
    return <AccountNotConfiguredPage reason={accountState.status} />;
  }

  return children;
}