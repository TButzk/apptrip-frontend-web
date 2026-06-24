import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RouteMap } from "components/RouteMap";
import { getPlaceSocial, getRouteById, getRoutePlaces, publishRoute, updateRoute } from "services/routesService";
import type { MediaDto, PlaceDto, RouteDto } from "types/domain";

export function RouteSummaryPage() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<RouteDto | null>(null);
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeName, setRouteName] = useState("");
  const [media, setMedia] = useState<MediaDto[]>([]);

  useEffect(() => {
    if (!routeId) {
      setError("Rota inválida.");
      setLoading(false);
      return;
    }

    Promise.all([getRouteById(routeId), getRoutePlaces(routeId)])
      .then(async ([routeData, points]) => {
        setTrip(routeData);
        setRouteName(routeData.name);
        setPlaces(points);
        const socialResults = await Promise.all(
          points.map((point) => getPlaceSocial(point.id).catch(() => null))
        );
        const uniqueMedia = new Map<string, MediaDto>();
        socialResults.forEach((social) => social?.media.forEach((item) => uniqueMedia.set(item.id, item)));
        setMedia([...uniqueMedia.values()]);
      })
      .catch((err) => setError(err instanceof Error ?err.message : "Não foi possível carregar o resumo."))
      .finally(() => setLoading(false));
  }, [routeId]);

  const ordered = useMemo(
    () => [...places].sort((a, b) => (a.sequence ?? 999999) - (b.sequence ?? 999999)),
    [places]
  );

  const distanceKm = useMemo(() => {
    if (ordered.length < 2) return 0;
    let meters = 0;
    for (let index = 1; index < ordered.length; index += 1) {
      meters += distanceMeters(ordered[index - 1], ordered[index]);
    }
    return meters / 1000;
  }, [ordered]);

  async function onPublish() {
    if (!trip) return;
    if (trip.status !== "FINISHED") {
      setError(trip.status === "PUBLISHED"
        ?"Esta rota já foi publicada."
        : "Finalize a captura antes de abrir o resumo de publicação.");
      return;
    }
    if (ordered.length < 2) {
      setError("A rota precisa de pelo menos 2 pontos para ser publicada.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await publishRoute(trip.id);
      navigate("/routes", { replace: true });
    } catch (err) {
      setError(err instanceof Error ?err.message : "Falha ao publicar a rota.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRouteName() {
    if (!trip || !routeName.trim() || routeName.trim() === trip.name) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateRoute(trip.id, { name: routeName.trim() });
      setTrip(updated);
      setRouteName(updated.name);
    } catch (err) {
      setError(err instanceof Error ?err.message : "Falha ao atualizar o nome da rota.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="muted-message">Carregando resumo da rota...</p>;
  }

  if (!trip) {
    return (
      <article className="empty-state">
        <strong>{error ?? "Rota não encontrada."}</strong>
        <Link to="/routes">Voltar ao feed</Link>
      </article>
    );
  }

  const canPublish = trip.status === "FINISHED" && ordered.length >= 2;

  return (
    <section className="stack">
      <article className="summary-hero">
        <span className="summary-tag">{trip.status === "PUBLISHED" ?"Rota publicada" : "Rota finalizada"}</span>
        <h1>Rota salva: {trip.name}</h1>
        <p>Revise os detalhes antes de compartilhar com a comunidade.</p>
      </article>

      <article className="card route-name-card">
        <label htmlFor="route-name">Nome da rota</label>
        <div className="route-name-row">
          <input id="route-name" value={routeName} onChange={(event) => setRouteName(event.target.value)} disabled={trip.status === "PUBLISHED"} />
          <button type="button" onClick={() => void saveRouteName()} disabled={busy || !routeName.trim() || routeName.trim() === trip.name || trip.status === "PUBLISHED"}>Salvar nome</button>
        </div>
        <p className="muted-message">Você pode renomear antes de publicar.</p>
      </article>

      <article className="card summary-map-card"><h2>Trajeto registrado</h2><RouteMap points={ordered} /></article>

      <section className="summary-metrics">
        <article className="card"><h2>Distância</h2><p>{distanceKm.toFixed(1)} km</p></article>
        <article className="card"><h2>Pontos</h2><p>{ordered.length}</p></article>
        <article className="card"><h2>Mídias</h2><p>{media.length}</p></article>
      </section>

      <article className="card">
        <h2>Mídias capturadas</h2>
        {media.length ?(
          <div className="media-grid">{media.map((item) => <SummaryMedia key={item.id} media={item} />)}</div>
        ) : <p className="muted-message">Nenhuma mídia foi adicionada durante esta rota.</p>}
      </article>

      <article className="card">
        <h2>Pronto para publicar</h2>
        <p className="muted-message">Depois da publicação, não será possível adicionar novos pontos.</p>
        {error ?<p className="error">{error}</p> : null}
        {trip.status !== "FINISHED" ?<p className="warning">Esta tela publica apenas rotas finalizadas.</p> : null}
        {ordered.length < 2 ?<p className="warning">Adicione pelo menos 2 pontos antes de publicar.</p> : null}
        <button type="button" onClick={() => void onPublish()} disabled={busy || !canPublish}>
          {busy ?"Publicando..." : trip.status === "PUBLISHED" ?"Já publicada" : "Publicar no feed"}
        </button>
        <Link to="/routes/mine" className="secondary-inline-action">Minhas rotas</Link>
      </article>
    </section>
  );
}

function SummaryMedia({ media }: { media: MediaDto }) {
  if (media.type === "Photo" || media.type === "Gif") {
    return <figure className="media-item summary-media"><img src={media.url} alt={media.name} /><figcaption>{media.name}</figcaption></figure>;
  }
  if (media.type === "Video") {
    return <figure className="media-item summary-media"><video controls src={media.url} /><figcaption>{media.name}</figcaption></figure>;
  }
  return <figure className="media-item summary-media"><audio controls src={media.url} /><figcaption>{media.name}</figcaption></figure>;
}

function distanceMeters(a: PlaceDto, b: PlaceDto) {
  const r = 6371000;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function rad(value: number) {
  return value * Math.PI / 180;
}
