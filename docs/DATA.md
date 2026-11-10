# Data

## Storage
- **Real data:** `localStorage['cycleWeightTracker.v1']`.
- **Demo data:** `cycleWeightTracker.demo.v1`, used with `?demo`. Never touches
  real data.
- **Scope:** storage is per origin. Changing the URL (repo name or host) means
  starting from an empty store, so restore from a backup.

## Schema (v1)

```js
{
  version: 1,
  settings: { unit: 'lb'|'kg', baseCycleLen, cycleLenOverride, fwdDays, backDays, lastBackup, created },
  entries: {
    'YYYY-MM-DD': {
      w: 142.4 | null,                 // lb
      ps: bool, pe: bool,              // period started / ended
      m: { kcal, p, c, f },            // food, optional
      cm: [{ t: 'generic'|typeId, s: 'b'|'l'|'d' }]   // cheat meals eaten that day, optional
    }
  },
  phases: [{ id, name, start: 'YYYY-MM-DD', target /* lb/wk */, coach? }],
  // coach: { on, day /* 0=Sun */, min, max, step, gran, pPerLb, fPerLb, kp, ki, kd }
  mealTypes: [{ id, name }],
  checkins: [{ pid, date, before, rec, after, chosen: 'used'|'kept', why, terms: { p, i, d, rate, gap } }]
}
```

## Rules for changes
- **Load path:** every load and every restore goes through `migrate()`. New fields
  must be optional there, with defaults applied on read (see `coachCfg`).
- **Never rename or remove fields** in a way that drops existing data.
- **Backups** are the same JSON as storage (Settings & backup → Back up now), and
  restoring runs `migrate()`.
- **CSV export** is a one-way export for Excel. It isn't a backup format.
