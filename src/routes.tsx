import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Competencies from "./pages/Competencies";
import CbiTemplates from "./pages/CbiTemplates";
import JobProfiles from "./pages/JobProfiles";
import JobProfileDetail from "./pages/JobProfileDetail";
import JpCompetencies from "./pages/JpCompetencies";
import Users from "./pages/Users";
import Clients from "./pages/Clients";
import Candidates from "./pages/Candidates";
import Interviews from "./pages/Interviews";
import Notifications from "./pages/Notifications";
import InterviewForm from "./pages/InterviewForm";
import Profile from "./pages/Profile";
import BulkImport from "./pages/BulkImport";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Public interview form — no auth required */}
      <Route path="/interview/:token" element={<InterviewForm />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="competencies" element={<Competencies />} />
        <Route path="cbi-templates" element={<CbiTemplates />} />
        <Route path="job-profiles" element={<JobProfiles />} />
        <Route path="job-profiles/:id" element={<JobProfileDetail />} />
        <Route path="jp-competencies" element={<JpCompetencies />} />
        <Route path="users" element={<Users />} />
        <Route path="clients" element={<Clients />} />
        <Route path="bulk-import" element={<BulkImport />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="interviews" element={<Interviews />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
