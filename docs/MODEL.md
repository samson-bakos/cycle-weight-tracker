# Model

All fitting happens in `computeModel()` in `index.html`. Weights are in lb internally.

## Weight model

```
weight(day) = phase line + cycle effect + cheat-meal spikes + noise
```

Fitted jointly by penalised least squares with Huber reweighting (IRLS).

### Phase lines
- Each phase has its own straight line: level + slope.
- **Continuity:** a phase's line starts where the previous phase's line ended.
- **Step at phase start:** an optional step, phased in over 5 days (water and
  glycogen from a carb change), shrunk toward 0 with a weight of about 2 days of
  evidence.
- **Uncertainty:** the slope's standard error is widened for lag-1 residual
  autocorrelation.

### Cycle effect
- **Position in cycle:** days 1–7 are counted forward from the period start, and
  the last 7 days backward from the next start. The middle is stretched to fit.
- **Current cycle:** uses a predicted next start: the median of the last 6 cycle
  lengths, or the starting estimate until 3 starts are logged.
- **Late period:** treated as due tomorrow. Adjustment pauses from 7 days past
  the predicted date.
- **Shape:** one curve with 4 Fourier harmonics, shared across all phases.
- **Prior:** the curve starts from a typical pattern (+1.0 lb just before the
  period, −0.5 lb the week after) with a strength of about 15 days per
  coefficient. Her own data dominates after about 2 cycles.

### Cheat meals
- **Spike:** `A·exp(−h/τ)`, where `h` is the hours from the meal to a 7am
  weigh-in.
- **Only the temporary part is removed.** Because the spike fades to zero, any
  lasting gain stays in the trend.
- **Size per type:** generic size + a per-type offset, shrunk toward generic until
  the type has about 3 meals of its own.
- **Fade speed:** τ is learned by grid search once 5 meals are seen (36 h
  default).

### Target line
- Starts at the previous phase's trend end (or a 7-day median of adjusted
  weight), then slopes at the target rate.
- "On track" if the target is within the 80% interval of the slope or within
  ±0.15 lb/wk of it.

## Calorie coaching

### Estimator
A Kalman filter on adjusted weight with state `[weight, rate]`:
- **Measurement noise:** the model's robust σ; large surprises are down-weighted.
- **Rate drift:** 0.02 lb/wk per day.
- **Calorie changes:** a logged change of Δkcal adds `Δkcal/3500` lb/day to the
  rate (a known input).
- **Phase start:** adds 1 lb² to the weight variance and (0.3 lb/wk)² to the rate
  variance, so it relearns quickly.

### Controller
A weekly incremental PID, starting from her logged calories. Nothing is stored
between weeks.

```
P = −Kp · (rate − target rate)            Kp = 175 kcal/day per lb/wk
I = −Ki · (weight − target line)          Ki = 25 kcal/day per lb      (from week 3)
D = −Kd · (rate error − last week's)      Kd = 25 kcal/day per lb/wk   (from week 3)
```

- Until her cycle is personalised: P only, at half strength.
- Then: cap at ±max step, round to granularity, clamp to min/max.
- **Holds** on:
  - fewer than 4 weigh-ins in the past 7 days
  - rate SD over 0.6 lb/wk
  - a change under the granularity
- First check-in is ≥7 days into a phase.

### Tuning
`CWT.simCoach(opts)` runs a closed loop over 8 months:
- maintenance 1,800, adaptive at about 10 kcal per lb
- 32-day cycles with a 1.6 lb swing
- weekly cheat meals that leave 0.15 lb each
- 60 kcal adherence noise and 15% overrides
- phases: Maintain → Cut −0.5 → Maintain

| Setting | Rate error | Gap to target line |
|---|---|---|
| No controller | 0.25 lb/wk | 2.4 lb |
| Defaults | 0.09 lb/wk | 0.5 lb |

Higher P/D values cost more calorie reversals for little accuracy.

## Validation hooks
- `CWT.simulate({seed, jump, revDays, unlogged})`: fits a synthetic dataset with
  known truth (`window.__demoTruth`, `window.__demoMeals`).
- `CWT.simCoach({seed, coach, drift, override, tdee, bump})`: closed-loop
  coaching test.

## Not handled
Pregnancy or long stretches without periods.
