import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { BottomNav } from "components/BottomNav";

const PRIMARY_TAB_PATHS = new Set(["/", "/routes", "/routes/new", "/profile"]);

function isPrimaryTabRoute(pathname: string) {
  return PRIMARY_TAB_PATHS.has(pathname);
}

function profileInitials(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Layout() {
  const { isAuthenticated, session } = useAuth();
  const location = useLocation();
  const showBottomNav = isAuthenticated && isPrimaryTabRoute(location.pathname);
  const hideTopbar = /\/routes\/[^/]+\/comments$/.test(location.pathname);

  return (
    <div className={`app-shell${showBottomNav ? " app-shell--with-bottom-nav" : ""}`}>
      {!hideTopbar ? (
      <header className="topbar">
        <Link to="/" className="brand" aria-label="AppTrip home">
          <span className="brand-mark">A</span>
          <span>AppTrip</span>
        </Link>
        <nav className="nav-links" aria-label={isAuthenticated ? "Conta" : "Navegação principal"}>
          {isAuthenticated ? (
            <NavLink
              to="/profile"
              className="topbar-profile-link"
              aria-label="Minha conta"
              title={session?.name}
            >
              <span className="topbar-profile-avatar" aria-hidden="true">
                {profileInitials(session?.name)}
              </span>
            </NavLink>
          ) : (
            <>
              <NavLink to="/routes">Explorar</NavLink>
              <Link to="/login" className="ghost-action">
                Entrar
              </Link>
              <Link to="/register" className="primary-action">
                Cadastrar
              </Link>
            </>
          )}
        </nav>
      </header>
      ) : null}
      <main className={`content${hideTopbar ? " content--immersive" : ""}`}>
        <Outlet />
      </main>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
