import { Route, Routes } from "react-router-dom";
import { Layout } from "components/Layout";
import { CaptureRoutePage } from "pages/CaptureRoutePage";
import { LoginPage } from "pages/LoginPage";
import { MyRoutesPage } from "pages/MyRoutesPage";
import { ProfilePage } from "pages/ProfilePage";
import { RegisterPage } from "pages/RegisterPage";
import { RouteSummaryPage } from "pages/RouteSummaryPage";
import { RouteDetailPage } from "pages/RouteDetailPage";
import { RouteCommentsPage } from "pages/RouteCommentsPage";
import { RoutesPage } from "pages/RoutesPage";
import { PlaceSocialPage } from "pages/PlaceSocialPage";
import { FavoritesPage } from "pages/FavoritesPage";
import { SettingsPage } from "pages/SettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<RoutesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/mine" element={<MyRoutesPage />} />
        <Route path="/routes/new" element={<CaptureRoutePage />} />
        <Route path="/routes/:routeId/comments" element={<RouteCommentsPage />} />
        <Route path="/routes/:routeId" element={<RouteDetailPage />} />
        <Route path="/routes/:routeId/summary" element={<RouteSummaryPage />} />
        <Route path="/places/:placeId" element={<PlaceSocialPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/favorites" element={<FavoritesPage />} />
        <Route path="/profile/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
