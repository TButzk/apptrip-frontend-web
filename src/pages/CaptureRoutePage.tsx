import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RouteMap } from "components/RouteMap";
import { MaterialIcon } from "components/MaterialIcon";
import { useAuth } from "hooks/useAuth";
import { useGeolocation, type GeoPosition } from "hooks/useGeolocation";
import {
  createMedia, createPlace, createPost, createRoute, finalizeRoute, getRoutePlaces,
  listMyRoutes, uploadMedia
} from "services/routesService";
import type { CreatePlaceDto, MediaType, PlaceDto, RouteDto } from "types/domain";
import { getMinimumDistanceMeters } from "utils/settingsPreferences";
import {
  distanceMeters,
  formatAltitude,
  formatDuration,
  formatSpeedKmh,
  orderPlaces
} from "utils/routeMetrics";

const ACTIVE_ROUTE_KEY = "apptrip_web_active_route";
const POINT_QUEUE_KEY = "apptrip_web_point_queue";

export function CaptureRoutePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [route, setRoute] = useState<RouteDto | null>(null);
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  const [myRoutes, setMyRoutes] = useState<RouteDto[]>([]);
  const [recording, setRecording] = useState(false);
  const [pendingCount, setPendingCount] = useState(readQueue().length);
  const [status, setStatus] = useState("Pronto para iniciar.");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(0);
  const [noteDraft, setNoteDraft] = useState("");
  const [routesOpen, setRoutesOpen] = useState(false);
  const [recenterToken, setRecenterToken] = useState(0);
  const [livePosition, setLivePosition] = useState<GeoPosition | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const watchRef = useRef<number | null>(null);
  const routeRef = useRef<RouteDto | null>(null);
  const placesRef = useRef<PlaceDto[]>([]);
  const savingRef = useRef(false);
  const livePositionRef = useRef<GeoPosition | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const geo = useGeolocation({ enabled: isAuthenticated && !recording });
  const orderedPlaces = useMemo(() => orderPlaces(places), [places]);
  const userPosition = recording ? livePosition : geo.position;

  useEffect(() => { routeRef.current = route; }, [route]);
  useEffect(() => { placesRef.current = places; }, [places]);
  useEffect(() => { livePositionRef.current = livePosition; }, [livePosition]);
  useEffect(() => {
    if (!isAuthenticated) return;
    void loadRoutes();
    const online = () => void syncQueue();
    window.addEventListener("online", online);
    return () => {
      stopWatch();
      window.removeEventListener("online", online);
    };
  }, [isAuthenticated]);
  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setClockTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    if (recording) setSheetExpanded(true);
  }, [recording]);

  const totalDistanceKm = useMemo(() => {
    if (orderedPlaces.length < 2) return 0;
    let meters = 0;
    for (let index = 1; index < orderedPlaces.length; index += 1) {
      meters += distanceMeters(orderedPlaces[index - 1], orderedPlaces[index]);
    }
    return meters / 1000;
  }, [orderedPlaces]);

  const elapsed = useMemo(() => {
    const first = orderedPlaces.find((point) => point?.capturedAt)?.capturedAt;
    if (!first) return 0;
    const start = Date.parse(first);
    if (Number.isNaN(start)) return 0;
    const end = recording
      ? Date.now()
      : Date.parse(orderedPlaces[orderedPlaces.length - 1]?.capturedAt ?? first);
    if (Number.isNaN(end)) return 0;
    return Math.max(0, Math.floor((end - start) / 1000));
  }, [orderedPlaces, recording, clockTick]);

  if (!isAuthenticated) {
    return (
      <section className="feed-shell">
        <article className="empty-state">
          <strong>Entre para registrar rotas.</strong>
          <p>O feed é público, mas a gravação e as contribuições exigem uma conta.</p>
          <Link to="/login" className="primary-inline-action">Entrar</Link>
        </article>
      </section>
    );
  }

  async function loadRoutes() {
    try {
      const routes = await listMyRoutes();
      setMyRoutes(routes);
      const activeId = localStorage.getItem(ACTIVE_ROUTE_KEY);
      const active = routes.find((item) => item.id === activeId && item.status === "DRAFT");
      if (active) await selectRoute(active);
    } catch (err) {
      setError(messageOf(err));
    }
  }

  async function selectRoute(selected: RouteDto) {
    stopWatch();
    const points = await getRoutePlaces(selected.id);
    setRoute(selected);
    setPlaces(orderPlaces(points));
    localStorage.setItem(ACTIVE_ROUTE_KEY, selected.id);
    setRoutesOpen(false);
    setStatus(`Rota "${selected.name}" carregada.`);
  }

  async function ensureDraftRoute() {
    if (routeRef.current?.status === "DRAFT") return routeRef.current;
    const created = await createRoute({
      name: "Rota em andamento",
      minimumDistanceMeters: getMinimumDistanceMeters()
    });
    setRoute(created);
    setPlaces([]);
    localStorage.setItem(ACTIVE_ROUTE_KEY, created.id);
    setMyRoutes((current) => [created, ...current]);
    routeRef.current = created;
    return created;
  }

  async function toggleRecording() {
    if (recording) {
      stopWatch();
      setStatus("Gravação pausada.");
      return;
    }
    await action(async () => {
      const target = await ensureDraftRoute();
      startWatch(target);
    });
  }

  function startWatch(target = routeRef.current) {
    if (!target || target.status !== "DRAFT") {
      setError("Selecione uma rota em gravação.");
      return;
    }
    if (!navigator.geolocation) {
      setError("Este navegador não oferece geolocalização.");
      return;
    }
    stopWatch();
    setRecording(true);
    setStatus("Aguardando sinal GPS...");
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => void receivePosition(position),
      (geoError) => {
        stopWatch();
        setError(geoError.code === 1
          ? "Permita o acesso à localização para gravar a rota."
          : "Não foi possível receber a localização.");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }

  async function receivePosition(position: GeolocationPosition) {
    setLivePosition({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed
    });

    const active = routeRef.current;
    if (!active || savingRef.current) return;
    const orderedCurrent = orderPlaces(placesRef.current);
    const previous = orderedCurrent.length ? orderedCurrent[orderedCurrent.length - 1] : undefined;
    const current = { latitude: position.coords.latitude, longitude: position.coords.longitude };
    const distance = previous ? distanceMeters(previous, current) : Number.POSITIVE_INFINITY;
    if (previous && distance < active.minimumDistanceMeters) {
      setStatus(`Movimento de ${Math.round(distance)} m. Próximo ponto em ${active.minimumDistanceMeters} m.`);
      return;
    }
    const payload: CreatePlaceDto = {
      name: `Ponto ${placesRef.current.length + 1}`,
      routeId: active.id,
      latitude: current.latitude,
      longitude: current.longitude,
      sequence: placesRef.current.length + 1,
      capturedAt: new Date().toISOString().slice(0, 19),
      clientPointId: crypto.randomUUID(),
      accuracyMeters: position.coords.accuracy,
      type: "Public"
    };
    savingRef.current = true;
    try {
      const saved = await createPlace(payload);
      addPlace(saved);
      setStatus(`${saved.name} salvo automaticamente.`);
    } catch (err) {
      if (messageOf(err).startsWith("Ponto ignorado")) {
        setStatus(messageOf(err));
      } else {
        enqueue(payload);
        setPendingCount(readQueue().length);
        setStatus("Sem conexão. Ponto guardado para sincronização.");
      }
    } finally {
      savingRef.current = false;
    }
  }

  async function syncQueue() {
    const queue = readQueue();
    if (!queue.length) return;
    const remaining: CreatePlaceDto[] = [];
    for (const point of queue) {
      try {
        const saved = await createPlace(point);
        if (point.routeId === routeRef.current?.id) addPlace(saved);
      } catch (err) {
        if (!messageOf(err).startsWith("Ponto ignorado")) remaining.push(point);
      }
    }
    writeQueue(remaining);
    setPendingCount(remaining.length);
    if (!remaining.length) setMessage("Pontos pendentes sincronizados.");
  }

  async function finish() {
    if (!route) return;
    stopWatch();
    await action(async () => {
      await syncQueue();
      if (readQueue().some((point) => point.routeId === route.id)) {
        throw new Error("Ainda há pontos aguardando conexão. A rota não pode ser finalizada.");
      }
      const updated = await finalizeRoute(route.id);
      localStorage.removeItem(ACTIVE_ROUTE_KEY);
      replaceRoute(updated);
      navigate(`/routes/${updated.id}/summary`, { replace: true });
    });
  }

  async function ensureCurrentPoint() {
    const orderedCurrent = orderPlaces(placesRef.current);
    const latest = orderedCurrent.length ? orderedCurrent[orderedCurrent.length - 1] : null;
    if (latest) return latest;

    const active = routeRef.current;
    if (!active || active.status !== "DRAFT") {
      throw new Error("Inicie a gravação para adicionar conteúdo.");
    }

    const position = livePositionRef.current ?? geo.position;
    if (!position) {
      throw new Error("Aguarde o sinal GPS para registrar neste ponto.");
    }

    const payload: CreatePlaceDto = {
      name: `Ponto ${placesRef.current.length + 1}`,
      routeId: active.id,
      latitude: position.latitude,
      longitude: position.longitude,
      sequence: placesRef.current.length + 1,
      capturedAt: new Date().toISOString().slice(0, 19),
      clientPointId: crypto.randomUUID(),
      accuracyMeters: position.accuracy,
      type: "Public"
    };
    const saved = await createPlace(payload);
    addPlace(saved);
    setStatus(`${saved.name} registrado para publicação.`);
    return saved;
  }

  async function publishNote(messageText?: string) {
    const text = (messageText ?? noteDraft).trim();
    if (!text) return;
    await action(async () => {
      const point = await ensureCurrentPoint();
      await createPost({
        title: `Registro em ${point.name}`,
        message: text,
        placeId: point.id
      });
      setNoteDraft("");
      setMessage("Publicação adicionada ao ponto atual.");
    });
  }

  async function publishMedia(file: File, type?: MediaType) {
    await action(async () => {
      const point = await ensureCurrentPoint();
      const upload = await uploadMedia(file);
      const post = await createPost({
        title: `Registro em ${point.name}`,
        message: `Mídia adicionada em ${point.name}.`,
        placeId: point.id
      });
      await createMedia(post.id, {
        name: file.name || "Mídia",
        url: upload.url,
        type: upload.type ?? type ?? inferMediaType(file),
        storageFilename: upload.filename,
        contentType: upload.contentType,
        sizeBytes: upload.sizeBytes
      });
      setMessage("Mídia adicionada ao ponto atual.");
    });
  }

  function handleMediaPick(event: ChangeEvent<HTMLInputElement>, fallbackType?: MediaType) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    void publishMedia(file, fallbackType ?? inferMediaType(file));
  }

  function stopWatch() {
    if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current);
    watchRef.current = null;
    setRecording(false);
  }

  function addPlace(place: PlaceDto) {
    setPlaces((current) => current.some((item) => item.id === place.id) ? current : [...current, place]);
  }

  function replaceRoute(updated: RouteDto) {
    setMyRoutes((current) => current.map((item) => item.id === updated.id ? updated : item));
  }

  async function action(work: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await work();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  const gpsLabel = pendingCount ? "GPS COM FILA" : geo.error || geo.permissionDenied ? "GPS INDISPONÍVEL" : "GPS EXCELENTE";
  const gpsState = pendingCount ? "is-queue" : geo.error || geo.permissionDenied ? "is-error" : "";
  const hasDraft = route?.status === "DRAFT";
  const canInteract = Boolean(hasDraft && !busy);
  const showDualControls = hasDraft && (recording || orderedPlaces.length > 0);
  const noteReady = noteDraft.trim().length > 0;
  const sheetState = sheetExpanded ? "expanded" : "collapsed";

  return (
    <section className="capture-live-shell">
      <div className="capture-map-stage">
        <RouteMap
          points={orderedPlaces}
          userPosition={userPosition}
          followUser={recording}
          recenterToken={recenterToken}
        />

        <div className="capture-top-card glass-panel warm-shadow">
          <div className="capture-top-status">
            <span className={`capture-record-dot${recording ? " live" : ""}`} aria-hidden="true" />
            <span>{recording ? "Gravando..." : "Parado"}</span>
          </div>
          <div className="capture-top-metric">
            <span>TEMPO</span>
            <strong>{formatDuration(elapsed)}</strong>
          </div>
          <div className="capture-top-metric align-end">
            <span>DISTÂNCIA</span>
            <strong>{totalDistanceKm.toFixed(1)} <small>km</small></strong>
          </div>
        </div>

        <div className="capture-map-controls">
          <button
            type="button"
            className="capture-control-button glass-panel warm-shadow"
            aria-label="Centralizar no meu local"
            title="Centralizar no meu local"
            onClick={() => setRecenterToken((value) => value + 1)}
          >
            <MaterialIcon name="my_location" />
          </button>
          <button
            type="button"
            className="capture-control-button glass-panel warm-shadow"
            aria-label="Sincronizar pontos"
            title="Sincronizar pontos"
            onClick={() => void syncQueue()}
            disabled={busy}
          >
            <MaterialIcon name="sync" />
          </button>
          <button
            type="button"
            className="capture-control-button glass-panel warm-shadow"
            aria-label="Minhas rotas"
            title="Minhas rotas"
            onClick={() => setRoutesOpen(true)}
            disabled={busy || recording}
          >
            <MaterialIcon name="route" />
          </button>
        </div>

        <article
          className={`capture-bottom-sheet ${sheetState} glass-panel warm-shadow`}
          aria-expanded={sheetExpanded}
          onFocusCapture={(event) => {
            if (event.target instanceof HTMLElement && event.target.closest(".capture-sheet-toggle")) return;
            setSheetExpanded(true);
          }}
        >
          <button
            type="button"
            className="sheet-handle capture-sheet-toggle"
            aria-label={sheetExpanded ? "Recolher painel de captura" : "Expandir painel de captura"}
            aria-expanded={sheetExpanded}
            onClick={() => setSheetExpanded((value) => !value)}
          />
          <p className={`capture-gps-status${gpsState ? ` ${gpsState}` : ""}`}>
            <MaterialIcon name="signal_cellular_alt" size={20} />
            {gpsLabel}
          </p>
          {(error || message || (pendingCount > 0 && status)) ? (
            <p className={`capture-status-line${error ? " error" : ""}`}>
              {error ?? message ?? status}
              {pendingCount > 0 && !error && !message ? ` · ${pendingCount} ponto(s) na fila` : ""}
            </p>
          ) : null}

          <div className={`capture-input-bar${canInteract ? "" : " disabled"}`}>
            <button
              type="button"
              className="capture-input-add"
              aria-label={noteReady ? "Publicar nota" : "Anexar mídia"}
              disabled={!canInteract}
              onClick={() => {
                setSheetExpanded(true);
                if (noteReady) {
                  void publishNote();
                  return;
                }
                attachmentInputRef.current?.click();
              }}
            >
              <MaterialIcon name="add" size={22} />
            </button>
            <input
              type="text"
              value={noteDraft}
              placeholder="Algo incrível aconteceu aqui?"
              disabled={!canInteract}
              onChange={(event) => setNoteDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void publishNote();
              }}
            />
            <button
              type="button"
              className={`capture-input-icon${noteReady ? " send" : ""}`}
              aria-label={noteReady ? "Enviar nota" : "Gravar áudio"}
              disabled={!canInteract}
              onClick={() => {
                setSheetExpanded(true);
                if (noteReady) {
                  void publishNote();
                  return;
                }
                audioInputRef.current?.click();
              }}
            >
              <MaterialIcon name={noteReady ? "send" : "mic"} size={20} />
            </button>
            <button
              type="button"
              className="capture-input-icon"
              aria-label="Tirar foto"
              disabled={!canInteract}
              onClick={() => {
                setSheetExpanded(true);
                photoInputRef.current?.click();
              }}
            >
              <MaterialIcon name="photo_camera" size={20} />
            </button>
            <input
              ref={attachmentInputRef}
              type="file"
              accept="image/*,video/*,audio/*"
              hidden
              onChange={(event) => handleMediaPick(event)}
            />
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(event) => handleMediaPick(event, "Photo")}
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              capture
              hidden
              onChange={(event) => handleMediaPick(event, "Audio")}
            />
          </div>

          <div className="capture-telemetry">
            <div className="capture-telemetry-item">
              <div className="capture-telemetry-icon">
                <MaterialIcon name="landscape" size={22} />
              </div>
              <div className="capture-telemetry-copy">
                <span>ALTITUDE</span>
                <strong>{formatAltitude(userPosition?.altitude)}</strong>
              </div>
            </div>
            <div className="capture-telemetry-item">
              <div className="capture-telemetry-icon">
                <MaterialIcon name="speed" size={22} />
              </div>
              <div className="capture-telemetry-copy">
                <span>VELOCIDADE</span>
                <strong>{formatSpeedKmh(userPosition?.speed)}</strong>
              </div>
            </div>
          </div>

          {showDualControls ? (
            <div className="capture-controls">
              <button
                type="button"
                className="capture-primary-control"
                onClick={() => void toggleRecording()}
                disabled={busy}
              >
                <MaterialIcon name={recording ? "pause" : "play_arrow"} filled size={22} />
                {recording ? "Pausar" : "Iniciar"}
              </button>
              <button
                type="button"
                className="capture-secondary-control"
                onClick={() => void finish()}
                disabled={busy || !route}
              >
                <MaterialIcon name="stop" filled size={22} />
                Finalizar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="capture-start-cta"
              onClick={() => void toggleRecording()}
              disabled={busy}
            >
              <MaterialIcon name="play_arrow" filled size={22} />
              Iniciar gravação
            </button>
          )}
        </article>
      </div>

      {routesOpen ? (
        <div className="capture-routes-backdrop" role="presentation" onClick={() => setRoutesOpen(false)}>
          <div className="capture-routes-sheet" role="dialog" aria-label="Minhas rotas" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <h2>Minhas rotas</h2>
            <ul className="compact-route-list">
              {myRoutes.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="route-select-button"
                    onClick={() => void selectRoute(item)}
                    disabled={recording}
                  >
                    <span>{item.name}</span>
                    <small>{item.status}</small>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="explore-share-cancel" onClick={() => setRoutesOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const messageOf = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir a operação.";

function inferMediaType(file: File): MediaType {
  if (file.type.startsWith("video/")) return "Video";
  if (file.type.startsWith("audio/")) return "Audio";
  if (file.type === "image/gif") return "Gif";
  return "Photo";
}
function readQueue(): CreatePlaceDto[] {
  try { return JSON.parse(localStorage.getItem(POINT_QUEUE_KEY) ?? "[]") as CreatePlaceDto[]; } catch { return []; }
}
function writeQueue(queue: CreatePlaceDto[]) { localStorage.setItem(POINT_QUEUE_KEY, JSON.stringify(queue)); }
function enqueue(point: CreatePlaceDto) { writeQueue([...readQueue().filter((item) => item.clientPointId !== point.clientPointId), point]); }
