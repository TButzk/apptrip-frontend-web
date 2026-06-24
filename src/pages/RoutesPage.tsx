import { useEffect, useState } from "react";
import { RouteFeedCard } from "components/RouteFeedCard";
import { listRoutes } from "services/routesService";
import type { RouteDto } from "types/domain";

const FILTERS = ["Tudo", "Trilhas", "Ciclismo", "Corrida"] as const;

export function RoutesPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("Tudo");
  const [likedRoutes, setLikedRoutes] = useState<Set<string>>(() => new Set());
  const [savedRoutes, setSavedRoutes] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    listRoutes().then(setRoutes).catch(() => setRoutes([])).finally(() => setLoading(false));
  }, []);

  return (
    <section className="explore-shell">
      <header className="explore-header">
        <h1>Explore novas rotas</h1>
        <p>Descubra as melhores trilhas e caminhos registrados pela comunidade.</p>
      </header>

      <div className="explore-filter-bar" role="group" aria-label="Filtrar rotas">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={filter === activeFilter ? "active" : ""}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? <article className="explore-route-card skeleton-card"><div className="explore-route-map-skeleton" /></article> : null}
      {!loading && routes.length === 0 ? (
        <article className="empty-state">
          <strong>Ainda não há rotas publicadas.</strong>
          <p>Quando alguém publicar uma rota, ela aparecerá aqui.</p>
        </article>
      ) : null}

      <div className="explore-feed">
        {routes.map((route) => (
          <RouteFeedCard
            key={route.id}
            route={route}
            liked={likedRoutes.has(route.id)}
            saved={savedRoutes.has(route.id)}
            onToggleLike={() => setLikedRoutes((current) => toggleSet(current, route.id))}
            onToggleSave={() => setSavedRoutes((current) => toggleSet(current, route.id))}
          />
        ))}
      </div>
    </section>
  );
}

function toggleSet(current: Set<string>, id: string) {
  const next = new Set(current);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
