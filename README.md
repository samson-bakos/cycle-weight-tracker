# Cycle Weight

A weight tracker that takes the menstrual-cycle swing out of daily weigh-ins and
shows a straight trend line per goal phase, next to a dotted target line.

Files:
- `index.html`: the whole app (self-contained, no internet libraries).
- `sw.js`: optional; lets the Home Screen app open with no signal.
  `index.html` works without it.

## Put it on her iPhone (about 5 minutes)

1. **Host the folder.** Easiest: go to https://app.netlify.com/drop and drag this
   whole folder in. You get a URL like `https://something-random.netlify.app`.
   (GitHub Pages works too: push `index.html` + `sw.js` to a repo and turn on Pages.)
   The URL only serves an empty app. Her data never goes there.
2. **On her iPhone, open the URL in Safari** (not Chrome).
3. **Share → Add to Home Screen** → Add.
4. **From now on, open it only from the Home Screen icon.**
   ⚠️ The Home Screen app and Safari keep *separate* data. Anything typed in the
   Safari tab before adding it to the Home Screen won't carry over.
5. First launch asks for the date her last period started and the typical cycle
   length (26 days). Then she logs weights.

## Daily entry

Date, weight, period started/ended, and food (calories, protein, carbs, fat).
Food carries forward: each new day starts with the most recent day's numbers, so
if nothing changed she just taps Save. Food is stored with each day (and in the
backup and CSV) but isn't used in the model yet. It's there for later analysis
(e.g. estimating her maintenance calories).

**Cheat meals:** pick Generic or a named type (add new ones from the dropdown,
e.g. Sushi, Nando's), plus Yesterday/Today and Breakfast/Lunch/Dinner. It's stored
on the day it was eaten. A ✕ under the dropdown removes one.

## Backups (important)

Data lives only in the Home Screen app on her phone. Deleting the icon deletes the data.
- **Settings & backup → Back up now** opens the iOS share sheet → *Save to Files* →
  iCloud Drive. A banner nags her once a week.
- **Restore from backup** brings it back (also works on a new phone, or from the
  first-launch screen).
- **Export for Excel (CSV)** gives a spreadsheet with raw and cycle-adjusted weights.

## Updating the app later

Re-drag the folder onto the same Netlify site (or push to the repo). Her data is
untouched by updates because it lives on the phone, not in the file. With `sw.js`,
the new version shows the second time she opens the app.

## Preview with fake data

Open the hosted URL (or a local server) with `?demo` on the end, e.g.
`https://something.netlify.app/?demo`. Demo data uses separate storage and never
mixes with her real data.

## How the model works (for the curious)

- **Cycle position:** days 1–7 are counted from the period start, the last 7 days
  backwards from the next period start, and the middle is stretched to fit. The
  current cycle uses a predicted next start (median of her last 6 cycle lengths,
  26 days until there are 3 logged starts). When the real start is logged, those
  days recompute, so the latest adjusted values can shift slightly.
- **Fit:** each phase gets its own straight line (own slope). It starts where the
  previous phase's line ended, plus an optional step that phases in over 5 days
  (water/glycogen from a carb change). The step is lightly damped (≈2 days of
  evidence), so small or short-lived jumps get absorbed. In simulations this
  roughly halves the early-phase rate error without biasing established phases.
  One smooth cycle-shape curve (4 Fourier harmonics, gently smoothed) is shared
  across all phases and fitted at the same time. Huber-robust reweighting keeps
  odd days (salty dinner, travel) from bending the lines. The trend-rate
  uncertainty is widened when consecutive days' errors are correlated.
- **Target line:** starts where the previous phase's cycle-adjusted trend ended
  (or, for the first phase or before the model is ready, the median of 7 days of
  cycle-adjusted weight), then slopes at the target rate. Any step shows as the
  gap between the lines and is listed in the Phases card. It recomputes as the
  model learns.
- **Cold start:** raw weight + 7-day average until 2 full cycles of weigh-ins.
  A new phase's line is drawn faint until it has 10 weigh-ins.
- **Cheat meals:** each meal adds a spike that must fade to zero,
  `A·exp(−h/τ)`, where h is the hours from the meal to a 7am weigh-in, so
  dinner-vs-breakfast timing is handled automatically. Because the spike fades
  to zero, only the temporary part (water, salt, glycogen, gut contents) is
  removed; any lasting gain stays in the trend. Each named type's size is pulled
  toward the generic size until it has ~3 meals of its own. The fade speed τ is
  learned from her data once 5 meals have weigh-ins after them (36 h default).
  In simulations this cut day-to-day scatter around the trend by ~20%
  (0.90 → 0.73 lb) and recovered each meal's true bump within ~0.3 lb. Rate
  accuracy barely changed, because the robust fit was already discounting spike
  days.
- **Late period:** treated as "due tomorrow". From 7 days past the predicted date,
  cycle adjustment pauses for new days until a start is logged.
- **Not handled:** pregnancy or months without periods (deliberately deferred).
