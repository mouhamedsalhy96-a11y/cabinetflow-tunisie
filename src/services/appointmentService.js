import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export async function getAppointments() {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("appointments")
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
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createAppointment(payload) {
  const { clinicId, effectiveDoctorId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("appointments")
    .insert([
      {
        clinic_id: clinicId,
        doctor_id: effectiveDoctorId,
        ...payload,
      },
    ])
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

export async function updateAppointment(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("appointments")
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

export async function deleteAppointment(id) {
  const { clinicId } = await getCurrentUserContext();

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}

export async function markAppointmentArrived(id) {
  return updateAppointment(id, {
    statut: "Arrivé",
    arrived_at: new Date().toISOString(),
  });
}

export async function markAppointmentCalled(id) {
  return updateAppointment(id, {
    statut: "En salle",
    called_at: new Date().toISOString(),
  });
}

export async function markAppointmentFinished(id) {
  return updateAppointment(id, {
    statut: "Terminé",
  });
}

export async function markAppointmentNoShow(id) {
  return updateAppointment(id, {
    statut: "Absent",
  });
}
