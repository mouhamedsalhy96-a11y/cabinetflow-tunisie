
import { supabase } from "../supabase/client";

export function generatePartnerCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function getPartnerTargetByCode(code) {
  const { data, error } = await supabase.rpc("get_partner_upload_target", {
    input_code: code,
  });

  if (error) throw error;
  return data?.[0] || null;
}

export async function uploadPartnerFile({ code, file }) {
  const ext = file.name.split(".").pop();
  const path = `partner-portal/${code}/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file);

  if (error) throw error;
  return path;
}

export async function createPartnerUploadRecord({
  doctorId,
  partnerId,
  partnerType,
  fileName,
  filePath,
  fileType,
  note,
  senderCode,
}) {
  const { error } = await supabase.from("patient_uploads").insert([
    {
      doctor_id: doctorId,
      patient_id: null,
      source_type: partnerType,
      sender_code: senderCode,
      file_name: fileName,
      file_path: filePath,
      file_type: fileType,
      note,
      status: "Nouveau",
      ocr_status: "PENDING",
    },
  ]);

  if (error) throw error;
}
``
