# Cycle Weight

A weight tracker that takes the menstrual-cycle swing out of daily weigh-ins and
shows a straight trend line per goal phase, next to a dotted target line.

Files:
- `index.html`: the whole app (self-contained, no internet libraries).
- `sw.js`: optional; lets the Home Screen app open with no signal.
  `index.html` works without it.

**Live app:** https://samson-bakos.github.io/cycle-weight-tracker/
(demo with fake data: https://samson-bakos.github.io/cycle-weight-tracker/?demo)

Hosted on GitHub Pages from the `main` branch of this repo. The URL only serves
the empty app. Her data never goes there.

## Put it on her iPhone

1. **On her iPhone, open the live URL in Safari** (not Chrome).
2. **Share → Add to Home Screen** → Add.
3. **From now on, open it only from the Home Screen icon.**
   ⚠️ The Home Screen app and Safari keep *separate* data. Anything typed in the
   Safari tab before adding it to the Home Screen won't carry over.
4. First launch asks for the date her last period started and the typical cycle
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

## Calorie coaching (weekly check-ins)

Each phase has its own coaching settings (Phases → Edit → Calorie coaching):
check-in day (Sunday), optional min/max calories, max change per week (100),
smallest change (25), optional protein/fat per lb (carbs fill the rest), and
P/I/D strengths under Advanced. A new phase copies the previous phase's settings.

- **Starting a phase:** set its starting calories yourself in the daily Food
  fields. The controller starts fresh from that point.
- **Check-in day:** a card shows the recommendation, e.g. "1,650 kcal (−50)",
  with macros and a one-line reason. **Use this** sets today's food to it,
  **Keep** holds. Whatever she logs is what the next check-in starts from, so
  overriding is always fine.
- **When it holds:** the first check-in comes after a full week in a phase, and
  it holds with fewer than 4 weigh-ins in the past week, with an unclear trend,
  or when the change would be under the smallest-change setting.

## Backups (important)

Data lives only in the Home Screen app on her phone. Deleting the icon deletes the data.
- **Settings & backup → Back up now** opens the iOS share sheet → *Save to Files* →
  iCloud Drive. A banner nags her once a week.
- **Restore from backup** brings it back (also works on a new phone, or from the
  first-launch screen).
- **Export for Excel (CSV)** gives a spreadsheet with raw and cycle-adjusted weights.

## Updating the app later

Commit and push to `main`; GitHub Pages redeploys in about a minute. Her data is
untouched by updates because it lives on the phone, not in the file. `sw.js` is
network-first, so when she's online the next open loads the latest version (it
falls back to the saved copy offline). If an update seems stuck, fully close the
app and reopen it.

## Preview with fake data

Open the hosted URL (or a local server) with `?demo` on the end, e.g.
`https://samson-bakos.github.io/cycle-weight-tracker/?demo`. Demo data uses separate storage and never
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
- **Cold start:** the cycle curve starts from a typical pattern (+1 lb just
  before the period, −0.5 lb the week after) and her own data pulls it toward her
  pattern (prior worth ~15 days per coefficient; mostly hers after ~2 cycles).
  A new phase's line is drawn faint until it has 10 weigh-ins.
- **Coaching estimator:** a Kalman filter tracks her current weight and rate from
  the cycle- and meal-adjusted weigh-ins. Logged calorie changes are a known input
  (3,500 kcal ≈ 1 lb), and a phase change loosens the state so it relearns quickly.
- **Coaching controller:** incremental PID on rate error, starting from her logged
  calories each week, with nothing stored between weeks. P = −175·(rate − target),
  I = −25·(gap to target line), D = −25·(change in rate error). I and D switch on
  from week 3, and until her cycle is personalised it runs P-only at half strength.
  The result is capped, rounded, and kept within min/max. Strengths were tuned in a
  closed-loop simulation (8-month runs: maintenance 1,800, 32-day cycles, weekly
  cheat meals, 15% overrides). Against no controller, rate error fell from
  0.25 to 0.09 lb/wk and the gap to the target line from 2.4 to 0.5 lb. Stronger
  P/D bought little accuracy for more back-and-forth. In the console:
  `CWT.simCoach({seed:1})`.
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
