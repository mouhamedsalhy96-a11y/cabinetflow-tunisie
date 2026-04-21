
export const patientsDemo = [
  {
    id: "PAT-001",
    nom: "Amina Ben Salah",
    age: 42,
    tel: "+216 22 345 678",
    derniereVisite: "2026-04-08",
    antecedents: ["HTA", "Asthme léger"],
    documents: ["NFS_2026-04-05.pdf", "RadioThorax_2026-03-12.jpg"],
  },
  {
    id: "PAT-002",
    nom: "Youssef Trabelsi",
    age: 58,
    tel: "+216 55 111 090",
    derniereVisite: "2026-04-10",
    antecedents: ["Diabète type 2"],
    documents: ["HbA1c_2026-04-02.pdf"],
  },
  {
    id: "PAT-003",
    nom: "Leila Mansouri",
    age: 31,
    tel: "+216 98 765 123",
    derniereVisite: "2026-04-11",
    antecedents: ["Migraine"],
    documents: ["IRM_Cervicale_2026-02-19.pdf", "Ordonnance_2026-04-11.pdf"],
  },
];

export const rdvDemo = [
  {
    heure: "09:00",
    patient: "Amina Ben Salah",
    motif: "Contrôle HTA",
    statut: "Confirmé",
  },
  {
    heure: "10:20",
    patient: "Youssef Trabelsi",
    motif: "Suivi diabète",
    statut: "En attente",
  },
  {
    heure: "11:40",
    patient: "Leila Mansouri",
    motif: "Céphalées",
    statut: "Confirmé",
  },
  {
    heure: "14:00",
    patient: "Nadia Gharbi",
    motif: "Résultats bilan",
    statut: "Nouveau",
  },
];

export const docsDemo = [
  {
    nom: "NFS_2026-04-05.pdf",
    type: "Biologie",
    patient: "Amina Ben Salah",
    source: "Upload patient",
    date: "2026-04-05",
    statut: "À valider",
  },
  {
    nom: "IRM_Cervicale_2026-02-19.pdf",
    type: "Imagerie",
    patient: "Leila Mansouri",
    source: "Centre radiologie",
    date: "2026-02-19",
    statut: "Validé",
  },
  {
    nom: "HbA1c_2026-04-02.pdf",
    type: "Biologie",
    patient: "Youssef Trabelsi",
    source: "Laboratoire",
    date: "2026-04-02",
    statut: "Validé",
  },
];
