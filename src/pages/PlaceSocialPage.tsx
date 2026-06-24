import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import {
  createComment, createMedia, createPost, deleteComment, deleteMedia, deletePost,
  getPlaceSocial, linkRoute, listMyRoutes, setRating, unlinkRoute, uploadMedia
} from "services/routesService";
import type { MediaDto, MediaType, PlaceSocialDto, RouteDto } from "types/domain";

export function PlaceSocialPage() {
  const { placeId } = useParams();
  const { session, isAuthenticated, isAdmin } = useAuth();
  const [social, setSocial] = useState<PlaceSocialDto | null>(null);
  const [routes, setRoutes] = useState<RouteDto[]>([]);
  const [postText, setPostText] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("Photo");
  const [linkedRouteId, setLinkedRouteId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;
    void refresh();
    if (isAuthenticated) listMyRoutes().then(setRoutes).catch(() => setRoutes([]));
  }, [placeId, isAuthenticated]);

  const mediaByPost = useMemo(() => {
    const map = new Map<string, MediaDto[]>();
    for (const item of social?.media ?? []) {
      map.set(item.postId, [...(map.get(item.postId) ?? []), item]);
    }
    return map;
  }, [social]);

  async function refresh() {
    if (!placeId) return;
    try { setSocial(await getPlaceSocial(placeId)); } catch (err) { setError(messageOf(err)); }
  }

  async function submitPost(event: FormEvent) {
    event.preventDefault();
    if (!placeId) return;
    await action(async () => {
      let upload = null;
      if (file) upload = await uploadMedia(file);
      if (!postText.trim() && !postTitle.trim() && !upload && !mediaUrl.trim()) {
        throw new Error("Escreva algo ou adicione uma mídia.");
      }
      const post = await createPost({
        placeId,
        title: postTitle.trim() || undefined,
        message: postText.trim() || (upload || mediaUrl ? "Registro de mídia." : undefined)
      });
      if (upload || mediaUrl.trim()) {
        await createMedia(post.id, {
          name: file?.name || postTitle.trim() || "Mídia",
          url: upload?.url ?? mediaUrl.trim(),
          type: upload?.type ?? mediaType,
          storageFilename: upload?.filename,
          contentType: upload?.contentType,
          sizeBytes: upload?.sizeBytes
        });
      }
      setPostText(""); setPostTitle(""); setFile(null); setMediaUrl("");
      await refresh();
    });
  }

  async function comment(postId: string) {
    const message = commentDrafts[postId]?.trim();
    if (!message) return;
    await action(async () => {
      await createComment(postId, message);
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      await refresh();
    });
  }

  async function rate(value: number) {
    if (!placeId) return;
    await action(async () => { await setRating(placeId, value); await refresh(); });
  }

  async function addLink() {
    if (!placeId || !linkedRouteId) return;
    await action(async () => { await linkRoute(placeId, linkedRouteId); setLinkedRouteId(""); await refresh(); });
  }

  async function action(work: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await work(); } catch (err) { setError(messageOf(err)); } finally { setBusy(false); }
  }

  if (!social) return <section className="feed-shell"><article className="empty-state"><strong>{error ?? "Carregando ponto..."}</strong><Link to="/">Voltar ao feed</Link></article></section>;

  return (
    <section className="feed-shell">
      <article className="feed-hero">
        <div className="feed-header"><p className="eyebrow">Ponto social</p><h1>{social.place.name}</h1>
          <p className="muted-message">{social.place.latitude.toFixed(6)}, {social.place.longitude.toFixed(6)}</p>
        </div>
      </article>
      <article className="card">
        <div className="section-title-row"><h2>Avaliações</h2><strong>{social.ratingAverage.toFixed(1)} / 5 · {social.ratingCount}</strong></div>
        <div className="rating-row" aria-label="Avaliar ponto">
          {[1, 2, 3, 4, 5].map((value) => <button key={value} className={value <= (social.myRating ?? 0) ? "star active" : "star"} onClick={() => void rate(value)} disabled={!isAuthenticated || busy} aria-label={`${value} estrelas`}>★</button>)}
        </div>
        {!isAuthenticated ? <LoginPrompt /> : null}
      </article>

      {isAuthenticated ? <article className="card">
        <h2>Adicionar ao ponto</h2>
        <form onSubmit={submitPost} className="form-grid">
          <label>Título<input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} maxLength={180} /></label>
          <label>Publicação<textarea value={postText} onChange={(e) => setPostText(e.target.value)} maxLength={5000} /></label>
          <label>Foto, vídeo, áudio ou GIF<input type="file" accept="image/*,video/*,audio/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
          <label>Ou URL<input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} /></label>
          <label>Tipo da URL<select value={mediaType} onChange={(e) => setMediaType(e.target.value as MediaType)}><option value="Photo">Foto</option><option value="Video">Vídeo</option><option value="Audio">Áudio</option><option value="Gif">GIF</option></select></label>
          <button disabled={busy}>Publicar</button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </article> : null}

      <article className="card"><h2>Publicações</h2>
        {social.posts.length === 0 ? <p className="muted-message">Ainda não há registros neste ponto.</p> :
          <div className="social-list">{social.posts.map((post) => {
            const canModerate = isAdmin || post.userId === session?.id;
            return <section className="social-post social-card" key={post.id}>
              <div className="post-meta"><strong>{post.userName ?? "Viajante"}</strong><span>{new Date(post.date).toLocaleString("pt-BR")}</span></div>
              {post.title ? <h3>{post.title}</h3> : null}<p>{post.message}</p>
              <div className="media-grid">{(mediaByPost.get(post.id) ?? []).map((media) =>
                <div className="media-item" key={media.id}><MediaView media={media} />
                  {(isAdmin || post.userId === session?.id) ? <button className="danger-link" onClick={() => void action(async () => { await deleteMedia(post.id, media.id); await refresh(); })}>Remover mídia</button> : null}
                </div>)}</div>
              {canModerate ? <button className="danger-link" onClick={() => void action(async () => { await deletePost(post.id); await refresh(); })}>Remover publicação</button> : null}
              <div className="comments">
                {(social.comments.filter((item) => item.postId === post.id)).map((item) =>
                  <p key={item.id}><strong>{item.userName ?? "Usuário"}:</strong> {item.message}
                    {(isAdmin || item.userId === session?.id) ? <button className="inline-delete" onClick={() => void action(async () => { await deleteComment(post.id, item.id); await refresh(); })}>Excluir</button> : null}
                  </p>)}
                {isAuthenticated ? <div className="comment-form"><input placeholder="Escreva um comentário" value={commentDrafts[post.id] ?? ""} onChange={(e) => setCommentDrafts((current) => ({ ...current, [post.id]: e.target.value }))} /><button onClick={() => void comment(post.id)} disabled={busy}>Enviar</button></div> : null}
              </div>
            </section>;
          })}</div>}
      </article>

      <article className="card"><h2>Rotas vinculadas</h2>
        {social.linkedRoutes.length ? <ul className="linked-list">{social.linkedRoutes.map((link) => <li key={link.id}><Link to={`/routes/${link.routeId}`}>{link.routeName}</Link>{(isAdmin || link.userId === session?.id) ? <button className="inline-delete" onClick={() => void action(async () => { await unlinkRoute(link.id); await refresh(); })}>Remover</button> : null}</li>)}</ul> : <p className="muted-message">Nenhuma rota foi vinculada.</p>}
        {isAuthenticated ? <div className="comment-form"><select value={linkedRouteId} onChange={(e) => setLinkedRouteId(e.target.value)}><option value="">Escolha uma rota publicada</option>{routes.filter((item) => item.status === "PUBLISHED").map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button onClick={() => void addLink()} disabled={!linkedRouteId || busy}>Vincular</button></div> : null}
      </article>
    </section>
  );
}

function MediaView({ media }: { media: MediaDto }) {
  if (media.type === "Video") return <video controls preload="metadata" src={media.url} />;
  if (media.type === "Audio") return <audio controls preload="metadata" src={media.url} />;
  return <img loading="lazy" src={media.url} alt={media.name} />;
}
function LoginPrompt() { return <p className="muted-message"><Link to="/login">Entre</Link> para avaliar e participar.</p>; }
const messageOf = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";
