
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentProfile } from "../../services/profileService";

export default function RoleGuard({ allowedRoles = [], children }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const current = await getCurrentProfile();
        if (mounted) setProfile(current);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  if (!profile) {
    return <Navigate to="/connexion" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
