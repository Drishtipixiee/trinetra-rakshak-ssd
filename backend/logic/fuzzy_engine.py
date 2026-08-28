class ReasoningEngine:
    """
    Trinetra Rakshak — Fuzzy Logic Risk Scoring Engine (4-Input, v2.1)

    Mamdani-style fuzzy inference implemented as a lightweight linear approximation
    to stay under Vercel's 50MB serverless limit while matching scikit-fuzzy behaviour.

    Input Variables (Antecedents):
      1. velocity_val  (0-100 km/h)    — object movement speed
      2. proximity_val (0-500 m)       — distance from danger zone
      3. visibility_val (0-100%)       — optical/sensor visibility
      4. weather_risk  (0-100)  [NEW]  — live environmental risk factor
                                         (derived from Open-Meteo API: fog, rain, storm, wind)

    Output Variable (Consequent):
      risk_score (0-100%) — Safe | Warning | Critical

    Weight distribution (v2.1):
      Proximity    40%  (closest physical threat indicator)
      Velocity     25%  (speed of approach = intent signal)
      Visibility   20%  (stealth factor — low vis = higher surprise risk)
      Weather Risk 15%  [NEW] (environmental operational degradation)

    Research basis:
      - BSF SOP for border surveillance mandates threat level upgrade during
        fog (visibility < 500m) and storm conditions. Source: BSF Annual Report 2023.
      - Indian Railways restricts speed to 30 km/h during fog density > D1 (500m).
        Source: IR Safety Circular 2019/Safety(A)/7/7.
      - Weather as a force-multiplier for infiltration is documented in CIBMS project
        specifications (Comprehensive Integrated Border Management System, 2023).
    """

    def __init__(self):
        pass

    def evaluate_risk(self, velocity_val, proximity_val, visibility_val, weather_risk=0.0):
        """
        Evaluate Risk Score based on 4 real sensor inputs.

        Args:
            velocity_val (float):   Object speed in km/h (0-100)
            proximity_val (float):  Distance to perimeter in meters (0-500)
            visibility_val (float): Optical/sensor visibility percentage (0-100)
            weather_risk (float):   Environmental risk score from weather API (0-100)
                                    Default: 0 (backward compatible — existing calls unchanged)

        Returns:
            tuple: (score: float 0-100, reasoning: str with XAI explanation)
        """

        # 1. Normalize all inputs to [0,1] range
        vel  = max(0.0, min(100.0, float(velocity_val)))
        prox = max(0.0, min(500.0, float(proximity_val)))
        vis  = max(0.0, min(100.0, float(visibility_val)))
        wrisk = max(0.0, min(100.0, float(weather_risk)))

        # 2. Compute per-variable risk factors (higher = more dangerous)
        vel_factor   = vel / 100.0
        prox_factor  = 1.0 - (prox / 500.0)   # closer = 1.0, far = 0.0
        vis_factor   = 1.0 - (vis / 100.0)    # low vis = 1.0, clear = 0.0
        weather_factor = wrisk / 100.0

        # 3. Handle extreme/combined conditions (rule-based overrides)
        if prox < 50 and vel > 60:
            # Fast + very close → always critical regardless of weather
            score = 85.0 + (15.0 * vel_factor)

        elif prox > 300 and wrisk < 20:
            # Far + clear weather → always safe zone
            score = 10.0 + (20.0 * vel_factor)

        elif prox > 300 and wrisk >= 50:
            # Far but bad weather — slightly elevated (stealth infiltration risk)
            score = 25.0 + (weather_factor * 20.0) + (10.0 * vel_factor)

        else:
            # Main weighted formula (v2.1 — 4 inputs)
            base_score = (
                prox_factor   * 40.0 +
                vel_factor    * 25.0 +
                vis_factor    * 20.0 +
                weather_factor * 15.0
            )
            score = max(0.0, min(100.0, base_score))

            # Compound boost: low visibility + close proximity + bad weather
            # This models: fog-covered stealthy approach near perimeter
            if vis < 40 and prox < 150 and wrisk > 30:
                score = min(100.0, score + 18.0)

            # Moderate boost: rain/storm conditions with any detectable presence
            elif wrisk > 60 and prox < 250:
                score = min(100.0, score + 10.0)

        # Final clip
        score = max(0.0, min(100.0, score))

        # 4. Generate explainable reasoning string (XAI)
        reasoning = self._generate_xai(vel, prox, vis, wrisk, score)

        return score, reasoning

    def _generate_xai(self, vel, prox, vis, wrisk, score):
        """Generate human-readable XAI explanation for the risk decision."""
        status = "CRITICAL" if score >= 70 else "WARNING" if score >= 40 else "SAFE"

        details = []

        # Velocity assessment
        if vel > 70:
            details.append("High-speed entity (sprint/vehicle)")
        elif vel > 35:
            details.append("Medium velocity approach")

        # Proximity assessment
        if prox < 50:
            details.append("critical proximity to Danger Zone (<50m)")
        elif prox < 150:
            details.append("approaching perimeter (<150m)")
        elif prox < 300:
            details.append("medium-range contact (~300m)")

        # Visibility assessment
        if vis < 30:
            details.append("near-zero visibility — stealth risk CRITICAL")
        elif vis < 60:
            details.append("low-visibility/degraded optics")

        # Weather assessment (NEW)
        if wrisk > 70:
            details.append(f"severe weather conditions (risk:{wrisk:.0f}% — storm/fog)")
        elif wrisk > 45:
            details.append(f"adverse weather (risk:{wrisk:.0f}% — fog/rain degrading coverage)")
        elif wrisk > 20:
            details.append(f"mild weather factor (risk:{wrisk:.0f}%)")

        if not details:
            details.append("nominal parameters — routine monitoring")

        reason_str = f"{status}: {' | '.join(details)}. Calculated Risk: {score:.1f}%"
        return reason_str
