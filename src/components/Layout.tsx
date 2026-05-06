import { Link, Outlet } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

export function Layout() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">AppTrip MVP</div>
        <nav className="nav-links">
          <Link to="/routes">Rotas</Link>
          {isAuthenticated ? (
            <button type="button" onClick={logout} className="link-button">
              Sair
            </button>
          ) : (
            <>
              <Link to="/login">Entrar</Link>
              <Link to="/register">Cadastrar</Link>
            </>
          )}
        </nav>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
