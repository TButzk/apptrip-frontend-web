import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { login } from "services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });
      setToken(response.token);
      navigate("/routes");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao autenticar.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card login-card">
      <h1>Entrar</h1>
      <p>Use seu email e senha cadastrados no backend.</p>

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        Não tem conta? <Link to="/register">Criar conta</Link>
      </p>
      <p style={{ textAlign: "center" }}>
        <Link to="/routes">Continuar sem conta</Link>
      </p>
    </section>
  );
}
