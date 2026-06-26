import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { listMyRoutes } from "services/routesService";
import type { RouteDto, RouteStatus } from "types/domain";

const FILTERS: Array<{ label: string; value: "ALL" | RouteStatus }> = [
  { label: "Todas", value: "ALL" },
  { label: "Gravando", value: "DRAFT" },
  { label: "Finalizadas", value: "FINISHED" },
  { label: "Publicadas", value: "PUBLISHED" }
];

export function MyRoutesPage() {
  const { isAuthenticated } = useAuth();
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [filter, setFilter] = useState<"ALL" | RouteStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    listMyRoutes()
      .then(setRoutes)
      .catch((err) => setError(err instanceof Error ?err.message : "Não foi possível carregar suas rotas."))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const filtered = useMemo(
    () => filter === "ALL" ?routes : routes.filter((route) => route.status === filter),
    [filter, routes]
  );
  const counts = useMemo(() => ({
    draft: routes.filter((route) => route.status === "DRAFT").length,
    finished: routes.filter((route) => route.status === "FINISHED").length,
    published: routes.filter((route) => route.status === "PUBLISHED").length
  }), [routes]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <section className="feed-shell">
      <article className="feed-hero">
      <div className="feed-header">
        <p className="eyebrow">Biblioteca</p>
        <h1>Minhas rotas</h1>
        <p className="muted-message">Acompanhe o ciclo completo das suas rotas: gravação, revisão e publicação.</p>
      </div>
      </article>

      <div className="account-route-stats my-routes-stats">
        <span><strong>{counts.draft}</strong>Rascunhos</span>
        <span><strong>{counts.finished}</strong>Prontas</span>
        <span><strong>{counts.published}</strong>Publicadas</span>
      </div>

      <div className="inline-actions" role="group" aria-label="Filtrar minhas rotas">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={filter === item.value ?"status-pill recording" : "status-pill"}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ?<article className="post-card skeleton-card"><div className="avatar-placeholder" /><div className="skeleton-lines"><span /><span /><span /></div></article> : null}
      {error ?<article className="empty-state"><strong>{error}</strong></article> : null}
      {!loading && !error && filtered.length === 0 ?(
        <article className="empty-state">
          <strong>Nenhuma rota neste filtro.</strong>
          <p>Crie uma rota, finalize a captura e publique quando estiver pronta.</p>
          <Link to="/routes/new" className="primary-inline-action">Criar rota</Link>
        </article>
      ) : null}

      <ul className="route-list">
        {filtered.map((route) => (
          <li key={route.id} className="post-card route-glass-card">
            <div className="post-avatar route-avatar">{route.name.charAt(0).toUpperCase() || "R"}</div>
            <div className="post-body">
              <div className="post-meta"><strong>{statusLabel(route.status)}</strong><span>{route.placeIds.length} pontos</span></div>
              <Link to={routeDestination(route)} className="post-title">{route.name}</Link>
              <p>{helperText(route.status)}</p>
              <div className="post-actions">
                <Link to={`/routes/${route.id}`}>Ver detalhes</Link>
                {route.status === "DRAFT" ?<Link to={captureDestination(route.id)}>Retomar captura</Link> : null}
                {route.status === "FINISHED" ?<Link to={`/routes/${route.id}/summary`}>Revisar e publicar</Link> : null}
                {route.status === "PUBLISHED" ?<Link to={`/routes/${route.id}/summary`}>Resumo</Link> : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function statusLabel(status: RouteStatus) {
  if (status === "DRAFT") return "Em gravação";
  if (status === "FINISHED") return "Finalizada";
  return "Publicada";
}

function helperText(status: RouteStatus) {
  if (status === "DRAFT") return "Continue a coleta de pontos antes de finalizar.";
  if (status === "FINISHED") return "Revise o resumo antes de compartilhar no feed.";
  return "Disponível no feed público e nos pontos sociais vinculados.";
}

function routeDestination(route: RouteDto) {
  if (route.status === "DRAFT") return captureDestination(route.id);
  if (route.status === "FINISHED") return `/routes/${route.id}/summary`;
  return `/routes/${route.id}`;
}

function captureDestination(routeId: string) {
  return `/routes/new?routeId=${encodeURIComponent(routeId)}`;
}
