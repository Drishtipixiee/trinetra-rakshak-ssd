import random

class ThreatPredictor:
    def __init__(self):
        # Maps raw sensor IDs or types to standard threats
        self.threat_classes = ["Wildlife", "Human Intruder", "Vehicle", "UAV/Drone"]
    
    def predict_threat_class(self, sensor_type, velocity, proximity):
        """
        A heuristic/ML stub to predict the class of a threat
        in the Indian context based on sensor inputs.
        """
        if sensor_type == "Track-Guard":
            if velocity < 15 and proximity < 100:
                return "Cattle/Wildlife"
            elif velocity > 40:
                return "Unauthorized Train/Vehicle"
            return "Obstruction/Boulder"
            
        elif sensor_type == "Border-Sentry":
            if velocity > 60:
                return "Suspicious Vehicle"
            elif velocity > 10 and velocity < 30:
                return "UAV/Drone"
            return "Human Intruder/Smuggler"
            
        elif sensor_type == "Geo-Eye":
            return "Illegal Mining/Deforestation Activity"
            
        return random.choice(self.threat_classes)
