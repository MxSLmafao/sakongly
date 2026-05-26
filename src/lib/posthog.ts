let _initialized = false;

async function init() {
  if (_initialized) return;
  _initialized = true;

  const config = loadConfig();
  if (!config?.posthogOptIn) return;

  try {
    const posthog = (await import("posthog-js")).default;
    posthog.init("phc_PLACEHOLDER_KEY", {
      api_host: "https://app.posthog.com",
      capture_pageview: false,
      disable_session_recording: true,
      autocapture: false,
      persistence: "localStorage",
    });
    posthog.capture("app_started");
  } catch {
    // PostHog is non-critical — fail silently.
  }
}

export function captureProviderConfigured(providerName: string) {
  if (!_initialized) return;
  import("posthog-js").then(({ default: posthog }) => {
    posthog.capture("provider_configured", { provider: providerName });
  }).catch(() => {});
}

// Lazy init after first user interaction
if (typeof window !== "undefined") {
  window.addEventListener("click", () => init(), { once: true });
}

function loadConfig() {
  try {
    const raw = localStorage.getItem("sakongly.config");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
