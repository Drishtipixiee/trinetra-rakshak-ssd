import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

class ReasoningEngine:
    def __init__(self):
        # 1. Define Linguistic Variables
        self.velocity = ctrl.Antecedent(np.arange(0, 101, 1), 'velocity') # km/h or relative speed
        self.proximity = ctrl.Antecedent(np.arange(0, 501, 1), 'proximity') # Distance to ROI / Danger zone (meters)
        self.visibility = ctrl.Antecedent(np.arange(0, 101, 1), 'visibility') # 0-100% weather visibility
        
        self.risk = ctrl.Consequent(np.arange(0, 101, 1), 'risk') # 0 to 100 risk score

        # 2. Define Membership Functions (Fuzzy Sets)
        # Velocity
        self.velocity['low'] = fuzz.trimf(self.velocity.universe, [0, 0, 40])
        self.velocity['medium'] = fuzz.trimf(self.velocity.universe, [30, 50, 70])
        self.velocity['high'] = fuzz.trimf(self.velocity.universe, [60, 100, 100])
        
        # Proximity (Closer = Higher Risk. 0 is exactly at the ROI threshold)
        self.proximity['near'] = fuzz.trimf(self.proximity.universe, [0, 0, 50])
        self.proximity['medium'] = fuzz.trimf(self.proximity.universe, [30, 100, 200])
        self.proximity['far'] = fuzz.trimf(self.proximity.universe, [150, 500, 500])
        
        # Visibility (Low visibility means stealthy / dangerous)
        self.visibility['low'] = fuzz.trimf(self.visibility.universe, [0, 0, 40])
        self.visibility['medium'] = fuzz.trimf(self.visibility.universe, [30, 50, 80])
        self.visibility['high'] = fuzz.trimf(self.visibility.universe, [60, 100, 100])
        
        # Risk Score
        self.risk['safe'] = fuzz.trimf(self.risk.universe, [0, 0, 40])
        self.risk['warning'] = fuzz.trimf(self.risk.universe, [30, 60, 80])
        self.risk['critical'] = fuzz.trimf(self.risk.universe, [70, 100, 100])

        self._build_rules()
        self.risk_simulator = ctrl.ControlSystemSimulation(self.risk_ctrl)

    def _build_rules(self):
        # Rule Base Matrix

        # High Speed + Near
        rule1 = ctrl.Rule(self.velocity['high'] & self.proximity['near'], self.risk['critical'])
        
        # Stealth Factor (Low Visibility + Near)
        rule2 = ctrl.Rule(self.visibility['low'] & self.proximity['near'], self.risk['critical'])
        
        # General Warning
        rule3 = ctrl.Rule(self.velocity['medium'] & self.proximity['near'], self.risk['warning'])
        rule4 = ctrl.Rule(self.velocity['high'] & self.proximity['medium'], self.risk['warning'])
        rule5 = ctrl.Rule(self.visibility['low'] & self.proximity['medium'], self.risk['warning'])
        rule8 = ctrl.Rule(self.velocity['medium'] & self.proximity['medium'], self.risk['warning'])
        
        # Safe scenarios
        rule6 = ctrl.Rule(self.proximity['far'], self.risk['safe'])
        rule7 = ctrl.Rule(self.velocity['low'] & self.proximity['medium'] & self.visibility['high'], self.risk['safe'])
        rule9 = ctrl.Rule(self.velocity['low'] & self.proximity['medium'] & self.visibility['medium'], self.risk['safe'])

        self.risk_ctrl = ctrl.ControlSystem([rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8, rule9])

    def evaluate_risk(self, velocity_val, proximity_val, visibility_val):
        """
        Evaluate Risk Score based on inputs.
        """
        self.risk_simulator.input['velocity'] = velocity_val
        self.risk_simulator.input['proximity'] = proximity_val
        self.risk_simulator.input['visibility'] = visibility_val

        # Crunch the numbers
        self.risk_simulator.compute()
        score = self.risk_simulator.output['risk']
        
        # Generate XAI string
        reasoning = self._generate_xai(velocity_val, proximity_val, visibility_val, score)
        
        return score, reasoning

    def _generate_xai(self, vel, prox, vis, score):
        status = "CRITICAL" if score >= 70 else "WARNING" if score >= 40 else "SAFE"
        
        details = []
        if vel > 60: details.append("High-speed entity")
        if prox < 50: details.append("critical proximity to Danger Zone")
        elif prox < 150: details.append("approaching perimeter")
        if vis < 40: details.append("low-visibility/stealth conditions")
        
        if not details:
            details.append("nominal parameters")
            
        reason_str = f"{status}: {' | '.join(details)}. Calculated Risk: {score:.1f}%"
        return reason_str
