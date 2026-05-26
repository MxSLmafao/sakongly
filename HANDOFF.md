# Sakongly — Handoff

## Current State

**Clean.** Commit `b1bf4b4` is pushed to `origin/master` on https://github.com/MxSLmafao/sakongly. Working tree is empty. `tsc --noEmit` and `cargo build` both pass.

## What Was Shipped in `b1bf4b4`

| File | Change |
|------|--------|
| `src-tauri/src/ai/streamer.rs` | `connect_timeout(5s)`; `builder.send()` wrapped in `tokio::select!` with `cancel_rx` so cancel works during connect; connection errors emit `StreamEvent::Error` instead of hanging |
| `src-tauri/src/lib.rs` | `win.show()` after `set_position()` forces window mapping on XWayland |
| `src/stores/config.ts` | `hasCompletedSetup: bool` (localStorage-persisted); `setHasCompletedSetup()` action |
| `src/stores/conversation.ts` | `lastError: string\|null`, `setLastError()`, `removeMessage(id)` |
| `src/lib/db.ts` | `messageDb.delete(id)` |
| `src/App.tsx` | First-run gate: `!hasCompletedSetup` → `ipc.openDashboard()` once at mount |
| `src/hooks/useStreamingChat.ts` | Errors deleted from DB+store (not written into chat); `lastError` set; `retry()` added; try-catch around `ipc.aiStream()` |
| `src/windows/dashboard/Settings/Providers.tsx` | `saveEditing()` calls `setHasCompletedSetup(true)` |
| `src/windows/overlay/Overlay.tsx` | `bg-background/95`, solid border, `ring-1 ring-primary/20`, left accent strip, `<ErrorBanner>` above `<ChatPanel>` |
| `src/windows/overlay/InputBar.tsx` | Provider badge → health dot + name; updated placeholder when no provider |
| `src/hooks/useProviderHealth.ts` | **New.** Polls localhost via `fetch HEAD` every 30s, 2s timeout; skips remote hosts |
| `src/windows/overlay/ErrorBanner.tsx` | **New.** Inline error banner with Open Settings, Retry, Dismiss |

## Start Here

```bash
cd /home/user/sakongly
git pull  # ensure you're at b1bf4b4

# Verify builds
npx tsc --noEmit
cd src-tauri && cargo build && cd ..

# Smoke test — Ollama must NOT be running to test the error path
npm run tauri dev
```

**Smoke check list:**
1. Overlay visible top-center with left accent strip and solid border
2. Ollama down → submit message → within 5s red ErrorBanner appears (no hang)
3. ErrorBanner Retry re-submits; Dismiss clears it; Open Settings opens dashboard
4. Delete `~/.local/share/sakongly/` and clear localStorage → restart → dashboard auto-opens to Providers
5. Save a provider → restart → dashboard does NOT auto-open
6. `ollama serve` → provider dot turns green within 30s

## Remaining Work (v1 scope)

### Not yet built
- [ ] **Shortcut continuous-move**: `Ctrl+Arrow` hold → nudge overlay at 60fps. Hook exists in `useGlobalShortcuts.ts` but only fires once per press, not while held. Fix: on Ctrl+Arrow keydown, start a `setInterval` that calls `ipc.moveOverlayBy(dx,dy)` at 60fps, clear on keyup.
- [ ] **Screenshot region selector**: `commands/screenshot.rs:start_region_capture` exists, but the overlay-window-based selector UI is not built. `src-tauri/src/screenshot/x11.rs` captures fullscreen via xcap. The region selector needs a temporary fullscreen Tauri window with a drag-to-select React component.
- [ ] **Wayland screenshot**: `src-tauri/src/screenshot/wayland.rs` uses ashpd but is not wired into the command dispatch in `screenshot.rs` (which calls xcap unconditionally). Add `XDG_SESSION_TYPE` detection and route to `wayland.rs` when `== "wayland"`.
- [ ] **Autostart toggle in Settings → Appearance**: UI checkbox exists in `Appearance.tsx` but calls are no-ops. Wire to `ipc.invoke("plugin:autostart|enable")` / `disable`. Plugin is initialised in `lib.rs`.
- [ ] **Export-as-markdown** in `ConversationView.tsx`: button is rendered, handler is a TODO.
- [ ] **PostHog opt-in gate**: `posthog.ts` is wired but `captureAppStarted()` is called unconditionally in `App.tsx`. Should check `posthogOptIn` first.
- [ ] **Updater**: plugin is in `Cargo.toml` but disabled in `lib.rs` (removed to fix startup crash). Re-enable once a real pubkey + update endpoint exist. Needs `tauri_plugin_updater::Builder::new().build()` in `lib.rs` and `"pubkey"` in `tauri.conf.json`.

### Known Gaps / Risks

| Issue | Location | Risk |
|-------|----------|------|
| `useProviderHealth` uses browser `fetch` for HEAD probe | `src/hooks/useProviderHealth.ts:43` | Tauri's CSP may block cross-origin `fetch` to localhost on some versions. If dots stay grey, switch to `ipc.getPrimaryMonitor()` as a placeholder or add a dedicated `ping_provider` Rust command |
| `retry()` in `useStreamingChat` uses a `submitRef` that is updated synchronously at render end | `useStreamingChat.ts:155` | If `retry()` is called during a render cycle before `submitRef.current` is updated, it calls a stale function. In practice this can't happen (retry is triggered by user click) but is worth noting |
| No SQLite migration versioning beyond v1 | `lib.rs:17` | Adding tables requires bumping the migration version. The SQL plugin applies migrations in version order; do not modify `001_init.sql` — add `002_*.sql` and register it in `lib.rs` |
| `tauri.conf.json` `resizable: false` on the overlay | `tauri.conf.json:21` | The overlay height is changed programmatically via `window.setSize()`. If Tauri ever enforces `resizable: false` strictly, the expand/collapse will break. Works today. |
| `xcap v0.0.14` future-incompat warning | `Cargo.toml` | Harmless now; will fail a future Rust edition. Pin or upgrade before Rust 2027 edition. |

## File Quick-Reference for Next Tasks

- Add a new IPC command: `src-tauri/src/commands/`, register in `lib.rs` invoke_handler, add permission to `capabilities/default.json`, add typed wrapper in `src/lib/ipc.ts`
- Change SQLite schema: add `src-tauri/migrations/002_*.sql`, register new `Migration { version: 2, ... }` in `lib.rs`
- Add a new settings tab: create `src/windows/dashboard/Settings/MyTab.tsx`, add to `Settings.tsx` tabs array
- Add a provider preset: append to `src/lib/providers/presets.ts` array
