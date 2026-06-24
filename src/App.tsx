import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { SplashScreen } from "components/SplashScreen";
import { AuthProvider } from "hooks/useAuth";
import { AppRoutes } from "routes/AppRoutes";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  const basename =
    import.meta.env.BASE_URL === "/" ?undefined : import.meta.env.BASE_URL;

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
