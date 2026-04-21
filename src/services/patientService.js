import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export async function getPatients() {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("nom", { ascending: true })
    .order("prenom", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPatientById(id) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPatient(payload) {
  const { clinicId, effectiveDoctorId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("patients")
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

export async function updatePatient(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("patients")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePatient(id) {
  const { clinicId } = await getCurrentUserContext();

  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}