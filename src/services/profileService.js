import { supabase } from "../supabase/client";

export async function getCurrentProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      clinics:clinics!profiles_clinic_id_fkey (
        id,
        name,
        primary_doctor_id,
        active
      )
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getCurrentAccountState() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) {
    return {
      status: "no-session",
      user: null,
      profile: null,
      clinic: null,
    };
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      status: "missing-profile",
      user,
      profile: null,
      clinic: null,
    };
  }

  // platform_admin can exist without clinic_id in the future
  if (profile.role !== "platform_admin" && !profile.clinic_id) {
    return {
      status: "missing-clinic",
      user,
      profile,
      clinic: null,
    };
  }

  if (
    profile.role !== "platform_admin" &&
    profile.clinics &&
    profile.clinics.active === false
  ) {
    return {
      status: "inactive-clinic",
      user,
      profile,
      clinic: profile.clinics,
    };
  }

  return {
    status: "ready",
    user,
    profile,
    clinic: profile.clinics || null,
  };
}

export async function getCurrentUserContext() {
  const state = await getCurrentAccountState();

  if (state.status === "no-session") {
    throw new Error("Utilisateur non connecté");
  }

  if (state.status === "missing-profile") {
    throw new Error("Compte non configuré : profil introuvable");
  }

  if (state.status === "missing-clinic") {
    throw new Error("Compte non configuré : clinique manquante");
  }

  if (state.status === "inactive-clinic") {
    throw new Error("Clinique inactive");
  }

  const { user, profile, clinic } = state;

  const primaryDoctorId = clinic?.primary_doctor_id || user.id;

  return {
    user,
    profile,
    clinicId: profile.clinic_id || null,
    clinic,
    role: profile.role,
    primaryDoctorId,
    effectiveDoctorId: profile.role === "doctor" ? user.id : primaryDoctorId,
  };
}

export async function updateCurrentProfile(payload) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Utilisateur non connecté");

  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id)
    .select(`
      *,
      clinics:clinics!profiles_clinic_id_fkey (
        id,
        name,
        primary_doctor_id,
        active
      )
    `)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}
