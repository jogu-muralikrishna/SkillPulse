"""
Unit and Integration Tests for SkillPulse ML Forecast Microservice
Tests:
- Fewer than 4 quarters -> unavailable
- Valid 8+ quarter series -> forecast returned
- Both models evaluated when possible
- Lower MAPE model selected
- 95% prediction intervals exist and satisfy lower95 <= forecast <= upper95
- Small data safety (4-5 quarters) gracefully excludes LightGBM
"""

import sys
import os
import unittest
from fastapi.testclient import TestClient

# Ensure ml-service directory is on Python path
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
from app import app, parse_period, add_quarters, compute_mape, compute_rmse, calculate_prediction_intervals


class TestForecastService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("Holt-Winters", data["models"])
        self.assertIn("LightGBM", data["models"])

    def test_minimum_history_rule_unavailable(self):
        """Fewer than 4 quarters must return isAvailable=False without forecasting."""
        payload = {
            "series": [
                {"period": "2024-Q1", "value": 100},
                {"period": "2024-Q2", "value": 110},
                {"period": "2024-Q3", "value": 120}
            ],
            "horizon": 4
        }
        resp = self.client.post("/forecast", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertFalse(data["isAvailable"])
        self.assertIn("Minimum 4 historical quarters required", data["reason"])
        self.assertEqual(len(data["forecast"]), 0)
        self.assertEqual(len(data["lower95"]), 0)
        self.assertEqual(len(data["upper95"]), 0)

    def test_valid_8_quarter_series_forecast(self):
        """Reproducible 8-quarter series must return a valid forecast, intervals, and model selection."""
        # 8-quarter series with clear trend and seasonal pattern
        payload = {
            "series": [
                {"period": "2023-Q1", "value": 150.0},
                {"period": "2023-Q2", "value": 180.0},
                {"period": "2023-Q3", "value": 210.0},
                {"period": "2023-Q4", "value": 170.0},
                {"period": "2024-Q1", "value": 165.0},
                {"period": "2024-Q2", "value": 200.0},
                {"period": "2024-Q3", "value": 235.0},
                {"period": "2024-Q4", "value": 190.0}
            ],
            "horizon": 4
        }
        resp = self.client.post("/forecast", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertTrue(data["isAvailable"])
        self.assertIn(data["model"], ["Holt-Winters", "LightGBM"])
        self.assertIsInstance(data["heldOutMAPE"], float)
        self.assertEqual(len(data["forecast"]), 4)
        self.assertEqual(len(data["lower95"]), 4)
        self.assertEqual(len(data["upper95"]), 4)

        # Expected future periods
        expected_periods = ["2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4"]
        for idx, pt in enumerate(data["forecast"]):
            self.assertEqual(pt["period"], expected_periods[idx])
            val = pt["value"]
            lower = data["lower95"][idx]
            upper = data["upper95"][idx]

            # 95% Interval Bound Assertion: lower95 <= forecast <= upper95
            self.assertLessEqual(lower, val, f"lower95 ({lower}) > forecast ({val}) at {pt['period']}")
            self.assertLessEqual(val, upper, f"forecast ({val}) > upper95 ({upper}) at {pt['period']}")
            self.assertGreaterEqual(lower, 0.0, f"lower95 ({lower}) cannot be negative")

        # Verify holdout validation metadata
        val_meta = data["validation"]
        self.assertIn("holtWinters", val_meta)
        self.assertIn("lightGBM", val_meta)
        self.assertIn("selectionReason", val_meta)

        hw_info = val_meta["holtWinters"]
        lgb_info = val_meta["lightGBM"]

        # Both models should be validly evaluated for N=8 (holdout=2, train=6)
        self.assertTrue(hw_info["isValid"])
        self.assertTrue(lgb_info["isValid"])
        self.assertIsNotNone(hw_info["heldOutMAPE"])
        self.assertIsNotNone(lgb_info["heldOutMAPE"])

        # Check model selection agreed with lower MAPE
        if lgb_info["heldOutMAPE"] < hw_info["heldOutMAPE"]:
            self.assertEqual(data["model"], "LightGBM")
        else:
            self.assertEqual(data["model"], "Holt-Winters")

    def test_compact_series_small_data_safety(self):
        """A 5-quarter series should gracefully exclude LightGBM (train_size < 6) and select Holt-Winters."""
        payload = {
            "series": [
                {"period": "2023-Q4", "value": 100.0},
                {"period": "2024-Q1", "value": 115.0},
                {"period": "2024-Q2", "value": 130.0},
                {"period": "2024-Q3", "value": 145.0},
                {"period": "2024-Q4", "value": 160.0}
            ],
            "horizon": 2
        }
        resp = self.client.post("/forecast", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        self.assertTrue(data["isAvailable"])
        self.assertEqual(data["model"], "Holt-Winters")
        self.assertEqual(len(data["forecast"]), 2)

        # LightGBM must be safely excluded with clear explanation
        lgb_info = data["validation"]["lightGBM"]
        self.assertFalse(lgb_info["isValid"])
        self.assertIn("Insufficient training observations", lgb_info["notes"])

    def test_helper_period_arithmetic(self):
        y, q = parse_period("2024-Q3")
        self.assertEqual((y, q), (2024, 3))
        ny, nq = add_quarters(y, q, 2)
        self.assertEqual((ny, nq), (2025, 1))
        ny3, nq3 = add_quarters(y, q, 6)
        self.assertEqual((ny3, nq3), (2026, 1))

    def test_prediction_interval_uses_rmse_not_mse(self):
        """
        Verifies that calculate_prediction_intervals scales margins by RMSE = sqrt(MSE),
        and strictly catches any accidental use of MSE = (1/M) * sum(resid^2).
        """
        residuals = np.array([10.0, -10.0])
        mse = float(np.mean(residuals ** 2))  # 100.0
        rmse = float(np.sqrt(mse))            # 10.0
        self.assertEqual(mse, 100.0)
        self.assertEqual(rmse, 10.0)

        forecast_vals = np.array([100.0])
        lower, upper = calculate_prediction_intervals(
            forecast_values=forecast_vals,
            residuals=residuals,
            sample_mean=100.0
        )

        expected_margin_rmse = round(1.96 * rmse * 1.0, 1)  # 19.6
        expected_margin_mse = round(1.96 * mse * 1.0, 1)    # 196.0

        actual_margin = round(upper[0] - forecast_vals[0], 1)

        # Must match RMSE margin (19.6) and NOT MSE margin (196.0)
        self.assertAlmostEqual(actual_margin, expected_margin_rmse, places=1)
        self.assertNotAlmostEqual(actual_margin, expected_margin_mse, places=1)
        self.assertEqual(lower[0], round(100.0 - expected_margin_rmse, 1))
        self.assertEqual(upper[0], round(100.0 + expected_margin_rmse, 1))
        self.assertTrue(lower[0] <= forecast_vals[0] <= upper[0])


if __name__ == "__main__":
    unittest.main()
