
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Clock3, Phone, Users } from "lucide-react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { getAppointments } from "../services/appointmentService";
import { getPatients } from "../services/patientService";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function SecretaryBoardPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [appointmentsData, patientsData] = await Promise.all([
        getAppointments(),
        getPatients(),
      ]);

      setAppointments(appointmentsData || []);
      setPatients(patientsData || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const today = todayDate();

  const stats = useMemo(() => {
    const todayAppointments = appointments.filter(
      (a) => a.appointment_date === today
    );

    return {
      totalPatients: patients.length,
      today: todayAppointments.length,
      nouveau: todayAppointments.filter((a) => a.statut === "Nouveau").length,
      confirme: todayAppointments.filter((a) => a.statut === "Confirmé").length,
      enSalle: todayAppointments.filter((a) => a.statut === "En salle").length,
      termine: todayAppointments.filter((a) => a.statut === "Terminé").length,
    };
  }, [appointments, patients, today]);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.appointment_date === today)
      .sort((a, b) => {
        const left = `${a.appointment_date} ${a.appointment_time}`;
        const right = `${b.appointment_date} ${b.appointment_time}`;
        return left.localeCompare(right);
      });
  }, [appointments, today]);

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-bold">Secrétariat</h2>
        <p className="text-sm text-slate-500">
          Vue rapide des rendez-vous et de l’accueil
        </p>
      </header>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <Card title="Patients" subtitle="Total" icon={Users}>
              <div className="text-3xl font-bold">{stats.totalPatients}</div>
            </Card>

            <Card title="Aujourd'hui" subtitle="RDV" icon={Calendar}>
              <div className="text-3xl font-bold">{stats.today}</div>
            </Card>

            <Card title="Nouveaux" subtitle="À appeler" icon={Clock3}>
              <div className="text-3xl font-bold">{stats.nouveau}</div>
            </Card>

            <Card title="Confirmés" subtitle="Planifiés" icon={CheckCircle2}>
              <div className="text-3xl font-bold">{stats.confirme}</div>
            </Card>

            <Card title="En salle" subtitle="En cours" icon={Users}>
              <div className="text-3xl font-bold">{stats.enSalle}</div>
            </Card>

            <Card title="Terminés" subtitle="Clos" icon={CheckCircle2}>
              <div className="text-3xl font-bold">{stats.termine}</div>
            </Card>
          </div>

          <Card title="Planning du jour" subtitle={today} icon={Calendar}>
            <div className="space-y-3">
              {todayAppointments.map((rdv) => (
                <div
                  key={rdv.id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {rdv.appointment_time} •{" "}
                        {rdv.patients
                          ? [rdv.patients.nom, rdv.patients.prenom]
                              .filter(Boolean)
                              .join(" ")
                          : "Sans patient"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {rdv.motif || "Sans motif"}
                      </p>

                      {rdv.patients?.telephone ? (
                        <p className="mt-1 inline-flex items-center gap-2 text-xs text-slate-400">
                          <Phone className="h-4 w-4" />
                          {rdv.patients.telephone}
                        </p>
                      ) : null}
                    </div>

                    <Badge
                      color={
                        rdv.statut === "Confirmé"
                          ? "green"
                          : rdv.statut === "En salle"
                          ? "blue"
                          : rdv.statut === "Terminé"
                          ? "green"
                          : "amber"
                      }
                    >
                      {rdv.statut}
                    </Badge>
                  </div>
                </div>
              ))}

              {todayAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  Aucun rendez-vous aujourd’hui
                </div>
              ) : null}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
