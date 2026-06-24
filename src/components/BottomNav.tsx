import { NavLink, useLocation } from "react-router-dom";

function ExploreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function StartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.13-7-7-7zm1 11h-2v-2h2v2zm0-4h-2V7h2v2z" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

const tabs = [
  { to: "/routes", label: "Explorar", icon: ExploreIcon, end: false },
  { to: "/routes/new", label: "Iniciar", icon: StartIcon, end: true },
  { to: "/profile", label: "Minha Conta", icon: AccountIcon, end: true }
] as const;

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => {
            const active = to === "/routes"
              ? location.pathname === "/" || location.pathname === "/routes"
              : isActive;
            return `bottom-nav-item${active ? " active" : ""}`;
          }}
        >
          <span className="bottom-nav-icon">
            <Icon />
          </span>
          <span className="bottom-nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
