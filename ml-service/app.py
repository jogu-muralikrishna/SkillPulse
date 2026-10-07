"""
SkillPulse Machine Learning Forecasting Service
FastAPI microservice providing statistical & gradient-boosted time-series forecasts:
- Statsmodels Holt-Winters ExponentialSmoothing (seasonal / linear trend)
- LightGBM Regressor (4 quarterly lags + quarter indicator)
- Holdout validation strategy evaluating models on out-of-sample MAPE
- 95% Prediction Interval constructed via empirical residual errors
"""

from typing import List, Optional, Dict, Any, Literal
import math
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Model libraries
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import lightgbm as lgb

app = FastAPI(
    title="SkillPulse ML Forecasting Service",
    version="1.0.0",
    description="Statistical & Machine Learning Demand Forecasting with Holdout Model Selection"
)


# ---------------------------------------------------------------------------
# Data Models
# ---------------------------------------------------------------------------

class TimeSeriesPoint(BaseModel):
    period: str = Field(..., description="Quarterly period identifier, e.g. '2024-Q1'")
    value: float = Field(..., description="Observed demand count or value")


class ForecastRequest(BaseModel):
    series: List[TimeSeriesPoint] = Field(..., description="Chronological quarterly series")
    horizon: int = Field(default=4, ge=1, le=16, description="Forecast horizon in quarters")


class ForecastPeriodValue(BaseModel):
    period: str
    value: float


class ModelValidationDetail(BaseModel):
    isValid: bool
    heldOutMAPE: Optional[float] = None
    rmse: Optional[float] = None
    notes: Optional[str] = None


class ValidationSummary(BaseModel):
    holdoutSize: int
    selectedModel: Optional[str] = None
    selectionReason: str
    holtWinters: ModelValidationDetail
    lightGBM: ModelValidationDetail


class ForecastResponse(BaseModel):
    isAvailable: bool
    model: Optional[str] = None
    heldOutMAPE: Optional[float] = None
    forecast: List[ForecastPeriodValue] = []
    lower95: List[float] = []
    upper95: List[float] = []
    validation: Dict[str, Any] = {}
    reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Quarter Parsing & Arithmetic Helpers
# ---------------------------------------------------------------------------

def parse_period(period_str: str) -> tuple[int, int]:
    """Parse '2024-Q1' into (2024, 1)."""
    parts = period_str.strip().split('-')
    if len(parts) != 2:
        raise ValueError(f"Invalid period format: {period_str}. Expected YYYY-Q#")
    year = int(parts[0])
    q_str = parts[1].upper().replace('Q', '')
    quarter = int(q_str)
    if quarter < 1 or quarter > 4:
        raise ValueError(f"Quarter must be between 1 and 4, got {quarter}")
    return year, quarter


def format_period(year: int, quarter: int) -> str:
    """Format (2024, 1) into '2024-Q1'."""
    return f"{year}-Q{quarter}"


def add_quarters(year: int, quarter: int, steps: int) -> tuple[int, int]:
    """Add steps quarters to (year, quarter)."""
    total_q = (year * 4 + (quarter - 1)) + steps
    new_year = total_q // 4
    new_q = (total_q % 4) + 1
    return new_year, new_q


def compute_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Compute Mean Absolute Percentage Error (MAPE)."""
    if len(y_true) == 0:
        return 0.0
    errors = []
    for yt, yp in zip(y_true, y_pred):
        denom = abs(yt) if abs(yt) > 1e-4 else 1.0
        errors.append(abs(yt - yp) / denom)
    return round(float(np.mean(errors) * 100), 2)


def compute_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Compute Root Mean Squared Error."""
    if len(y_true) == 0:
        return 0.0
    return round(float(np.sqrt(np.mean((y_true - y_pred) ** 2))), 2)


# ---------------------------------------------------------------------------
# Holt-Winters Modeling
# ---------------------------------------------------------------------------

def fit_and_forecast_holt_winters(
    train_vals: np.ndarray,
    steps: int
) -> tuple[np.ndarray, str, Optional[Any]]:
    """
    Fits ExponentialSmoothing on train_vals and forecasts steps ahead.
    Uses quarterly seasonality (seasonal_periods=4) if train_vals >= 8,
    otherwise falls back to linear trend or simple exponential smoothing.
    """
    n = len(train_vals)
    model_type = "non_seasonal_trend"

    if n >= 8 and np.all(train_vals > 0):
        # Attempt additive seasonal Holt-Winters
        try:
            hw = ExponentialSmoothing(
                train_vals,
                trend='add',
                seasonal='add',
                seasonal_periods=4,
                initialization_method='estimated'
            ).fit(optimized=True)
            preds = hw.forecast(steps)
            return np.array(preds), "additive_seasonal", hw
        except Exception:
            pass  # Fall through to trend

    if n >= 3:
        # Attempt linear trend without seasonality
        try:
            hw = ExponentialSmoothing(
                train_vals,
                trend='add',
                seasonal=None,
                initialization_method='estimated'
            ).fit(optimized=True)
            preds = hw.forecast(steps)
            return np.array(preds), "linear_trend", hw
        except Exception:
            pass

    # Simple Exponential Smoothing fallback
    hw = ExponentialSmoothing(
        train_vals,
        trend=None,
        seasonal=None,
        initialization_method='estimated'
    ).fit(optimized=True)
    preds = hw.forecast(steps)
    return np.array(preds), "simple_exponential", hw


# ---------------------------------------------------------------------------
# LightGBM Feature Engineering & Modeling
# ---------------------------------------------------------------------------

def create_lgb_features(
    history: list[float],
    quarter_numbers: list[int]
) -> tuple[np.ndarray, np.ndarray]:
    """
    Constructs 4-lag feature matrix for time series observations:
    X_i = [lag_1, lag_2, lag_3, lag_4, quarter]
    y_i = history[i]
    """
    X, y = [], []
    for i in range(4, len(history)):
        row = [
            history[i - 1],  # lag 1
            history[i - 2],  # lag 2
            history[i - 3],  # lag 3
            history[i - 4],  # lag 4
            quarter_numbers[i]  # quarter number (1-4)
        ]
        X.append(row)
        y.append(history[i])
    return np.array(X), np.array(y)


def fit_and_forecast_lightgbm(
    history_vals: list[float],
    history_quarters: list[int],
    future_quarters: list[int],
    steps: int
) -> tuple[np.ndarray, Optional[Any]]:
    """
    Fits LightGBM on 4-lag features and performs recursive multi-step forecasting.
    """
    X_train, y_train = create_lgb_features(history_vals, history_quarters)
    if len(X_train) < 2:
        raise ValueError(f"Insufficient training rows ({len(X_train)}) for LightGBM with 4 lags.")

    model = lgb.LGBMRegressor(
        objective='regression',
        n_estimators=30,
        learning_rate=0.08,
        num_leaves=7,
        min_child_samples=1,
        min_data_in_leaf=1,
        verbosity=-1,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Recursive forecasting
    current_history = list(history_vals)
    predictions = []

    for step in range(steps):
        q_next = future_quarters[step]
        row = np.array([[
            current_history[-1],
            current_history[-2],
            current_history[-3],
            current_history[-4],
            q_next
        ]])
        pred_val = float(model.predict(row)[0])
        predictions.append(pred_val)
        current_history.append(pred_val)

    return np.array(predictions), model


# ---------------------------------------------------------------------------
# Prediction Interval Method
# ---------------------------------------------------------------------------

def calculate_prediction_intervals(
    forecast_values: np.ndarray,
    residuals: np.ndarray,
    sample_mean: float,
    confidence_level: float = 0.95
) -> tuple[List[float], List[float]]:
    """
    Constructs a 95% empirical prediction interval for future demand:
    margin_h = 1.96 * RMSE * sqrt(1 + (h - 1) / 4)
    where:
    - RMSE = sqrt((1/M) * sum(residual^2)) is the root mean squared error of model residuals.
    - 1.96 is the critical value for a two-sided 95% prediction interval.
    - sqrt(1 + (h - 1) / 4) expands uncertainty across future horizon step h.
    - Strictly guarantees lower95 <= forecast <= upper95 at every horizon step.
    - Lower bound is constrained >= 0 for physical demand counts.
    """
    res_arr = np.array(residuals, dtype=float)
    if len(res_arr) > 0:
        rmse = float(np.sqrt(np.mean(res_arr ** 2)))
    else:
        rmse = max(1.0, float(sample_mean * 0.10))

    # Guard against degenerate zero residual error in exact prototype fits
    rmse = max(rmse, max(1.0, float(sample_mean * 0.05)))

    z_critical = 1.96
    lower_bounds = []
    upper_bounds = []

    for h, y_hat in enumerate(forecast_values, start=1):
        horizon_expansion = math.sqrt(1.0 + (h - 1) / 4.0)
        margin = z_critical * rmse * horizon_expansion
        y_val = round(float(y_hat), 1)
        lower = max(0.0, round(float(y_hat - margin), 1))
        # Strictly ensure lower95 <= forecast <= upper95
        lower = min(lower, y_val)
        upper = max(y_val, round(float(y_hat + margin), 1))
        lower_bounds.append(lower)
        upper_bounds.append(upper)

    return lower_bounds, upper_bounds


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SkillPulse ML Forecasting Service",
        "models": ["Holt-Winters", "LightGBM"]
    }


@app.post("/forecast", response_model=ForecastResponse)
def generate_forecast(req: ForecastRequest):
    series = req.series
    horizon = req.horizon
    n = len(series)

    # 1. Minimum History Rule: at least 4 quarters required
    if n < 4:
        return ForecastResponse(
            isAvailable=False,
            reason=f"Minimum 4 historical quarters required for statistical time-series forecasting. Provided series contains {n} observation(s).",
            model=None,
            heldOutMAPE=None,
            forecast=[],
            lower95=[],
            upper95=[],
            validation={
                "error": "insufficient_history",
                "observationsProvided": n,
                "minimumRequired": 4
            }
        )

    # Parse observations chronologically
    try:
        parsed_dates = [parse_period(pt.period) for pt in series]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    years = [p[0] for p in parsed_dates]
    quarters = [p[1] for p in parsed_dates]
    values = np.array([pt.value for pt in series], dtype=float)

    # Generate future periods
    future_periods = []
    future_quarters = []
    last_year, last_q = years[-1], quarters[-1]

    for h in range(1, horizon + 1):
        fy, fq = add_quarters(last_year, last_q, h)
        future_periods.append(format_period(fy, fq))
        future_quarters.append(fq)

    # 2. Deterministic Holdout Selection Rule
    # Hold out 2-3 quarters when possible.
    # LightGBM requires 4 lags -> needs N_train >= 6 to form >= 2 feature rows.
    if n >= 9:
        holdout_size = 3
    elif n >= 6:
        holdout_size = 2
    else:  # n in [4, 5]
        holdout_size = 1

    train_size = n - holdout_size
    train_vals = values[:train_size]
    val_vals = values[train_size:]
    val_quarters = quarters[train_size:]

    # Track validation metrics
    hw_validation = ModelValidationDetail(isValid=False)
    lgb_validation = ModelValidationDetail(isValid=False)

    # -----------------------------------------------------------------------
    # Evaluate Holt-Winters on Holdout Split
    # -----------------------------------------------------------------------
    try:
        hw_val_preds, hw_type, _ = fit_and_forecast_holt_winters(train_vals, holdout_size)
        hw_mape = compute_mape(val_vals, hw_val_preds)
        hw_rmse = compute_rmse(val_vals, hw_val_preds)
        hw_validation = ModelValidationDetail(
            isValid=True,
            heldOutMAPE=hw_mape,
            rmse=hw_rmse,
            notes=f"Configuration: {hw_type} on {train_size} training quarters"
        )
    except Exception as e:
        hw_validation = ModelValidationDetail(
            isValid=False,
            notes=f"Holt-Winters validation failed: {str(e)}"
        )

    # -----------------------------------------------------------------------
    # Evaluate LightGBM on Holdout Split
    # -----------------------------------------------------------------------
    # Check if train split has enough points for 4-lag matrix (N_train >= 6)
    if train_size >= 6:
        try:
            lgb_val_preds, _ = fit_and_forecast_lightgbm(
                history_vals=list(train_vals),
                history_quarters=quarters[:train_size],
                future_quarters=val_quarters,
                steps=holdout_size
            )
            lgb_mape = compute_mape(val_vals, lgb_val_preds)
            lgb_rmse = compute_rmse(val_vals, lgb_val_preds)
            lgb_validation = ModelValidationDetail(
                isValid=True,
                heldOutMAPE=lgb_mape,
                rmse=lgb_rmse,
                notes=f"Features: 4 lags + quarter number ({train_size - 4} training samples)"
            )
        except Exception as e:
            lgb_validation = ModelValidationDetail(
                isValid=False,
                notes=f"LightGBM validation failed: {str(e)}"
            )
    else:
        lgb_validation = ModelValidationDetail(
            isValid=False,
            notes=f"Insufficient training observations (N_train={train_size} < 6) for 4-lag LightGBM validation split."
        )

    # -----------------------------------------------------------------------
    # Model Selection Strategy
    # -----------------------------------------------------------------------
    selected_model: Optional[str] = None
    selection_reason: str = ""
    selected_mape: Optional[float] = None

    if hw_validation.isValid and lgb_validation.isValid:
        # Both models valid -> Select strictly by lower held-out MAPE
        if lgb_validation.heldOutMAPE < hw_validation.heldOutMAPE:
            selected_model = "LightGBM"
            selected_mape = lgb_validation.heldOutMAPE
            selection_reason = (
                f"LightGBM selected due to lower held-out validation MAPE "
                f"({lgb_validation.heldOutMAPE}% vs {hw_validation.heldOutMAPE}% for Holt-Winters)."
            )
        else:
            selected_model = "Holt-Winters"
            selected_mape = hw_validation.heldOutMAPE
            selection_reason = (
                f"Holt-Winters selected due to lower held-out validation MAPE "
                f"({hw_validation.heldOutMAPE}% vs {lgb_validation.heldOutMAPE}% for LightGBM)."
            )
    elif hw_validation.isValid:
        selected_model = "Holt-Winters"
        selected_mape = hw_validation.heldOutMAPE
        selection_reason = f"Holt-Winters selected (LightGBM excluded: {lgb_validation.notes})."
    elif lgb_validation.isValid:
        selected_model = "LightGBM"
        selected_mape = lgb_validation.heldOutMAPE
        selection_reason = f"LightGBM selected (Holt-Winters excluded: {hw_validation.notes})."
    else:
        return ForecastResponse(
            isAvailable=False,
            reason="Neither Holt-Winters nor LightGBM could be validly trained/evaluated on the series.",
            model=None,
            heldOutMAPE=None,
            forecast=[],
            lower95=[],
            upper95=[],
            validation={
                "holdoutSize": holdout_size,
                "holtWinters": hw_validation.model_dump(),
                "lightGBM": lgb_validation.model_dump()
            }
        )

    # -----------------------------------------------------------------------
    # Generate Horizon Forecast Using Full Historical Data
    # -----------------------------------------------------------------------
    future_forecast_vals: np.ndarray
    residuals: list[float] = []

    if selected_model == "Holt-Winters":
        preds, hw_full_type, fitted_hw = fit_and_forecast_holt_winters(values, horizon)
        future_forecast_vals = preds
        if fitted_hw is not None and hasattr(fitted_hw, 'resid'):
            residuals = list(fitted_hw.resid)
        else:
            residuals = [val_vals[i] - hw_val_preds[i] for i in range(len(val_vals))]

    else:  # LightGBM
        preds, fitted_lgb = fit_and_forecast_lightgbm(
            history_vals=list(values),
            history_quarters=quarters,
            future_quarters=future_quarters,
            steps=horizon
        )
        future_forecast_vals = preds
        # Compute in-sample residuals from full model fit
        X_all, y_all = create_lgb_features(list(values), quarters)
        if len(X_all) > 0 and fitted_lgb is not None:
            fitted_preds = fitted_lgb.predict(X_all)
            residuals = list(y_all - fitted_preds)
        else:
            residuals = [val_vals[i] - lgb_val_preds[i] for i in range(len(val_vals))]

    # Ensure non-negative demand values
    future_forecast_vals = np.maximum(0.0, future_forecast_vals)

    # 3. Construct 95% Prediction Intervals
    lower95, upper95 = calculate_prediction_intervals(
        forecast_values=future_forecast_vals,
        residuals=np.array(residuals) if len(residuals) > 0 else np.array([1.0]),
        sample_mean=float(np.mean(values))
    )

    # Format forecast points
    forecast_points = [
        ForecastPeriodValue(
            period=future_periods[idx],
            value=round(float(future_forecast_vals[idx]), 1)
        )
        for idx in range(horizon)
    ]

    return ForecastResponse(
        isAvailable=True,
        model=selected_model,
        heldOutMAPE=selected_mape,
        forecast=forecast_points,
        lower95=lower95,
        upper95=upper95,
        validation={
            "holdoutSize": holdout_size,
            "selectedModel": selected_model,
            "selectionReason": selection_reason,
            "holtWinters": hw_validation.model_dump(),
            "lightGBM": lgb_validation.model_dump()
        }
    )


# ---------------------------------------------------------------------------
# Standalone execution
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8001, reload=True)
