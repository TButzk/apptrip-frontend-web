import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { MaterialIcon } from "components/MaterialIcon";
import { useAuth } from "hooks/useAuth";
import {
  createComment,
  createPost,
  getPlaceSocial,
  getRouteById,
  getRoutePlaces
} from "services/routesService";
import type { CommentDto, PlaceDto, PostDto, RouteDto } from "types/domain";
import { formatRelativeTime, profileInitials } from "utils/formatRelativeTime";

type PlaceSocialBundle = {
  place: PlaceDto;
  posts: PostDto[];
  comments: CommentDto[];
};

type RouteComment = CommentDto & {
  placeName: string;
};

export function RouteCommentsPage() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [route, setRoute] = useState<RouteDto | null>(null);
  const [bundles, setBundles] = useState<PlaceSocialBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<RouteComment | null>(null);
  const [busy, setBusy] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!routeId) return;
    void load(routeId);
  }, [routeId]);

  async function load(id: string) {
    setLoading(true);
    setError(null);
    try {
      const [routeData, places] = await Promise.all([getRouteById(id), getRoutePlaces(id)]);
      const socials = await Promise.all(
        places.map(async (place) => {
          const social = await getPlaceSocial(place.id).catch(() => null);
          return {
            place,
            posts: social?.posts ?? [],
            comments: social?.comments ?? []
          };
        })
      );
      setRoute(routeData);
      setBundles(socials);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setLoading(false);
    }
  }

  const comments = useMemo<RouteComment[]>(() => {
    const seen = new Set<string>();
    return bundles
      .flatMap((bundle) => bundle.comments.map((comment) => ({
        ...comment,
        placeName: bundle.place.name
      })))
      .filter((comment) => {
        if (seen.has(comment.id)) return false;
        seen.add(comment.id);
        return true;
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [bundles]);

  async function ensureDiscussionPost() {
    for (const bundle of bundles) {
      if (bundle.posts[0]) return bundle.posts[0].id;
    }
    const firstPlace = bundles[0]?.place;
    if (!firstPlace) throw new Error("Esta rota ainda não tem pontos para comentar.");
    const post = await createPost({
      placeId: firstPlace.id,
      title: route?.name ? `Comentários: ${route.name}` : "Comentários da rota",
      message: "Discussão aberta pela comunidade."
    });
    setBundles((current) => current.map((bundle, index) => (
      index === 0 ? { ...bundle, posts: [post, ...bundle.posts] } : bundle
    )));
    return post.id;
  }

  async function submitComment() {
    const message = draft.trim();
    if (!message || !routeId) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const postId = replyTo?.postId ?? await ensureDiscussionPost();
      const prefix = replyTo ? `@${replyTo.userName ?? "usuário"} ` : "";
      await createComment(postId, `${prefix}${message}`);
      setDraft("");
      setReplyTo(null);
      await load(routeId);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  if (!routeId) return <Navigate to="/routes" replace />;

  if (loading) {
    return (
      <section className="route-comments-shell">
        <header className="route-comments-header glass-panel">
          <button type="button" className="route-comments-back" onClick={() => navigate(-1)} aria-label="Voltar">
            <MaterialIcon name="arrow_back" />
          </button>
          <h1>Comentários</h1>
        </header>
        <p className="route-comments-loading">Carregando comentários...</p>
      </section>
    );
  }

  if (error && !route) {
    return (
      <section className="route-comments-shell">
        <header className="route-comments-header glass-panel">
          <button type="button" className="route-comments-back" onClick={() => navigate(-1)} aria-label="Voltar">
            <MaterialIcon name="arrow_back" />
          </button>
          <h1>Comentários</h1>
        </header>
        <article className="empty-state">
          <strong>{error}</strong>
          <Link to="/routes">Voltar ao feed</Link>
        </article>
      </section>
    );
  }

  const noteReady = draft.trim().length > 0;

  return (
    <section className="route-comments-shell">
      <header className="route-comments-header glass-panel">
        <button
          type="button"
          className="route-comments-back"
          onClick={() => {
            if (route) navigate(`/routes/${route.id}`);
            else navigate(-1);
          }}
          aria-label="Voltar"
        >
          <MaterialIcon name="arrow_back" />
        </button>
        <h1>Comentários</h1>
      </header>

      <main className="route-comments-feed">
        {route ? (
          <p className="route-comments-context">
            {route.name}
            {comments.length ? ` · ${comments.length} comentário${comments.length > 1 ? "s" : ""}` : ""}
          </p>
        ) : null}

        {comments.length === 0 ? (
          <article className="route-comments-empty">
            <strong>Nenhum comentário ainda</strong>
            <p>Seja o primeiro a compartilhar uma impressão sobre esta rota.</p>
          </article>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="route-comment-card">
              <div className="route-comment-avatar" aria-hidden="true">
                {profileInitials(comment.userName)}
              </div>
              <div className="route-comment-body">
                <div className="route-comment-bubble warm-shadow">
                  <div className="route-comment-meta">
                    <strong>{comment.userName ?? "Viajante"}</strong>
                    <span>{formatRelativeTime(comment.createdAt)}</span>
                  </div>
                  <p>{comment.message}</p>
                </div>
                <div className="route-comment-actions">
                  <button
                    type="button"
                    className={`route-comment-like${liked[comment.id] ? " active" : ""}`}
                    onClick={() => setLiked((current) => ({ ...current, [comment.id]: !current[comment.id] }))}
                  >
                    <MaterialIcon name="favorite" filled={Boolean(liked[comment.id])} size={18} />
                    {liked[comment.id] ? 1 : 0}
                  </button>
                  <button
                    type="button"
                    className="route-comment-reply"
                    onClick={() => {
                      setReplyTo(comment);
                      setDraft("");
                    }}
                  >
                    Responder
                  </button>
                </div>
              </div>
            </article>
          ))
        )}

        {error ? <p className="route-comments-error">{error}</p> : null}
      </main>

      <footer className="route-comments-footer">
        {replyTo ? (
          <div className="route-comments-replying">
            <span>Respondendo {replyTo.userName ?? "usuário"}</span>
            <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancelar resposta">
              <MaterialIcon name="close" size={18} />
            </button>
          </div>
        ) : null}
        <div className="route-comments-input-bar warm-shadow">
          <button type="button" className="route-comments-attach" aria-label="Anexar" disabled>
            <MaterialIcon name="add" />
          </button>
          <input
            type="text"
            value={draft}
            placeholder={isAuthenticated ? "Escreva um comentário..." : "Entre para comentar"}
            disabled={!isAuthenticated || busy}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submitComment();
            }}
          />
          <button
            type="button"
            className={`route-comments-send${noteReady ? " ready" : ""}`}
            aria-label={noteReady ? "Enviar comentário" : "Gravar áudio"}
            disabled={!isAuthenticated || busy}
            onClick={() => {
              if (noteReady) void submitComment();
            }}
          >
            <MaterialIcon name={noteReady ? "send" : "mic"} />
          </button>
        </div>
        {!isAuthenticated ? (
          <p className="route-comments-login-hint">
            <Link to="/login">Entre</Link> para participar da conversa.
          </p>
        ) : null}
      </footer>
    </section>
  );
}

const messageOf = (error: unknown) => error instanceof Error ? error.message : "Não foi possível carregar os comentários.";
