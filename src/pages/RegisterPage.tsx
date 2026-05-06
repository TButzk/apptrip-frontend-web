import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { register } from "services/authService";
import { login } from "services/authService";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      await register({ name, email, password });
      const session = await login({ email, password });
      setToken(session.token);
      navigate("/routes");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card login-card">
      <h1>Criar conta</h1>

      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Nome
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

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
            minLength={6}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p style={{ marginTop: "1rem", textAlign: "center" }}>
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </section>
  );
}
