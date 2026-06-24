import { Navigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";

export function FavoritesPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <section className="stack profile-shell">
      <article className="feed-hero">
        <p className="eyebrow">Conta</p>
        <h1>Favoritos</h1>
        <p className="muted-message">Guarde trilhas incríveis para depois.</p>
      </article>

      <article className="card">
        <p className="muted-message">Suas rotas favoritas aparecerão aqui.</p>
      </article>
    </section>
  );
}
