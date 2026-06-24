import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "hooks/useAuth";
import { login, register } from "services/authService";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
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
      setSession(await login({ email, password }));
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ?err.message : "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card login-card profile-hero">
      <p className="eyebrow">Conta</p>
      <h1>Criar conta</h1>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>Nome<input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></label>
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} /></label>
        {error ?<p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>{loading ?"Criando conta..." : "Criar conta"}</button>
      </form>
      <p className="centered-copy">Já tem conta?<Link to="/login">Entrar</Link></p>
    </section>
  );
}
