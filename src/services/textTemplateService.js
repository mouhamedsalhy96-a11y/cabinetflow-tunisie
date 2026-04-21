import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export async function getTextTemplates() {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("text_templates")
    .select("*")
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTextTemplateById(id) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("text_templates")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .single();

  if (error) throw error;
  return data;
}

export async function createTextTemplate(payload) {
  const { clinicId, effectiveDoctorId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("text_templates")
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

export async function updateTextTemplate(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("text_templates")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTextTemplate(id) {
  const { clinicId } = await getCurrentUserContext();

  const { error } = await supabase
    .from("text_templates")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}