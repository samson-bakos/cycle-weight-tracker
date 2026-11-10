# Cycle Weight

Daily weight tracker that removes the menstrual-cycle swing and cheat-meal spikes,
fits a straight trend per goal phase, and recommends weekly calorie changes.

- **App:** https://samson-bakos.github.io/cycle-weight-tracker/
- **Demo (fake data):** https://samson-bakos.github.io/cycle-weight-tracker/?demo

Single file (`index.html`, no dependencies) plus `sw.js` for offline use.
Hosted on GitHub Pages from `main`.

## Privacy

The site serves an empty app. All data is stored on the phone (localStorage) and
is never uploaded. Backups are files she saves herself.

## Install (iPhone)

1. Open the app link in **Safari**.
2. Share → **Add to Home Screen**.
3. Use only the Home Screen icon. It keeps separate storage from Safari.
4. First launch: last period start date and typical cycle length.

## Use

- **Daily:** weight, period start/end, food (carries forward), cheat meal.
- **Phases:** goal rate (lb/week) plus calorie-coaching settings. Starting
  calories are set in Food on the phase's first day.
- **Check-ins:** weekly card with recommended calories and macros. **Use this**
  or **Keep**; whatever she logs is the next starting point.
- **Backup:** Settings & backup → Back up now → Save to Files → iCloud Drive.
  Deleting the icon deletes the data.

## Update

Push to `main`; Pages redeploys in about a minute. The app loads the latest
version on the next open when online. Data is untouched.

## Docs

- [docs/MODEL.md](docs/MODEL.md): how the trend, cycle, meals and coaching work
- [docs/DATA.md](docs/DATA.md): stored data format and migration rules
- [CLAUDE.md](CLAUDE.md): notes for development
