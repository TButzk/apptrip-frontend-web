import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { Layout } from "components/Layout";
import { useAuth } from "hooks/useAuth";
import { LoginPage } from "pages/LoginPage";
import { RegisterPage } from "pages/RegisterPage";
import { RouteDetailPage } from "pages/RouteDetailPage";
import { RoutesPage } from "pages/RoutesPage";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/routes" replace /> : <Navigate to="/routes" replace />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/:routeId" element={<RouteDetailPage />} />
      </Route>
    </Routes>
  );
}
