import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRoutes } from "services/routesService";
import type { RouteDto } from "types/domain";

export function RoutesPage() {
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const data = await listRoutes(0, 30);
        setRoutes(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar rotas.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchRoutes();
  }, []);

  if (loading) {
    return <p>Carregando rotas...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (routes.length === 0) {
    return <p>Nenhuma rota encontrada.</p>;
  }

  return (
    <section className="card">
      <h1>Rotas Publicadas</h1>
      <ul className="route-list">
        {routes.map((route) => (
          <li key={route.id}>
            <Link to={`/routes/${route.id}`}>{route.name}</Link>
            <small>Status: {route.status}</small>
            <small>{route.placeIds.length} ponto(s)</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
