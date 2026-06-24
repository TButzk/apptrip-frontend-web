export function SplashScreen() {
  return (
    <section className="splash-screen" aria-label="Carregando AppTrip">
      <div className="splash-card">
        <div className="splash-icon">✦</div>
      </div>
      <h1>AppTrip</h1>
      <p>Sua jornada começa aqui</p>
      <div className="splash-loader" aria-hidden="true" />
    </section>
  );
}
