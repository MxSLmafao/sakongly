import { useEffect, useRef, useState } from "react";
import { useConfig } from "@/stores/config";
import { ipc } from "@/lib/ipc";

export type HealthStatus = "ok" | "fail" | "unknown" | "checking";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const RECHECK_INTERVAL_MS = 30_000;
const PROBE_TIMEOUT_MS = 2_000;

function isLocalHost(urlStr: string): boolean {
  try {
    const { hostname } = new URL(urlStr);
    return LOCAL_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

export function useProviderHealth(): HealthStatus {
  const selectedProviderId = useConfig((s) => s.selectedProviderId);
  const providers = useConfig((s) => s.providers);
  const [status, setStatus] = useState<HealthStatus>("unknown");
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const provider = providers.find((p) => p.id === selectedProviderId);
      if (!provider) {
        setStatus("unknown");
        return;
      }

      const validation = await ipc.validateCurlTemplate(provider.curl_template).catch(() => null);
      if (!validation?.valid || !validation.url) {
        setStatus("unknown");
        return;
      }

      if (!isLocalHost(validation.url)) {
        // Don't probe remote hosts — would burn API quota.
        setStatus("unknown");
        return;
      }

      if (cancelled) return;
      setStatus("checking");

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const timeoutId = setTimeout(() => abortRef.current?.abort(), PROBE_TIMEOUT_MS);

      try {
        await fetch(validation.url, { method: "HEAD", signal: abortRef.current.signal });
        if (!cancelled) setStatus("ok");
      } catch {
        if (!cancelled) setStatus("fail");
      } finally {
        clearTimeout(timeoutId);
      }
    }

    function scheduleNext() {
      if (cancelled) return;
      timerRef.current = setTimeout(() => {
        check().then(scheduleNext);
      }, RECHECK_INTERVAL_MS);
    }

    check().then(scheduleNext);

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selectedProviderId, providers]);

  return status;
}
