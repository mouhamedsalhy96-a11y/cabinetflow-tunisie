import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export async function getDocuments() {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("documents")
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
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDocumentById(id) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("documents")
    .select(`
      *,
      patients (
        id,
        nom,
        prenom,
        telephone,
        date_naissance,
        adresse
      )
    `)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .single();

  if (error) throw error;
  return data;
}

export async function uploadDocument({ file, patientId, source, statut = "À valider" }) {
  const { clinicId, effectiveDoctorId, user } = await getCurrentUserContext();

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (storageError) throw storageError;

  const { data, error } = await supabase
    .from("documents")
    .insert([
      {
        clinic_id: clinicId,
        doctor_id: effectiveDoctorId,
        patient_id: patientId || null,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || "application/octet-stream",
        source: source || "Envoi manuel",
        statut,
        doc_category: null,
        ocr_status: "PENDING",
        reviewed: false,
        ai_summary_status: "NONE",
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDocumentSignedUrl(filePath) {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60 * 10);

  if (error) throw error;
  return data?.signedUrl;
}

export async function updateDocumentStatus(id, statut) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("documents")
    .update({ statut })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentCategory(id, docCategory) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("documents")
    .update({ doc_category: docCategory })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markDocumentReviewed(id) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("documents")
    .update({
      reviewed: true,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentReviewFields(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("documents")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentOcrFields(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("documents")
    .update({
      ...payload,
      ocr_updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(doc) {
  const { clinicId } = await getCurrentUserContext();

  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([doc.file_path]);

  if (storageError) throw storageError;

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", doc.id)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}
