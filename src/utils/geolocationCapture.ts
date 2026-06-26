export type CaptureGeolocationProfile = "mobile" | "desktop";

const MOBILE_UA_PATTERN = /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i;

export function detectCaptureGeolocationProfile(): CaptureGeolocationProfile {
  const userAgentData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (userAgentData?.mobile) return "mobile";
  if (typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches) {
    return "mobile";
  }
  if (MOBILE_UA_PATTERN.test(navigator.userAgent)) return "mobile";
  return "desktop";
}

export function getCaptureGeolocationOptions(profile: CaptureGeolocationProfile): PositionOptions {
  if (profile === "mobile") {
    return { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 };
  }
  return { enableHighAccuracy: false, maximumAge: 60000, timeout: 60000 };
}

export function isRecoverableGeolocationError(code: number) {
  return code === 2 || code === 3;
}

export function isPermissionDeniedGeolocationError(code: number) {
  return code === 1;
}

export function getGeolocationErrorMessage(code: number, profile: CaptureGeolocationProfile) {
  if (code === 1) {
    return "Permita o acesso à localização no navegador para gravar a rota.";
  }
  if (code === 2) {
    return profile === "desktop"
      ? "Não foi possível obter localização. No computador usamos posição aproximada por rede."
      : "Não foi possível obter localização. Tentando posição aproximada...";
  }
  if (code === 3) {
    return profile === "desktop"
      ? "Localização demorou. Verifique se o Windows permitiu localização para o navegador e tente novamente."
      : "Localização demorou. Tentando posição aproximada...";
  }
  return "Não foi possível receber a localização.";
}

export function getRecoverableGeolocationStatus(profile: CaptureGeolocationProfile) {
  return profile === "desktop"
    ? "Buscando localização aproximada por rede..."
    : "Buscando localização aproximada...";
}

export function seedCapturePosition(
  geolocation: Geolocation,
  profile: CaptureGeolocationProfile,
  onSuccess: PositionCallback
) {
  geolocation.getCurrentPosition(onSuccess, () => undefined, getCaptureGeolocationOptions(profile));
}

export function startCaptureWatch(
  geolocation: Geolocation,
  profile: CaptureGeolocationProfile,
  onSuccess: PositionCallback,
  onError: PositionErrorCallback
) {
  return geolocation.watchPosition(
    onSuccess,
    onError,
    getCaptureGeolocationOptions(profile)
  );
}
