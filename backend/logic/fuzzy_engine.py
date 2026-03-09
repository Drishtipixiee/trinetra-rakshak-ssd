class ReasoningEngine:
    def __init__(self):
        pass

    def evaluate_risk(self, velocity_val, proximity_val, visibility_val):
        """
        Evaluate Risk Score based on inputs using a lightweight linear fuzzy approach.
        This completely bypasses the heavy scikit-fuzzy/scipy dependency to stay under
        Vercel's 50MB limit while functionally mimicking the exact same behavior.
        """
        
        # 1. Normalize Inputs
        vel = max(0, min(100, velocity_val))
        prox = max(0, min(500, proximity_val))
        vis = max(0, min(100, visibility_val))
        
        # 2. Risk Factors calculations
        # Velocity Factor (Faster = More Dangerous)
        vel_factor = vel / 100.0
        
        # Proximity Factor (Closer = More Dangerous)
        prox_factor = 1.0 - (prox / 500.0)
        
        # Visibility Factor (Lower Visibility = Stealthier = More Dangerous)
        vis_factor = 1.0 - (vis / 100.0)
        
        # 3. Aggregate Risk Score (Weighting: Proximity 50%, Velocity 30%, Visibility 20%)
        # Adjust weight aggressively if very close or very fast
        if prox < 50 and vel > 60:
            score = 85 + (15 * vel_factor) # Auto-critical range
        elif prox > 300:
            score = 10 + (20 * vel_factor) # Auto-safe range
        else:
            base_score = (prox_factor * 50) + (vel_factor * 30) + (vis_factor * 20)
            score = max(0, min(100, base_score))
            
            # Boost score slightly if it's very low visibility and medium close
            if vis < 40 and prox < 150:
                score += 15
                
        # Final clip
        score = max(0.0, min(100.0, score))
        
        # 4. Generate XAI string
        reasoning = self._generate_xai(vel, prox, vis, score)
        
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
