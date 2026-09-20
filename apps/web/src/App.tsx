import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ApiError } from "./api/client";
import { AppShell } from "./components/AppShell";
import { GuestRoute, ProtectedRoute } from "./components/RouteGuards";
import { AuthProvider } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { OrganizationsPage } from "./pages/OrganizationsPage";
import { ProjectPage } from "./pages/ProjectPage";
import { RegisterPage } from "./pages/RegisterPage";
import { TaskPage } from "./pages/TaskPage";
import { WorkspacePage } from "./pages/WorkspacePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [0, 401, 403, 404].includes(error.status)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 15_000,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route index element={<OrganizationsPage />} />
                <Route path="organizations/:orgId" element={<OrganizationPage />} />
                <Route path="organizations/:orgId/workspaces/:workspaceId" element={<WorkspacePage />} />
                <Route
                  path="organizations/:orgId/workspaces/:workspaceId/projects/:projectId"
                  element={<ProjectPage />}
                />
                <Route
                  path="organizations/:orgId/workspaces/:workspaceId/projects/:projectId/tasks/:taskId"
                  element={<TaskPage />}
                />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}