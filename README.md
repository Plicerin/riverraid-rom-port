# River Raid Visible Port

This is the active River Raid port. The previous JS/Python reimplementation was moved to `archive_old_port/`.

## Run

```powershell
npm run serve
```

Open:

- Playable harness: http://127.0.0.1:8080/
- Inspector: http://127.0.0.1:8080/inspector.html

## Check

```powershell
npm run check
```

The check script syntax-checks the browser modules and runs a small smoke test against the ROM-visible memory/gameplay helpers.

## Current focus

The port is a ROM-visible harness: it models zero-page memory, visible slots, sprites, scoring, fuel, missiles, respawn/game-over hold, river scrolling, and inspector projections. Some gameplay systems are still documented in `riverraidVisiblePort.mjs` as harness approximations rather than complete 6502 routine ports. Good next targets are:

1. Make the playable screen more Atari-authentic: on-canvas HUD, score/lives/fuel display, title/game-over polish.
2. Replace harness-only approximations with routines verified from the Jentzsch disassembly.
3. Add WebAudio driven by the surfaced sound bytes.
4. Keep the inspector as the debugging/reference tool while hardening the playable harness.
