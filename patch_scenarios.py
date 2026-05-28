import re

with open('backend/api/index.py', 'r', encoding='utf-8') as f:
    content = f.read()

NEW_SCENARIOS = """    scenarios = {
        'INTRUSION': [
            {'type': 'PERSON', 'sector': 'SEC-7A', 'severity': 'WARNING', 'risk_score': 55,
             'description': 'Unidentified individual approaching perimeter at KM-142'},
            {'type': 'PERSON', 'sector': 'SEC-7A', 'severity': 'CRITICAL', 'risk_score': 87,
             'description': 'Multi-target intrusion — armed personnel detected at border fence SEC-7A'},
        ],
        'DRONE': [
            {'type': 'DRONE', 'sector': 'SEC-7B', 'severity': 'WARNING', 'risk_score': 61,
             'description': 'Unregistered quadcopter detected at 80m altitude'},
            {'type': 'DRONE', 'sector': 'SEC-7B', 'severity': 'CRITICAL', 'risk_score': 92,
             'description': 'Armed drone with payload detected — engagement protocol initiated'},
        ],
        'WILDLIFE': [
            {'type': 'WILDLIFE', 'sector': 'KM-142', 'severity': 'WARNING', 'risk_score': 45,
             'description': 'Herd of elephants approaching railway track section KM-142'},
        ],
        'MINING': [
            {'type': 'EXCAVATION', 'sector': 'DHANBAD', 'severity': 'CRITICAL', 'risk_score': 95,
             'description': 'Illegal heavy machinery operation detected in protected forest corridor'},
        ]
    }

    events = scenarios.get(scenario, scenarios['INTRUSION'])"""

pattern = r"    scenarios = \{.*?events = scenarios\.get\(scenario, scenarios\['BORDER_INTRUSION'\]\)"
new_content = re.sub(pattern, NEW_SCENARIOS, content, flags=re.DOTALL)

with open('backend/api/index.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print("Successfully replaced scenarios")
