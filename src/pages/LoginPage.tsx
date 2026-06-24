import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { login } from "services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setSession(await login({ email, password }));
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ?err.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card login-card profile-hero">
      <p className="eyebrow">Conta</p>
      <h1>Entrar</h1>
      <p>Entre para criar rotas e participar dos pontos compartilhados.</p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error ?<p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>{loading ?"Entrando..." : "Entrar"}</button>
      </form>
      <p className="centered-copy">Não tem conta?<Link to="/register">Criar conta</Link></p>
      <p className="centered-copy"><Link to="/">Continuar sem conta</Link></p>
    </section>
  );
}
