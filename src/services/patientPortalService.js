import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export function generatePatientAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function getPatientPortalTargetByCode(code) {
  const cleanCode = (code || "").trim().toUpperCase();

  const { data, error } = await supabase.rpc("get_patient_portal_target", {
    input_code: cleanCode,
  });

  if (error) throw error;
  return data?.[0] || null;
}

export async function getPartnerPortalTargetByCode(code) {
  const cleanCode = (code || "").trim().toUpperCase();

  const { data, error } = await supabase.rpc("get_partner_portal_target", {
    input_code: cleanCode,
  });

  if (error) throw error;
  return data?.[0] || null;
}

export async function uploadPatientPortalFile({ folderPrefix = "patient-portal", code, file }) {
  const fileExt = file.name.split(".").pop();
  const cleanCode = (code || "").trim().toUpperCase();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${folderPrefix}/${cleanCode}/${uniqueName}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) throw error;

  return filePath;
}

export async function createPatientPortalUploadRecord({
  code,
  senderName,
  note,
  fileName,
  filePath,
  fileType,
}) {
  const cleanCode = (code || "").trim().toUpperCase();

  const { data, error } = await supabase.rpc("create_patient_portal_upload", {
    input_code: cleanCode,
    p_sender_name: senderName || null,
    p_note: note || null,
    p_file_name: fileName,
    p_file_path: filePath,
    p_file_type: fileType || null,
  });

  if (error) throw error;
  return data;
}

export async function createPartnerPortalUploadRecord({
  code,
  senderName,
  note,
  fileName,
  filePath,
  fileType,
}) {
  const cleanCode = (code || "").trim().toUpperCase();

  const { data, error } = await supabase.rpc("create_partner_portal_upload", {
    input_code: cleanCode,
    p_sender_name: senderName || null,
    p_note: note || null,
    p_file_name: fileName,
    p_file_path: filePath,
    p_file_type: fileType || null,
  });

  if (error) throw error;
  return data;
}

export async function getPatientUploads() {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("patient_uploads")
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

export async function updatePatientUpload(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("patient_uploads")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select(`
      *,
      patients (
        id,
        nom,
        prenom,
        telephone
      )
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function markPatientUploadReviewed(id) {
  return updatePatientUpload(id, {
    status: "Vu",
    reviewed_at: new Date().toISOString(),
  });
}

export async function rejectPatientUpload(id) {
  return updatePatientUpload(id, {
    status: "Rejeté",
    reviewed_at: new Date().toISOString(),
  });
}

export async function importPatientUploadToDocuments(uploadRow) {
  if (!uploadRow.patient_id) {
    throw new Error("Aucun patient lié à cet upload");
  }

  const { clinicId } = await getCurrentUserContext();

  const { data: insertedDoc, error: insertError } = await supabase
    .from("documents")
    .insert([
      {
        clinic_id: clinicId,
        doctor_id: uploadRow.doctor_id,
        patient_id: uploadRow.patient_id,
        file_name: uploadRow.file_name,
        file_path: uploadRow.file_path,
        file_type: uploadRow.file_type,
        source: uploadRow.source_type
          ? `Portail ${uploadRow.source_type}`
          : "Portail patient",
        statut: "À valider",
      },
    ])
    .select()
    .single();

  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("patient_uploads")
    .update({
      status: "Importé",
      imported_document_id: insertedDoc.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", uploadRow.id)
    .eq("clinic_id", clinicId);

  if (updateError) throw updateError;

  return insertedDoc;
}