import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "hooks/useAuth";
import { AppRoutes } from "./AppRoutes";

function seedSession() {
  localStorage.setItem("apptrip_token", "token-1");
  localStorage.setItem("apptrip_session", JSON.stringify({
    id: "user-1",
    token: "token-1",
    name: "Ana Luz",
    email: "ana@app.test",
    role: "USER"
  }));
}

describe("AppRoutes", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the login screen inside the public layout", () => {
    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={["/login"]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByRole("link", { name: "AppTrip home" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeTruthy();
  });

  it("redirects profile to login when there is no authenticated session", () => {
    render(
      <AuthProvider>
        <MemoryRouter
          initialEntries={["/profile"]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: "Entrar" })).toBeTruthy();
  });

  it("shows the three primary destinations in the bottom nav for an authenticated user", () => {
    seedSession();

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/routes"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    );

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(nav).toHaveClass("bottom-nav");
    expect(nav).toHaveTextContent("Explorar");
    expect(nav).toHaveTextContent("Iniciar");
    expect(nav).toHaveTextContent("Minha Conta");
    expect(nav).not.toHaveTextContent("Minhas rotas");
  });

  it("keeps guest navigation in the top bar without a bottom nav", () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/routes"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    );

    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    expect(nav).toHaveClass("nav-links");
    expect(nav).toHaveTextContent("Explorar");
    expect(screen.getByRole("link", { name: "Entrar" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cadastrar" })).toBeTruthy();
    expect(document.querySelector(".bottom-nav")).toBeNull();
  });

  it("hides the bottom nav on secondary routes for authenticated users", () => {
    seedSession();

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/routes/abc"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(document.querySelector(".bottom-nav")).toBeNull();
    expect(screen.getByRole("navigation", { name: "Conta" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Minha conta" })).toBeInTheDocument();
  });
});
