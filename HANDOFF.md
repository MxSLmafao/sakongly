# Sakongly — Handoff

## Current State

The UX-fix branch is **complete but uncommitted**. All changes compile and `tsc --noEmit` is clean. The previous tag is `2551fc1` (fix: force XWayland mode).

## What Was Just Changed (unstaged)

| File | Change |
|------|--------|
| `src-tauri/src/ai/streamer.rs` | Added `connect_timeout(5s)` to reqwest client; wrapped `builder.send()` in `tokio::select!` with `cancel_rx` so cancel works during connect phase; connection errors now emit `StreamEvent::Error` instead of hanging |
| `src-tauri/src/lib.rs` | Added `win.show()` after `set_position()` to force window mapping on XWayland |
| `src/stores/config.ts` | Added `hasCompletedSetup: bool` (persisted to localStorage); `setHasCompletedSetup()` action |
| `src/stores/conversation.ts` | Added `lastError: string\|null`, `setLastError()`, `removeMessage(id)` |
| `src/lib/db.ts` | Added `messageDb.delete(id)` |
| `src/App.tsx` | First-run gate: if `!hasCompletedSetup`, calls `ipc.openDashboard()` once at mount |
| `src/hooks/useStreamingChat.ts` | Errors no longer write into chat history; instead: placeholder assistant message deleted from DB+store, `lastError` set. Added `retry()` (re-submits `lastSubmitRef`). Added try-catch around `ipc.aiStream()` |
| `src/windows/dashboard/Settings/Providers.tsx` | `saveEditing()` now calls `setHasCompletedSetup(true)` |
| `src/windows/overlay/Overlay.tsx` | `bg-background/95`, solid border, `ring-1 ring-primary/20`, left accent strip, `<ErrorBanner>` mounted above `<ChatPanel>` when `lastError != null` |
| `src/windows/overlay/InputBar.tsx` | Provider badge replaced with health dot + name; placeholder text updated when no provider configured |
| `src/hooks/useProviderHealth.ts` | **New.** Polls localhost providers via `fetch HEAD` every 30s with 2s timeout; skips remote hosts; returns `"ok"\|"fail"\|"unknown"\|"checking"` |
| `src/windows/overlay/ErrorBanner.tsx` | **New.** Inline red banner with Open Settings, Retry, Dismiss buttons |

## Immediate Next Commands

```bash
cd /home/user/sakongly

# 1. Verify everything still compiles
npx tsc --noEmit
cd src-tauri && cargo build && cd ..

# 2. Commit
git add -A
git commit -m "fix: graceful provider failures, first-run flow, visible overlay

- connect_timeout(5s) + cancellable connect in streamer.rs stops the hang
  when localhost is unreachable
- First-run auto-opens dashboard until user saves a provider
- ErrorBanner replaces error-in-chat for all streaming failures
- Provider health dot (green/red/amber/grey) in InputBar
- Stronger overlay visuals: opaque bg, solid border, accent strip
- win.show() after positioning ensures overlay appears on XWayland"

# 3. Smoke test (needs Ollama NOT running to test the error path)
npm run tauri dev
```

**Manual checks after `tauri dev`:**
1. Overlay visible top-center with left accent strip and solid border
2. No Ollama running → type message → within 5s red ErrorBanner appears (not frozen)
3. ErrorBanner Retry button re-submits; Dismiss clears it
4. First-run: delete `~/.local/share/sakongly/` and clear `localStorage` → dashboard auto-opens to Providers tab
5. After saving a provider → restart → dashboard does NOT auto-open
6. Provider dot: start `ollama serve` → dot turns green within 30s

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
