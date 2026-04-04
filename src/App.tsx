// App.tsx — updated with RBAC route guards

import { QueryClientProvider } from "@tanstack/react-query";
import { createAppQueryClient } from "@/lib/queryClient";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
  ProtectedRoute,
  AdminRoute,
  FranchiseRoute,
  TrainingRoute,
} from "@/features/Login/routes";

import { DashboardLayout } from "@/features/dashboard/layouts/DashboardLayout";
import { LoginPage } from "@/features/Login/LoginPage";

// Admin Modules
import { DashboardHome }    from "@/features/dashboard/modules/DashboardHome";
import { CustomersModule }  from "@/features/dashboard/modules/customers/CustomersModule";
import { ProgressModule }   from "@/features/dashboard/modules/ProgressModule";
import {
  GymSetupModule,
  ProjectListPage,
  ProjectCreatePage,
  ProjectDetailPage,
} from "@/features/dashboard/modules/gym-setup";
import { GymClientsModule, GymClientDetail } from "@/features/dashboard/modules/gym-clients";
import { CustomerDetail }   from "@/features/dashboard/modules/customers/CustomerDetail";
import { LeadsModule }      from "@/features/dashboard/modules/leads/LeadsModule";
import { LeadDetail }       from "@/features/dashboard/modules/leads/LeadDetail";

// Shared Modules
import { ClientPayments }   from "@/features/dashboard/modules/gym-setup/ClientPayments";

// Franchise & Training Modules
import {
  FranchiseOverview,
  FranchiseProjects,
  FranchiseProjectDetail,
  FranchisePayments,
} from "@/features/dashboard/modules/franchise";
import { ClientOverview }   from "@/features/dashboard/modules/ClientOverview";
import { ClientProgress }   from "@/features/dashboard/modules/ClientProgress";
import { TrainingClientPayments } from "@/features/dashboard/modules/training/TrainingClientPayments";

import { ProfilePage } from "@/features/dashboard/modules/profile/ProfilePage";


import NotFound from "./pages/NotFound";

const queryClient = createAppQueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>

          {/* ───────────── AUTH ───────────── */}
          <Route path="/" element={<LoginPage />} />

          {/* ───────────── ADMIN ───────────── */}
          <Route
            path="/dashboard/admin"
            element={
              <AdminRoute>
                <DashboardLayout />
              </AdminRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="customers"       element={<CustomersModule />} />
            <Route path="customers/:id"   element={<CustomerDetail />} />
            <Route path="progress"        element={<ProgressModule />} />
            <Route path="gym-setup" element={<GymSetupModule />}>
              <Route index element={<ProjectListPage />} />
              <Route path="new" element={<ProjectCreatePage />} />
              <Route path=":projectId" element={<ProjectDetailPage />} />
            </Route>
            <Route path="gym-clients" element={<GymClientsModule />} />
            <Route path="gym-clients/:id" element={<GymClientDetail />} />
            <Route path="leads"           element={<LeadsModule />} />
            <Route path="leads/:id"       element={<LeadDetail />} />
            <Route path="payments"        element={<ClientPayments />} />
            <Route path="profile" element={<ProfilePage />} />

          </Route>

          {/* ───────────── FRANCHISE CLIENT ───────────── */}
          <Route
            path="/dashboard/franchise"
            element={
              <FranchiseRoute>
                <DashboardLayout />
              </FranchiseRoute>
            }
          >
            <Route index element={<FranchiseOverview />} />
            <Route path="projects" element={<FranchiseProjects />} />
            <Route path="projects/:projectId" element={<FranchiseProjectDetail />} />
            <Route path="project" element={<Navigate to="/dashboard/franchise/projects" replace />} />
            <Route path="payments" element={<FranchisePayments />} />
            <Route path="profile" element={<ProfilePage />} />

          </Route>

          {/* ───────────── PERSONAL TRAINING CLIENT ───────────── */}
          <Route
            path="/dashboard/training"
            element={
              <TrainingRoute>
                <DashboardLayout />
              </TrainingRoute>
            }
          >
            <Route index            element={<ClientOverview />} />
            <Route path="progress"  element={<ClientProgress />} />
            <Route path="payments"  element={<TrainingClientPayments />} />
            <Route path="profile" element={<ProfilePage />} />

          </Route>

          {/* ───────────── REDIRECTS ───────────── */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* ───────────── 404 ───────────── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;