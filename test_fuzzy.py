import sys
import os

# Ensure backend module is resolvable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.logic.fuzzy_engine import ReasoningEngine

def run_tests():
    engine = ReasoningEngine()

    print("--- Trinetra Rakshak: XAI Fuzzy Reasoning Tests ---")
    
    # Test 1: High Risk Scenario (Requested by Architect)
    print("\n[TEST 1] Scenario: High Speed Intruder, Near Danger Zone, Low Visibility")
    score, reason = engine.evaluate_risk(velocity_val=80, proximity_val=20, visibility_val=15)
    print(f"Outcome: {score:.2f}/100")
    print(f"XAI: {reason}")
    assert score >= 70, "Expect Critical Risk"

    # Test 2: Standard Safe Scenario
    print("\n[TEST 2] Scenario: Low Speed, Far from perimeter, Good Visibility")
    score, reason = engine.evaluate_risk(velocity_val=10, proximity_val=400, visibility_val=90)
    print(f"Outcome: {score:.2f}/100")
    print(f"XAI: {reason}")
    assert score < 40, "Expect Safe Risk"
    
    # Test 3: Warning Scenario
    print("\n[TEST 3] Scenario: Medium Speed, Medium Distance, Good Visibility")
    score, reason = engine.evaluate_risk(velocity_val=45, proximity_val=120, visibility_val=85)
    print(f"Outcome: {score:.2f}/100")
    print(f"XAI: {reason}")
    assert 40 <= score <= 70, "Expect Warning Risk"

    print("\nAll Tests Executed Successfully.")

if __name__ == "__main__":
    run_tests()
