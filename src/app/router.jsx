import { createBrowserRouter } from "react-router-dom";

// Layout & guards
import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";

// Public pages
import LoginPage from "../pages/LoginPage";
import PatientUploadPage from "../pages/PatientUploadPage";
import PartnerUploadPage from "../pages/PartnerUploadPage";

// App pages
import DashboardPage from "../pages/DashboardPage";
import WorklistPage from "../pages/WorklistPage";
import PatientsPage from "../pages/PatientsPage";
import PatientDetailsPage from "../pages/PatientDetailsPage";
import MedicalTimelinePage from "../pages/MedicalTimelinePage";
import AppointmentsPage from "../pages/AppointmentsPage";
import FollowUpsPage from "../pages/FollowUpsPage";
import DocumentsPage from "../pages/DocumentsPage";
import DocumentReviewPage from "../pages/DocumentReviewPage";
import PatientUploadsInboxPage from "../pages/PatientUploadsInboxPage";
import ExternalPartnersPage from "../pages/ExternalPartnersPage";
import PrintCenterPage from "../pages/PrintCenterPage";
import TemplatesPage from "../pages/TemplatesPage";
import ScannerPage from "../pages/ScannerPage";
import ProfilePage from "../pages/ProfilePage";

// Print pages
import PrescriptionPrintPage from "../pages/PrescriptionPrintPage";
import ConsultationPrintPage from "../pages/ConsultationPrintPage";
import PatientSummaryPrintPage from "../pages/PatientSummaryPrintPage";
import ReferralLetterPrintPage from "../pages/ReferralLetterPrintPage";
import MedicalCertificatePrintPage from "../pages/MedicalCertificatePrintPage";

export const router = createBrowserRouter([
  {
    path: "/connexion",
    element: <LoginPage />,
  },
  {
    path: "/portail-patient/:code",
    element: <PatientUploadPage />,
  },
  {
    path: "/portail-partenaire/:code",
    element: <PartnerUploadPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "travail", element: <WorklistPage /> },
      { path: "patients", element: <PatientsPage /> },
      { path: "patients/:id", element: <PatientDetailsPage /> },
      { path: "patients/:id/historique", element: <MedicalTimelinePage /> },
      { path: "rendez-vous", element: <AppointmentsPage /> },
      { path: "suivis", element: <FollowUpsPage /> },
      { path: "documents", element: <DocumentsPage /> },
      { path: "documents/:id/review", element: <DocumentReviewPage /> },
      { path: "uploads-patients", element: <PatientUploadsInboxPage /> },
      { path: "partenaires", element: <ExternalPartnersPage /> },
      { path: "impressions", element: <PrintCenterPage /> },
      { path: "modeles", element: <TemplatesPage /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "scanner", element: <ScannerPage /> },
      { path: "profil", element: <ProfilePage /> },
    ],
  },
  {
    path: "/ordonnance/:id",
    element: (
      <ProtectedRoute>
        <PrescriptionPrintPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/consultation/:id/impression",
    element: (
      <ProtectedRoute>
        <ConsultationPrintPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/impressions/resume/:id",
    element: (
      <ProtectedRoute>
        <PatientSummaryPrintPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/impressions/orientation/:id",
    element: (
      <ProtectedRoute>
        <ReferralLetterPrintPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/impressions/certificat/:id",
    element: (
      <ProtectedRoute>
        <MedicalCertificatePrintPage />
      </ProtectedRoute>
    ),
  },
]);