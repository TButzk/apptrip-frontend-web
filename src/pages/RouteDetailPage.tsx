import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { MaterialIcon } from "components/MaterialIcon";
import { RouteMap } from "components/RouteMap";
import { getPlaceSocial, getRouteById, getRoutePlaces } from "services/routesService";
import type { PlaceDto, RouteDto } from "types/domain";
import { buildRouteMediaEntries, type RouteMediaEntry } from "utils/routeMediaEntries";

export function RouteDetailPage() {
  const { routeId } = useParams();
  const location = useLocation();
  const [route, setRoute] = useState<RouteDto | null>(null);
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  const [mediaEntries, setMediaEntries] = useState<RouteMediaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!routeId) return setError(true);
    Promise.all([getRouteById(routeId), getRoutePlaces(routeId)])
      .then(async ([routeData, points]) => {
        setRoute(routeData);
        setPlaces(points);
        const orderedPoints = [...points].sort((a, b) => (a.sequence ?? 99999) - (b.sequence ?? 99999));
        const socials = await Promise.all(
          orderedPoints.map((point) => getPlaceSocial(point.id).catch(() => null))
        );
        setMediaEntries(
          orderedPoints.flatMap((point, index) => buildRouteMediaEntries(point, socials[index]))
        );
      })
      .catch(() => setError(true)).finally(() => setLoading(false));
  }, [routeId]);
  const ordered = useMemo(() => [...places].sort((a, b) => (a.sequence ?? 99999) - (b.sequence ?? 99999)), [places]);

  if (location.hash === "#comentarios" && routeId) {
    return <Navigate to={`/routes/${routeId}/comments`} replace />;
  }

  if (loading) return <p className="muted-message">Carregando detalhes da rota...</p>;
  if (error || !route) return <section className="feed-shell"><article className="empty-state"><strong>Rota não encontrada.</strong><p>Ela pode ter sido removida ou ainda não estar publicada.</p><Link to="/">Voltar ao feed</Link></article></section>;

  const distanceKm = Math.max(1.2, ordered.length * 1.35).toFixed(1);

  return <section className="feed-shell">
    <article className="post-card route-detail-card route-detail-hero"><div className="post-avatar route-avatar">{route.name.charAt(0).toUpperCase()}</div><div className="post-body"><div className="post-meta"><strong>Rota publicada</strong><span>{ordered.length} pontos</span></div><h1>{route.name}</h1><p>Deslize pelo mapa e visite cada ponto para comentar, avaliar e publicar mídias.</p></div></article>
    <article className="card"><h2>Mapa da rota</h2><RouteMap points={ordered} /></article>
    <section className="summary-metrics route-detail-metrics">
      <article className="card"><h2>Distância</h2><p>{distanceKm} km</p></article>
      <article className="card"><h2>Duração</h2><p>{Math.max(25, ordered.length * 18)} min</p></article>
      <article className="card"><h2>Paradas</h2><p>{ordered.length}</p></article>
    </section>
    <article className="card" id="comentarios">
      <div className="section-title-row"><div><p className="eyebrow">Comunidade</p><h2>Mídias da rota</h2></div>{ordered[0] ?<Link to={`/routes/${route.id}/comments`} className="primary-inline-action">Ver comentários</Link> : null}</div>
      {mediaEntries.length ? (
        <div className="route-stops-gallery" role="list">
          {mediaEntries.map((entry) => <RouteMediaCard key={`${entry.placeId}-${entry.id}`} entry={entry} />)}
        </div>
      ) : <p className="muted-message">Nenhuma mídia ou anotação publicada nesta rota.</p>}
    </article>
  </section>;
}

function RouteMediaCard({ entry }: { entry: RouteMediaEntry }) {
  const hasVisualPreview = entry.previewUrl && entry.kind !== "audio";

  return (
    <Link to={`/places/${entry.placeId}`} className="route-stop-media-card" role="listitem">
      <div className={`route-stop-media-thumb${entry.kind === "video" ? " is-video" : ""}`}>
        {hasVisualPreview ? (
          <>
            {entry.kind === "photo" || entry.kind === "gif" ? (
              <img src={entry.previewUrl} alt={entry.title} />
            ) : (
              <video src={entry.previewUrl} muted playsInline preload="metadata" aria-hidden="true" />
            )}
            {entry.kind === "video" ? (
              <span className="route-stop-media-play" aria-hidden="true">
                <MaterialIcon name="play_arrow" size={20} />
              </span>
            ) : null}
          </>
        ) : (
          <span className="route-stop-media-placeholder" aria-hidden="true">
            <MaterialIcon name={entry.icon} size={28} />
          </span>
        )}
        <span className="route-stop-media-badge" aria-hidden="true">
          <MaterialIcon name={entry.icon} size={14} />
        </span>
      </div>
      <div className="route-stop-media-copy">
        <span className="route-stop-media-label">{entry.label}</span>
        <strong>{entry.title}</strong>
        {entry.subtitle ? <p>{truncate(entry.subtitle, 48)}</p> : null}
      </div>
    </Link>
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
