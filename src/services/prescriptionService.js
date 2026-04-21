import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export async function getPrescriptionsByConsultation(consultationId) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("consultation_id", consultationId)
    .order("prescription_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPrescriptionById(id) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPrescription(payload) {
  const { clinicId, effectiveDoctorId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("prescriptions")
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

export async function updatePrescription(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("prescriptions")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePrescription(id) {
  const { clinicId } = await getCurrentUserContext();

  const { error } = await supabase
    .from("prescriptions")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}