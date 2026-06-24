import { ReactElement } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "hooks/useAuth";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SplashScreen } from "components/SplashScreen";
import { CaptureRoutePage } from "./CaptureRoutePage";
import { LoginPage } from "./LoginPage";
import { MyRoutesPage } from "./MyRoutesPage";
import { PlaceSocialPage } from "./PlaceSocialPage";
import { ProfilePage } from "./ProfilePage";
import { RegisterPage } from "./RegisterPage";
import { RouteDetailPage } from "./RouteDetailPage";
import { RouteCommentsPage } from "./RouteCommentsPage";
import { RouteSummaryPage } from "./RouteSummaryPage";
import { RoutesPage } from "./RoutesPage";
import type { PlaceDto, PlaceSocialDto, RouteDto, UserLoginDto } from "types/domain";

const serviceMocks = vi.hoisted(() => ({
  listRoutes: vi.fn(),
  listMyRoutes: vi.fn(),
  getRouteById: vi.fn(),
  getRoutePlaces: vi.fn(),
  createRoute: vi.fn(),
  updateRoute: vi.fn(),
  createPlace: vi.fn(),
  createPost: vi.fn(),
  createMedia: vi.fn(),
  uploadMedia: vi.fn(),
  finalizeRoute: vi.fn(),
  publishRoute: vi.fn(),
  getPlaceSocial: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
  deleteMedia: vi.fn(),
  deletePost: vi.fn(),
  setRating: vi.fn(),
  linkRoute: vi.fn(),
  unlinkRoute: vi.fn()
}));

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn()
}));

vi.mock("services/routesService", () => serviceMocks);
vi.mock("services/authService", () => authMocks);
vi.mock("components/RouteMap", () => ({
  RouteMap: ({ points }: { points: PlaceDto[] }) => <div data-testid="route-map">{points.length} pontos no mapa</div>
}));

const authSession: UserLoginDto = {
  id: "user-1",
  token: "token-1",
  name: "Ana Luz",
  email: "ana@app.test",
  role: "USER"
};

const publishedRoute: RouteDto = {
  id: "route-1",
  name: "Caminho do Centro",
  userId: "user-1",
  placeIds: ["place-1", "place-2"],
  status: "PUBLISHED",
  minimumDistanceMeters: 25
};

const draftRoute: RouteDto = {
  ...publishedRoute,
  id: "route-draft",
  name: "Rascunho da Serra",
  placeIds: [],
  status: "DRAFT"
};

const finishedRoute: RouteDto = {
  ...publishedRoute,
  id: "route-finished",
  name: "Travessia finalizada",
  status: "FINISHED"
};

const places: PlaceDto[] = [
  place("place-2", "Mirante", 2, -29.2, -51.2),
  place("place-1", "Praça", 1, -29.1, -51.1)
];

describe("Web views", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    serviceMocks.listRoutes.mockResolvedValue([publishedRoute]);
    serviceMocks.listMyRoutes.mockResolvedValue([draftRoute, finishedRoute, publishedRoute]);
    serviceMocks.getRouteById.mockResolvedValue(publishedRoute);
    serviceMocks.getRoutePlaces.mockResolvedValue(places);
    serviceMocks.createRoute.mockResolvedValue(draftRoute);
    serviceMocks.createPlace.mockImplementation(async (payload) => ({
      id: `place-${payload.sequence ?? 1}`,
      name: payload.name,
      latitude: payload.latitude,
      longitude: payload.longitude,
      sequence: payload.sequence,
      routeId: payload.routeId,
      capturedAt: payload.capturedAt,
      type: payload.type ?? "Public",
      eventIds: []
    }));
    serviceMocks.finalizeRoute.mockResolvedValue(finishedRoute);
    serviceMocks.updateRoute.mockImplementation(async (id: string, payload: { name: string }) => ({
      ...finishedRoute,
      id,
      name: payload.name
    }));
    serviceMocks.publishRoute.mockResolvedValue({ ...finishedRoute, status: "PUBLISHED" });
    serviceMocks.getPlaceSocial.mockResolvedValue(socialFixture());
    serviceMocks.uploadMedia.mockResolvedValue({
      url: "https://cdn.test/foto.jpg",
      filename: "foto.jpg",
      originalName: "foto.jpg",
      contentType: "image/jpeg",
      sizeBytes: 1024,
      type: "Photo"
    });
    serviceMocks.createPost.mockResolvedValue({ id: "post-new", placeId: "place-1", date: "2026-06-16T12:00:00Z", userId: "user-1", mediaIds: [] });
    serviceMocks.createMedia.mockResolvedValue({ id: "media-new", postId: "post-new", name: "foto", url: "https://cdn.test/foto.jpg", type: "Photo" });
    serviceMocks.setRating.mockResolvedValue({ placeId: "place-1", userId: "user-1", value: 5, average: 5, count: 2 });
    authMocks.login.mockResolvedValue(authSession);
    authMocks.register.mockResolvedValue({ id: "user-1", name: "Ana Luz", email: "ana@app.test", role: "USER" });
  });

  it("renders the splash brand state", () => {
    render(<SplashScreen />);
    expect(screen.getByLabelText("Carregando AppTrip")).toBeInTheDocument();
    expect(screen.getByText("Sua jornada começa aqui")).toBeInTheDocument();
  });

  it("loads the public routes feed", async () => {
    renderView(<RoutesPage />);
    expect(screen.getByRole("heading", { name: "Explore novas rotas" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: `Abrir rota ${publishedRoute.name}` })).toBeInTheDocument();
    expect(screen.getByText("Distância")).toBeInTheDocument();
    const likeButton = screen.getByRole("button", { name: `Favoritar ${publishedRoute.name}` });
    fireEvent.click(likeButton);
    expect(likeButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: `Comentários de ${publishedRoute.name}` })).toHaveAttribute(
      "href",
      "/routes/route-1/comments"
    );
  });

  it("renders login and stores the authenticated session", async () => {
    renderView(<LoginPage />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@app.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(authMocks.login).toHaveBeenCalledWith({ email: "ana@app.test", password: "senha-segura" }));
    expect(JSON.parse(localStorage.getItem("apptrip_session") ?? "{}")).toMatchObject({ email: "ana@app.test" });
  });

  it("renders register and authenticates the new account", async () => {
    renderView(<RegisterPage />);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Ana Luz" } });
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "ana@app.test" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => expect(authMocks.register).toHaveBeenCalledWith({ name: "Ana Luz", email: "ana@app.test", password: "senha-segura" }));
    expect(authMocks.login).toHaveBeenCalledWith({ email: "ana@app.test", password: "senha-segura" });
  });

  it("loads route details with map and route media", async () => {
    renderRoute("/routes/:routeId", "/routes/route-1", <RouteDetailPage />);
    expect(await screen.findByRole("heading", { name: publishedRoute.name })).toBeInTheDocument();
    expect(screen.getByTestId("route-map")).toHaveTextContent("2 pontos no mapa");
    expect(screen.getAllByText("Foto").length).toBeGreaterThan(0);
    expect(screen.getAllByAltText("Vista").length).toBeGreaterThan(0);
    expect(screen.queryByText(/-29\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Praça|Mirante/)).not.toBeInTheDocument();
  });

  it("loads the route comments screen", async () => {
    setAuthenticatedSession();
    renderRoute("/routes/:routeId/comments", "/routes/route-1/comments", <RouteCommentsPage />);
    expect(await screen.findByRole("heading", { name: "Comentários" })).toBeInTheDocument();
    expect(screen.getByText(/Caminho do Centro · 1 comentário/)).toBeInTheDocument();
    expect(screen.getAllByText("Lindo ponto")).toHaveLength(1);
    expect(screen.getByPlaceholderText("Escreva um comentário...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Responder" })).toBeInTheDocument();
  });

  it("publishes only from a finished route summary", async () => {
    serviceMocks.getRouteById.mockResolvedValueOnce(finishedRoute);
    renderRoute("/routes/:routeId/summary", "/routes/route-finished/summary", <RouteSummaryPage />, [
      <Route key="routes" path="/routes" element={<p>Feed publicado</p>} />
    ]);

    expect(await screen.findByRole("heading", { name: `Rota salva: ${finishedRoute.name}` })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome da rota")).toHaveValue(finishedRoute.name);
    expect(screen.getByAltText("Vista")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Publicar no feed" }));

    await waitFor(() => expect(serviceMocks.publishRoute).toHaveBeenCalledWith("route-finished"));
    expect(await screen.findByText("Feed publicado")).toBeInTheDocument();
  });

  it("protects and filters my routes", async () => {
    setAuthenticatedSession();
    renderView(<MyRoutesPage />);
    expect(await screen.findByRole("heading", { name: "Minhas rotas" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Finalizadas" }));

    expect(screen.getByRole("link", { name: finishedRoute.name })).toHaveAttribute(
      "href",
      "/routes/route-finished/summary"
    );
    expect(screen.queryByRole("link", { name: draftRoute.name })).not.toBeInTheDocument();
  });

  it("starts a GPS capture and navigates to summary on finish", async () => {
    setAuthenticatedSession();
    const watchPosition = vi.fn((_success: PositionCallback) => {
      _success({
        coords: {
          latitude: -29.15,
          longitude: -51.15,
          accuracy: 8,
          altitude: 150,
          speed: 1.4,
          altitudeAccuracy: null,
          heading: null
        },
        timestamp: Date.now()
      } as GeolocationPosition);
      return 12;
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { watchPosition, clearWatch: vi.fn() }
    });

    renderRoute("/routes/new", "/routes/new", <CaptureRoutePage />, [
      <Route key="summary" path="/routes/:routeId/summary" element={<RouteSummaryPage />} />
    ]);
    serviceMocks.getRouteById.mockImplementation(async (id: string) => {
      if (id === "route-finished") return finishedRoute;
      if (id === "route-draft") return draftRoute;
      return publishedRoute;
    });

    expect(screen.getByPlaceholderText("Algo incrível aconteceu aqui?")).toBeInTheDocument();
    expect(screen.getByText("ALTITUDE")).toBeInTheDocument();
    expect(screen.getByText("VELOCIDADE")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Iniciar gravação" }));

    await waitFor(() => expect(serviceMocks.createRoute).toHaveBeenCalledWith({
      name: "Rota em andamento",
      minimumDistanceMeters: 25
    }));
    expect(watchPosition).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Finalizar" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));

    await waitFor(() => expect(serviceMocks.finalizeRoute).toHaveBeenCalledWith("route-draft"));
    expect(await screen.findByRole("heading", { name: `Rota salva: ${finishedRoute.name}` })).toBeInTheDocument();
  });

  it("uploads photo media while recording", async () => {
    setAuthenticatedSession();
    const watchPosition = vi.fn((_success: PositionCallback) => {
      _success({
        coords: {
          latitude: -29.15,
          longitude: -51.15,
          accuracy: 8,
          altitude: 150,
          speed: 1.4,
          altitudeAccuracy: null,
          heading: null
        },
        timestamp: Date.now()
      } as GeolocationPosition);
      return 12;
    });
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { watchPosition, clearWatch: vi.fn() }
    });

    renderRoute("/routes/new", "/routes/new", <CaptureRoutePage />);

    fireEvent.click(screen.getByRole("button", { name: "Iniciar gravação" }));
    await waitFor(() => expect(serviceMocks.createRoute).toHaveBeenCalled());

    const photoInput = document.querySelector('input[accept="image/*"]') as HTMLInputElement;
    const photo = new File(["img"], "foto.jpg", { type: "image/jpeg" });
    fireEvent.click(screen.getByRole("button", { name: "Tirar foto" }));
    fireEvent.change(photoInput, { target: { files: [photo] } });

    await waitFor(() => expect(serviceMocks.createPlace).toHaveBeenCalled());
    await waitFor(() => expect(serviceMocks.uploadMedia).toHaveBeenCalledWith(photo));
    expect(serviceMocks.createPost).toHaveBeenCalled();
    expect(serviceMocks.createMedia).toHaveBeenCalled();
    expect(await screen.findByText("Mídia adicionada ao ponto atual.")).toBeInTheDocument();
  });

  it("expands the capture sheet and enables media controls after a draft route starts", async () => {
    setAuthenticatedSession();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { watchPosition: vi.fn(() => 12), clearWatch: vi.fn() }
    });

    renderRoute("/routes/new", "/routes/new", <CaptureRoutePage />);

    const sheet = document.querySelector(".capture-bottom-sheet");
    expect(sheet).toHaveClass("collapsed");
    expect(screen.getByRole("button", { name: "Tirar foto" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Iniciar gravação" }));

    await waitFor(() => expect(serviceMocks.createRoute).toHaveBeenCalled());
    await waitFor(() => expect(sheet).toHaveClass("expanded"));
    expect(screen.getByRole("button", { name: "Anexar mídia" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Gravar áudio" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Tirar foto" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Recolher painel de captura" }));

    expect(sheet).toHaveClass("collapsed");
    expect(sheet).toHaveAttribute("aria-expanded", "false");
  });

  it("renders profile actions for an authenticated user", () => {
    setAuthenticatedSession();
    renderView(<ProfilePage />);
    expect(screen.getByRole("heading", { name: "Ana Luz" })).toBeInTheDocument();
    expect(screen.getByText("ana@app.test")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir Minhas Rotas" })).toHaveAttribute("href", "/routes/mine");
    expect(screen.getByRole("link", { name: /Favoritos/i })).toHaveAttribute("href", "/profile/favorites");
    expect(screen.getByRole("link", { name: /Configurações/i })).toHaveAttribute("href", "/profile/settings");
  });

  it("loads a social place and creates a post with media URL", async () => {
    setAuthenticatedSession();
    renderRoute("/places/:placeId", "/places/place-1", <PlaceSocialPage />);

    expect(await screen.findByRole("heading", { name: "Praça" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Fim de tarde" } });
    fireEvent.change(screen.getByLabelText("Publicação"), { target: { value: "Vista bonita" } });
    fireEvent.change(screen.getByLabelText("Ou URL"), { target: { value: "https://cdn.test/foto.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => expect(serviceMocks.createPost).toHaveBeenCalledWith({
      placeId: "place-1",
      title: "Fim de tarde",
      message: "Vista bonita"
    }));
    expect(serviceMocks.createMedia).toHaveBeenCalledWith("post-new", expect.objectContaining({
      url: "https://cdn.test/foto.jpg",
      type: "Photo"
    }));
  });
});

function renderView(ui: ReactElement, initialPath = "/") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {ui}
      </MemoryRouter>
    </AuthProvider>
  );
}

function renderRoute(path: string, initialPath: string, element: ReactElement, extraRoutes: ReactElement[] = []) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path={path} element={element} />
          {extraRoutes}
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

function setAuthenticatedSession(session = authSession) {
  localStorage.setItem("apptrip_token", session.token);
  localStorage.setItem("apptrip_session", JSON.stringify(session));
}

function place(id: string, name: string, sequence: number, latitude: number, longitude: number): PlaceDto {
  return {
    id,
    name,
    latitude,
    longitude,
    sequence,
    routeId: "route-1",
    type: "Public",
    eventIds: []
  };
}

function socialFixture(): PlaceSocialDto {
  return {
    place: place("place-1", "Praça", 1, -29.1, -51.1),
    posts: [{
      id: "post-1",
      title: "Primeiro registro",
      message: "Chegada ao ponto",
      date: "2026-06-16T12:00:00Z",
      userId: "user-1",
      userName: "Ana Luz",
      placeId: "place-1",
      mediaIds: ["media-1"]
    }],
    media: [{ id: "media-1", postId: "post-1", name: "Vista", url: "https://cdn.test/vista.jpg", type: "Photo" }],
    comments: [{ id: "comment-1", postId: "post-1", message: "Lindo ponto", userId: "user-2", userName: "Bia", createdAt: "2026-06-16T12:30:00Z" }],
    linkedRoutes: [{ id: "link-1", placeId: "place-1", routeId: "route-1", routeName: "Caminho do Centro", userId: "user-1", createdAt: "2026-06-16T12:00:00Z" }],
    ratingAverage: 4.5,
    ratingCount: 3,
    myRating: 4
  };
}
