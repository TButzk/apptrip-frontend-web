import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { getMinimumDistanceMeters, saveMinimumDistanceMeters } from "utils/settingsPreferences";

export function SettingsPage() {
  const { isAuthenticated, logout } = useAuth();
  const [minimumDistance, setMinimumDistance] = useState(getMinimumDistanceMeters);
  const [message, setMessage] = useState<string | null>(null);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  function handleSave() {
    saveMinimumDistanceMeters(minimumDistance);
    setMessage("Configurações salvas.");
  }

  return (
    <section className="stack profile-shell">
      <article className="feed-hero">
        <p className="eyebrow">Conta</p>
        <h1>Configurações</h1>
        <p className="muted-message">Preferências, permissões e notificações.</p>
      </article>

      <article className="card">
        <h2>Captura de rota</h2>
        <p>Distância mínima entre pontos: {minimumDistance} m</p>
        <label className="settings-slider">
          <span className="sr-only">Distância mínima entre pontos</span>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={minimumDistance}
            onChange={(event) => setMinimumDistance(Number(event.target.value))}
          />
        </label>
        <button type="button" className="primary-inline-action" onClick={handleSave}>
          Salvar
        </button>
        {message ? <p className="muted-message">{message}</p> : null}
      </article>

      <article className="card">
        <h2>Sessão</h2>
        <p className="muted-message">Encerre o acesso neste dispositivo.</p>
        <button type="button" className="link-button settings-logout" onClick={logout}>
          Sair da conta
        </button>
      </article>
    </section>
  );
}
