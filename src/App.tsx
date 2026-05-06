import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "hooks/useAuth";
import { AppRoutes } from "routes/AppRoutes";

export default function App() {
  const basename =
    import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL;

  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
