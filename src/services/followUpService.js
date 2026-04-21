import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export async function getFollowUps() {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("follow_ups")
    .select(`
      *,
      patients (
        id,
        nom,
        prenom,
        telephone
      )
    `)
    .eq("clinic_id", clinicId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getFollowUpsByPatient(patientId) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("follow_ups")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .order("due_date", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createFollowUp(payload) {
  const { clinicId, effectiveDoctorId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("follow_ups")
    .insert([
      {
        clinic_id: clinicId,
        doctor_id: effectiveDoctorId,
        ...payload,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFollowUp(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("follow_ups")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFollowUp(id) {
  const { clinicId } = await getCurrentUserContext();

  const { error } = await supabase
    .from("follow_ups")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}

export async function markFollowUpDone(id) {
  return updateFollowUp(id, {
    status: "Fait",
    completed_at: new Date().toISOString(),
  });
}

export async function cancelFollowUp(id) {
  return updateFollowUp(id, {
    status: "Annulé",
  });
}