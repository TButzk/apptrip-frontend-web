import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RouteMap } from "components/RouteMap";
import { getPlaceSocial, getRoutePlaces } from "services/routesService";
import type { PlaceDto, RouteDto } from "types/domain";
import {
  formatLocation,
  routeDifficultyLabel,
  routeDistanceKm,
  routeDurationLabel
} from "utils/routeMetrics";

type RouteFeedCardProps = {
  route: RouteDto;
  liked: boolean;
  saved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
};

export function RouteFeedCard({ route, liked, saved, onToggleLike, onToggleSave }: RouteFeedCardProps) {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLElement | null>(null);
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingAverage, setRatingAverage] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void loadCardData();
    }, { rootMargin: "120px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, [route.id]);

  async function loadCardData() {
    setLoading(true);
    try {
      const routePlaces = await getRoutePlaces(route.id);
      setPlaces(routePlaces);
      if (routePlaces[0]) {
        const social = await getPlaceSocial(routePlaces[0].id).catch(() => null);
        if (social) {
          setRatingAverage(social.ratingAverage ?? null);
          setCommentCount(social.comments.length);
          setLikeCount(social.ratingCount ?? social.comments.length);
        }
      }
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }

  const distanceKm = places.length
    ? routeDistanceKm(places)
    : Math.max(1.2, route.placeIds.length * 1.35);
  const duration = routeDurationLabel(places);
  const difficulty = routeDifficultyLabel(distanceKm, places.length || route.placeIds.length);
  const location = places.length ? formatLocation(places) : "Carregando localização...";
  const shareUrl = `${window.location.origin}/routes/${route.id}`;

  function openRoute() {
    navigate(`/routes/${route.id}`);
  }

  return (
    <>
      <article
        ref={rootRef}
        className="explore-route-card shadow-soft"
        onClick={openRoute}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openRoute();
          }
        }}
        role="link"
        tabIndex={0}
        aria-label={`Abrir rota ${route.name}`}
      >
        <div className="explore-route-hero">
          {loading ? (
            <div className="explore-route-map-skeleton" aria-hidden="true" />
          ) : (
            <RouteMap points={places} preview />
          )}
          {ratingAverage != null ? (
            <div className="explore-rating-badge">
              <span aria-hidden="true">★</span>
              <span>{ratingAverage.toFixed(1)}</span>
            </div>
          ) : null}
          <div className="explore-author-pill">
            <span className="explore-author-avatar" aria-hidden="true">A</span>
            <span>Comunidade AppTrip</span>
          </div>
        </div>

        <div className="explore-route-body">
          <div className="explore-route-title-row">
            <div>
              <h3>{route.name}</h3>
              <p className="explore-route-location">{location}</p>
            </div>
            <div className="explore-route-thumb" aria-hidden="true">
              {!loading ? <RouteMap points={places} preview compact /> : null}
            </div>
          </div>

          <hr className="explore-route-divider" />

          <div className="explore-route-stats">
            <div>
              <span>Distância</span>
              <strong>{distanceKm.toFixed(1)} km</strong>
            </div>
            <div>
              <span>Duração</span>
              <strong>{duration}</strong>
            </div>
            <div>
              <span>Dificuldade</span>
              <strong>{difficulty}</strong>
            </div>
          </div>

          <div className="explore-social-actions">
            <div className="explore-social-group">
              <button
                type="button"
                className={`explore-social-pill${liked ? " active" : ""}`}
                aria-label={`Favoritar ${route.name}`}
                aria-pressed={liked}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleLike();
                }}
              >
                <span aria-hidden="true">♥</span>
                <span>{likeCount + (liked ? 1 : 0)}</span>
              </button>
              <Link
                to={`/routes/${route.id}/comments`}
                className="explore-social-pill"
                aria-label={`Comentários de ${route.name}`}
                onClick={(event) => event.stopPropagation()}
              >
                <span aria-hidden="true">💬</span>
                <span>{commentCount}</span>
              </Link>
              <button
                type="button"
                className="explore-social-icon"
                aria-label={`Compartilhar ${route.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setShareOpen(true);
                }}
              >
                ↗
              </button>
            </div>
            <button
              type="button"
              className={`explore-social-icon bookmark${saved ? " active" : ""}`}
              aria-label={`Salvar ${route.name}`}
              aria-pressed={saved}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSave();
              }}
            >
              {saved ? "🔖" : "⌑"}
            </button>
          </div>
        </div>
      </article>

      {shareOpen ? (
        <div className="explore-share-backdrop" role="presentation" onClick={() => setShareOpen(false)}>
          <div className="explore-share-sheet" role="dialog" aria-label="Compartilhar rota" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <h3>Compartilhar</h3>
            <button
              type="button"
              className="explore-share-option"
              onClick={() => {
                void navigator.clipboard.writeText(shareUrl);
                setShareOpen(false);
              }}
            >
              Copiar link
            </button>
            <button type="button" className="explore-share-cancel" onClick={() => setShareOpen(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
