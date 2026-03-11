import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, AdminRoute, ModuleRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
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
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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

        {/* CBI Module routes */}
        <Route path="competencies" element={<ModuleRoute module="Competency Based Interview"><Competencies /></ModuleRoute>} />
        <Route path="cbi-templates" element={<ModuleRoute module="Competency Based Interview"><CbiTemplates /></ModuleRoute>} />

        {/* Job Profile Module routes */}
        <Route path="job-profiles" element={<ModuleRoute module="Job Profile"><JobProfiles /></ModuleRoute>} />
        <Route path="job-profiles/:id" element={<ModuleRoute module="Job Profile"><JobProfileDetail /></ModuleRoute>} />
        <Route path="jp-competencies" element={<ModuleRoute module="Job Profile"><JpCompetencies /></ModuleRoute>} />

        {/* Admin routes */}
        <Route path="users" element={<Users />} />
        <Route path="clients" element={<AdminRoute><Clients /></AdminRoute>} />
        <Route path="bulk-import" element={<AdminRoute><BulkImport /></AdminRoute>} />

        {/* Recruitment routes */}
        <Route path="candidates" element={<Candidates />} />
        <Route path="interviews" element={<Interviews />} />

        {/* General routes */}
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
