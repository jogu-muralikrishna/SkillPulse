# SkillPulse ML Forecasting Microservice (Phase 3A)

A dedicated Python FastAPI microservice providing statistical and machine learning quarterly demand forecasting for SkillPulse.

## 1. Architecture & Capabilities

- **Framework:** FastAPI with Uvicorn ASGI server.
- **Models:**
  1. **Holt-Winters Exponential Smoothing (`statsmodels`):** Handles quarterly seasonality (`seasonal_periods=4`) and trend extrapolation when sufficient chronological cycles exist. Automatically falls back to additive linear trend or simple exponential smoothing when data length is compact.
  2. **LightGBM Gradient Boosting (`lightgbm`):** Non-linear autoregression using 4 quarterly lags (`lag_1`, `lag_2`, `lag_3`, `lag_4`) and a seasonal quarter index feature (`1-4`), tuned with small `min_data_in_leaf=1` for prototype datasets.
- **Holdout Model Selection:**
  Models are evaluated purely on out-of-sample held-out validation periods using Mean Absolute Percentage Error (MAPE). The model with the lower validation MAPE is selected to produce the future forecast. In-sample fit is never used for model selection.
- **95% Prediction Interval:**
  Constructed from residual error variance with horizon expansion, ensuring `lower95 <= forecast <= upper95`.

---

## 2. API Specification

### `GET /health`
Verifies service health and available model backends.

### `POST /forecast`
Accepts a chronological quarterly time series and returns horizon forecasts with prediction intervals and validation diagnostics.

#### Request Body
```json
{
  "series": [
    { "period": "2023-Q1", "value": 120 },
    { "period": "2023-Q2", "value": 135 },
    { "period": "2023-Q3", "value": 150 },
    { "period": "2023-Q4", "value": 165 },
    { "period": "2024-Q1", "value": 130 },
    { "period": "2024-Q2", "value": 145 },
    { "period": "2024-Q3", "value": 160 },
    { "period": "2024-Q4", "value": 180 }
  ],
  "horizon": 4
}
```

#### Response Body
```json
{
  "isAvailable": true,
  "model": "Holt-Winters",
  "heldOutMAPE": 4.12,
  "forecast": [
    { "period": "2025-Q1", "value": 148.5 },
    { "period": "2025-Q2", "value": 164.2 },
    { "period": "2025-Q3", "value": 179.8 },
    { "period": "2025-Q4", "value": 198.3 }
  ],
  "lower95": [132.1, 144.5, 157.0, 172.2],
  "upper95": [164.9, 183.9, 202.6, 224.4],
  "validation": {
    "holdoutSize": 2,
    "selectedModel": "Holt-Winters",
    "selectionReason": "Holt-Winters selected due to lower held-out validation MAPE (4.12% vs 6.85% for LightGBM).",
    "holtWinters": {
      "isValid": true,
      "heldOutMAPE": 4.12,
      "rmse": 6.8,
      "notes": "Configuration: additive_seasonal on 6 training quarters"
    },
    "lightGBM": {
      "isValid": true,
      "heldOutMAPE": 6.85,
      "rmse": 11.2,
      "notes": "Features: 4 lags + quarter number (2 training samples)"
    }
  }
}
```

---

## 3. Holdout Validation & Small-Data Safety

### Minimum-History Rule
If $N < 4$ historical quarters are provided, the service returns `isAvailable: false`. Time-series models cannot reliably extrapolate trends with fewer than 4 observations.

### Deterministic Holdout Sizing
- **$N \ge 9$:** Hold out $H = 3$ quarters for validation ($N_{\text{train}} \ge 6$).
- **$N \in [6, 8]$:** Hold out $H = 2$ quarters for validation ($N_{\text{train}} \ge 4$).
- **$N \in [4, 5]$:** Hold out $H = 1$ quarter for validation ($N_{\text{train}} \ge 3$).

### Small-Data Safety for LightGBM
Constructing a 4-lag feature row requires 4 preceding quarters. Thus, $N_{\text{train}}$ points yield $N_{\text{train}} - 4$ training samples.
- If $N_{\text{train}} < 6$, LightGBM cannot form at least 2 training samples and is safely marked invalid for validation.
- In this scenario, the service excludes LightGBM and relies on Holt-Winters (or vice versa), explaining the decision in `validation.selectionReason`.

---

## 4. 95% Prediction Interval Methodology

The prediction interval models the uncertainty of future observations, which is distinct from confidence intervals for regression parameter estimates:

$$\text{margin}_h = 1.96 \times \text{RMSE} \times \sqrt{1 + \frac{h - 1}{4}}$$

Where:
- $\text{RMSE} = \sqrt{\frac{1}{M}\sum_{t=1}^M (y_t - \hat{y}_t)^2}$ is the Root Mean Squared Error of model residuals (residual error scale).
- $1.96$ is the critical value for a two-sided 95% prediction interval ($z_{0.95}$).
- $\sqrt{1 + (h - 1) / 4}$ models expanding time-series forecast variance across forecast horizon step $h \in [1 \dots \text{horizon}]$.
- $\text{lower95}_h = \max(0, \hat{y}_h - \text{margin}_h)$ enforces non-negative demand counts.
- $\text{upper95}_h = \hat{y}_h + \text{margin}_h$.
- Invariant: $\text{lower95}_h \le \text{forecast}_h \le \text{upper95}_h$ is strictly guaranteed at every horizon step.

---

## 5. Running the Service

```bash
# Install dependencies
pip install -r ml-service/requirements.txt

# Run service on port 8001
python -m uvicorn ml-service.app:app --host 127.0.0.1 --port 8001
```
