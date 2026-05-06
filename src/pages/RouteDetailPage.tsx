import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { RouteMap } from "components/RouteMap";
import { getRouteById, getRoutePlaces } from "services/routesService";
import type { PlaceDto, RouteDto } from "types/domain";

export function RouteDetailPage() {
  const { routeId } = useParams();

  const [route, setRoute] = useState<RouteDto | null>(null);
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeId) {
      setError("Rota nao informada.");
      setLoading(false);
      return;
    }

    const id = routeId;

    async function fetchRouteDetail() {
      try {
        const [routeData, placeData] = await Promise.all([
          getRouteById(id),
          getRoutePlaces(id)
        ]);

        setRoute(routeData);
        setPlaces(placeData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar detalhe da rota.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchRouteDetail();
  }, [routeId]);

  const orderedPlaces = useMemo(
    () =>
      [...places].sort((a, b) => {
        const aSequence = a.sequence ?? Number.MAX_SAFE_INTEGER;
        const bSequence = b.sequence ?? Number.MAX_SAFE_INTEGER;

        if (aSequence !== bSequence) {
          return aSequence - bSequence;
        }

        return a.id.localeCompare(b.id);
      }),
    [places]
  );

  if (loading) {
    return <p>Carregando detalhes da rota...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!route) {
    return <p>Rota nao encontrada.</p>;
  }

  return (
    <section className="stack">
      <article className="card">
        <h1>{route.name}</h1>
        <p>ID da rota: {route.id}</p>
        <p>Autor (userId): {route.userId}</p>
        <p>Status: {route.status}</p>
        {route.publishedAt ? <p>Publicada em: {route.publishedAt}</p> : null}
        {route.finalizedAt ? <p>Finalizada em: {route.finalizedAt}</p> : null}
        <p>Total de pontos: {orderedPlaces.length}</p>
      </article>

      <article className="card">
        <h2>Mapa da rota</h2>
        <RouteMap points={orderedPlaces} />
      </article>

      <article className="card">
        <h2>Pontos</h2>
        <ol className="point-list">
          {orderedPlaces.map((place) => (
            <li key={place.id}>
              <strong>{place.name || "Sem nome"}</strong>
              <span>
                {place.latitude}, {place.longitude}
              </span>
              <span>
                {place.city} - {place.state}
              </span>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
