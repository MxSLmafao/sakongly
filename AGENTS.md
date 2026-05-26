# Sakongly — Codex Agent Instructions

## What This Is

A Tauri 2 + React 19 desktop app: a transparent 600×54px always-on-top overlay that expands to a chat panel and connects to user-configured AI providers via curl templates. Linux-only v1. No tests exist yet.

## Environment Requirements

```
rustc 1.95+ (installed)
node 24 / npm 11 (installed)
libwebkit2gtk-4.1-dev (installed)
libgtk-3-dev (installed)
```

## Dev Commands

```bash
cd /home/user/sakongly

# Type-check only (fast, no build artifacts)
npx tsc --noEmit

# Rust-only build (dev, fast)
cd src-tauri && cargo build && cd ..

# Full dev run (spawns Vite + Tauri together)
npm run tauri dev

# Release build (slow, produces .deb + .appimage)
npm run tauri build -- --bundles deb,appimage
```

## Project Layout

```
src/                          React 19 + TypeScript frontend
  App.tsx                     Routes main→Overlay, dashboard→Dashboard; first-run gate
  windows/overlay/            Overlay window (600×54 collapsed, 600×520 expanded)
    Overlay.tsx               Root; mounts InputBar, ChatPanel, ErrorBanner
    InputBar.tsx              Text input, provider health dot, attachment/screenshot buttons
    ChatPanel.tsx             Message list with Shiki+KaTeX markdown
    ErrorBanner.tsx           Inline error UI with Retry + Open Settings
  windows/dashboard/          1200×800 settings/history window (created on demand)
    Sidebar.tsx               Conversation list with date grouping + search
    ConversationView.tsx      Resume/export conversation
    Settings/                 Appearance, Shortcuts, Providers, Prompts, Screenshot tabs
  hooks/
    useStreamingChat.ts       Full stream lifecycle: submit, cancel, retry
    useProviderHealth.ts      Polls localhost providers; skips remote
    useGlobalShortcuts.ts     Registers OS-level shortcuts via Tauri plugin
  stores/
    config.ts                 Zustand+localStorage: providers, shortcuts, theme, hasCompletedSetup
    conversation.ts           Active conversation, streaming state, lastError
  lib/
    ipc.ts                    Typed invoke() wrappers for all Rust commands
    streaming.ts              Tauri event listener for stream://{requestId} events
    db.ts                     tauri-plugin-sql wrapper (conversationDb, messageDb, systemPromptDb)
    providers/presets.ts      Ollama, llama.cpp, DeepSeek, AIMLAPI curl templates

src-tauri/                    Rust/Tauri backend
  src/
    main.rs                   Forces GDK_BACKEND=x11 + WEBKIT_DISABLE_COMPOSITING_MODE=1 before GTK init
    lib.rs                    Tauri builder, plugin wiring, SQL migration, window positioning + show()
    commands/
      window.rs               toggle_overlay, expand_overlay, collapse_overlay, move_overlay_by,
                              open_dashboard, set_ignore_cursor, set_skip_taskbar, get_primary_monitor_info
      provider.rs             validate_curl_template, ai_stream, ai_cancel (CANCEL_TOKENS map)
      screenshot.rs           capture_fullscreen, start_region_capture
      files.rs                attach_file (max 6, size/type validation)
      machine.rs              machine_uid
    ai/
      curl_parser.rs          Tokenises curl string → {method, url, headers, body}
      template.rs             Substitutes {{API_KEY}} {{TEXT}} {{IMAGE}} {{SYSTEM_PROMPT}} {{MODEL}}
      streamer.rs             SSE / NDJSON / plain-JSON dispatch; emits stream://{id} events
      json_path.rs            Evaluates paths like choices[0].delta.content
    screenshot/
      x11.rs                  xcap crate for X11 fullscreen/region
      wayland.rs              ashpd xdg-desktop-portal for Wayland
  capabilities/default.json  Tauri 2 permission list — add new commands here first
  migrations/001_init.sql    conversations, messages, system_prompts schema
  tauri.conf.json            Window config; NO updater/autostart plugin config (causes startup crash)
```

## Critical Rules

1. **Never add `"updater"` or `"autostart"` to `tauri.conf.json` plugins block** — these crash on startup. The plugins are initialised in `lib.rs` only.
2. **New Rust commands must be registered in two places:** `lib.rs` (`invoke_handler!`) AND `capabilities/default.json`.
3. **Capability permission names are exact strings.** Wrong name = silent runtime failure. Use `core:webview:allow-create-webview-window` (not `core:webviewwindow:allow-new`), `http:allow-fetch-send` (not `http:allow-send`).
4. **ashpd must use `features = ["tokio"]`, not `["async-std"]`** — async-std causes duplicate `AsyncReadExt` import.
5. **GDK_BACKEND=x11 must be set in `main.rs` before `sakongly_lib::run()`** — GNOME Wayland won't show the window otherwise.
6. **No tray-icon feature in Cargo.toml** — `libayatana-appindicator3-dev` headers are not installed; adding it breaks `cargo build`.

## State Persistence

- `localStorage` key `"sakongly.config"` — Zustand persisted store (providers, shortcuts, theme, `hasCompletedSetup`)
- SQLite at `~/.local/share/sakongly/sakongly.db` — conversations, messages, system_prompts
- No migration tooling; schema changes require a new migration version in `lib.rs`

## Streaming Protocol

Frontend sends `invoke("ai_stream", { req })`. Rust emits Tauri events `stream://{requestId}` with payload `{ type: "chunk"|"done"|"error", data?: string }`. Frontend listens via `streaming.ts:startStream()`. Cancel via `invoke("ai_cancel", { requestId })` which fires a oneshot channel read in `streamer.rs`.

## TypeScript Check

Always run `npx tsc --noEmit` before committing. The project has zero TS errors on the current branch.
