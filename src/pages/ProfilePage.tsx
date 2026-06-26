import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { listMyRoutes } from "services/routesService";
import type { RouteDto } from "types/domain";

export function ProfilePage() {
  const { session, isAuthenticated, logout } = useAuth();
  const [routes, setRoutes] = useState<RouteDto[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    listMyRoutes().then(setRoutes).catch(() => setRoutes([]));
  }, [isAuthenticated]);

  const routeCounts = useMemo(() => ({
    total: routes.length,
    drafts: routes.filter((route) => route.status === "DRAFT").length,
    published: routes.filter((route) => route.status === "PUBLISHED").length
  }), [routes]);

  if (!isAuthenticated || !session) return <Navigate to="/login" replace />;

  return (
    <section className="stack profile-shell">
      <article className="card profile-card profile-hero">
        <div className="profile-avatar">{initials(session.name)}</div>
        <h1>{session.name}</h1>
        <p>{session.email}</p>
        <div className="profile-badge-row"><span className="status-pill recording">Ativo</span><span className="status-pill">Perfil</span></div>
        <p className="profile-summary">Perfil pronto para acompanhar suas rotas, comentários e conquistas.</p>
      </article>

      <Link to="/routes/mine" className="card my-routes-shortcut" aria-label="Abrir Minhas Rotas">
        <div>
          <p className="eyebrow">Sua biblioteca</p>
          <h2>Minhas Rotas</h2>
          <p>Gerencie gravações, revisões e aventuras publicadas.</p>
        </div>
        <div className="account-route-stats" aria-label="Resumo das suas rotas">
          <span><strong>{routeCounts.total}</strong>Total</span>
          <span><strong>{routeCounts.drafts}</strong>Rascunhos</span>
          <span><strong>{routeCounts.published}</strong>Publicadas</span>
        </div>
        <span className="shortcut-cta">Abrir rotas →</span>
      </Link>

      <Link to="/profile/favorites" className="card profile-action-tile">
        <span className="profile-action-icon" aria-hidden="true">
          <FavoriteIcon />
        </span>
        <div className="profile-action-copy">
          <h2>Favoritos</h2>
          <p>Guarde trilhas incríveis para depois.</p>
        </div>
        <span className="profile-action-chevron" aria-hidden="true">›</span>
      </Link>

      <Link to="/profile/settings" className="card profile-action-tile">
        <span className="profile-action-icon" aria-hidden="true">
          <SettingsIcon />
        </span>
        <div className="profile-action-copy">
          <h2>Configurações</h2>
          <p>Preferências, permissões e notificações.</p>
        </div>
        <span className="profile-action-chevron" aria-hidden="true">›</span>
      </Link>

      <article className="card">
        <h2>Sessão</h2>
        <p className="muted-message">Encerre o acesso neste dispositivo.</p>
        <button type="button" className="link-button settings-logout" onClick={logout}>
          Sair da conta
        </button>
      </article>
    </section>
  );
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function FavoriteIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
    </svg>
  );
}
