import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export async function getLinkedDocumentsByConsultation(consultationId) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("consultation_documents")
    .select(`
      *,
      documents (
        id,
        patient_id,
        file_name,
        file_path,
        file_type,
        source,
        statut,
        created_at
      )
    `)
    .eq("clinic_id", clinicId)
    .eq("consultation_id", consultationId);

  if (error) throw error;
  return data || [];
}

export async function linkDocumentToConsultation({ consultationId, documentId }) {
  const { clinicId } = await getCurrentUserContext();

  const { data: existing, error: existingError } = await supabase
    .from("consultation_documents")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("consultation_id", consultationId)
    .eq("document_id", documentId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from("consultation_documents")
    .insert([
      {
        clinic_id: clinicId,
        consultation_id: consultationId,
        document_id: documentId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unlinkDocumentFromConsultation(linkId) {
  const { clinicId } = await getCurrentUserContext();

  const { error } = await supabase
    .from("consultation_documents")
    .delete()
    .eq("id", linkId)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}
