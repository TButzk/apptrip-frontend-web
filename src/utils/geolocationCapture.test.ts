import { describe, expect, it } from "vitest";
import {
  detectCaptureGeolocationProfile,
  getCaptureGeolocationOptions,
  getGeolocationErrorMessage,
  isRecoverableGeolocationError
} from "./geolocationCapture";

describe("geolocationCapture", () => {
  it("uses relaxed options on desktop profile", () => {
    expect(getCaptureGeolocationOptions("desktop")).toEqual({
      enableHighAccuracy: false,
      maximumAge: 60000,
      timeout: 60000
    });
  });

  it("uses high accuracy options on mobile profile", () => {
    expect(getCaptureGeolocationOptions("mobile")).toEqual({
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 20000
    });
  });

  it("marks timeout and unavailable errors as recoverable", () => {
    expect(isRecoverableGeolocationError(2)).toBe(true);
    expect(isRecoverableGeolocationError(3)).toBe(true);
    expect(isRecoverableGeolocationError(1)).toBe(false);
  });

  it("returns desktop-specific timeout guidance", () => {
    expect(getGeolocationErrorMessage(3, "desktop")).toContain("Windows");
  });

  it("detects desktop profile for a typical desktop user agent", () => {
    const original = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    });
    expect(detectCaptureGeolocationProfile()).toBe("desktop");
    Object.defineProperty(navigator, "userAgent", { configurable: true, value: original });
  });
});
