import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export function generatePartnerAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function getExternalPartners() {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("external_partners")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createExternalPartner(payload) {
  const { clinicId, effectiveDoctorId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("external_partners")
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

export async function updateExternalPartner(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("external_partners")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleExternalPartnerActive(id, active) {
  return updateExternalPartner(id, { active });
}

export async function deleteExternalPartner(id) {
  const { clinicId } = await getCurrentUserContext();

  const { error } = await supabase
    .from("external_partners")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}