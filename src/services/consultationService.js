import { supabase } from "../supabase/client";
import { getCurrentUserContext } from "./profileService";

export async function getConsultations() {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("consultations")
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
    .order("consultation_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConsultationsByPatient(patientId) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("patient_id", patientId)
    .order("consultation_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getConsultationById(id) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("consultations")
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

export async function createConsultation(payload) {
  const { clinicId, effectiveDoctorId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("consultations")
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

export async function updateConsultation(id, payload) {
  const { clinicId } = await getCurrentUserContext();

  const { data, error } = await supabase
    .from("consultations")
    .update(payload)
    .eq("id", id)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteConsultation(id) {
  const { clinicId } = await getCurrentUserContext();

  const { error } = await supabase
    .from("consultations")
    .delete()
    .eq("id", id)
    .eq("clinic_id", clinicId);

  if (error) throw error;
}

export async function ensureConsultationForAppointment(appointmentRow) {
  if (!appointmentRow?.id) {
    throw new Error("Rendez-vous introuvable");
  }

  if (!appointmentRow.patient_id) {
    throw new Error("Aucun patient lié à ce rendez-vous");
  }

  let consultation = null;

  if (appointmentRow.consultation_id) {
    const { data, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", appointmentRow.consultation_id)
      .maybeSingle();

    if (error) throw error;
    consultation = data || null;
  }

  if (!consultation) {
    const { data, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("appointment_id", appointmentRow.id)
      .maybeSingle();

    if (error) throw error;
    consultation = data || null;
  }

  if (!consultation) {
    const { data, error } = await supabase
      .from("consultations")
      .insert([
        {
          clinic_id: appointmentRow.clinic_id,
          doctor_id: appointmentRow.doctor_id,
          patient_id: appointmentRow.patient_id,
          appointment_id: appointmentRow.id,
          consultation_date: new Date().toISOString(),
          motif: appointmentRow.motif || "",
          symptomes: "",
          examen_clinique: "",
          diagnostic: "",
          plan: "",
          notes: "",
          tension_arterielle: "",
          frequence_cardiaque: null,
          temperature: null,
          poids: null,
          taille: null,
          spo2: null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    consultation = data;
  }

  const { error: appointmentError } = await supabase
    .from("appointments")
    .update({
      consultation_id: consultation.id,
      statut: appointmentRow.statut === "Terminé" ? "Terminé" : "En salle",
      called_at: new Date().toISOString(),
    })
    .eq("id", appointmentRow.id);

  if (appointmentError) throw appointmentError;

  return consultation;
}
