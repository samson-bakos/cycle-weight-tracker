# Cycle Weight: dev notes

Single-file web app for one user on her iPhone Home Screen. Live at
https://samson-bakos.github.io/cycle-weight-tracker/. Model: `docs/MODEL.md`.
Data: `docs/DATA.md`.

## Layout
- `index.html`: CSS, then one IIFE script, in this order: constants →
  storage/`migrate` → `computeModel` (fit, Kalman) → coaching (`coachRec`) →
  demo data → UI renderers → simulators.
- `sw.js`: network-first offline cache. Bump `CACHE` when changing caching.

## Invariants
- **Her data lives in her phone's localStorage.** Never break `migrate()`, the
  storage key, or the URL.
- **No external libraries or network calls.** Everything stays inline.
- **Internal units are lb.** kg is display-only (`toDisp` / `fromDisp`).
- **Validate model changes with simulation:** `CWT.simulate`, `CWT.simCoach`.
  Don't eyeball one draw.

## Test
- **Serve locally:** `python3 -m http.server 8765`, then open
  `http://localhost:8765/?demo`.
- **Syntax check:** extract the `<script>` and run `node --check`.
- **Look:** check phone width (375px) in light and dark.

## Deploy
- Commit to `main` and push. Pages is live in about a minute.
- Git isn't wired to gh credentials here, so push with:
  ```bash
  git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push
  ```
  or run `gh auth setup-git` once.
- Commit messages end with a `Co-Authored-By` line.
