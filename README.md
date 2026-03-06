# Trinetra Rakshak (Software-Defined Defense)

Trinetra Rakshak is a high-end "Digital Shield" designed to replace traditional hardware with AI intelligence. This system provides real-time threat detection, reasoning, and visual tracking with an explainable AI (XAI) core.

## 🌟 Mission Profile

As a sole developer, this project serves as a comprehensive Command Center employing cutting-edge Computer Vision (YOLOv11), Fuzzy Logic Reasoning, and a Dynamic React-based "Glassmorphism" HUD dashboard.

## 🏗️ Architecture Design

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#1e1e24,stroke:#ff3366,stroke-width:2px,color:#fff;
    classDef backend fill:#1f2833,stroke:#66fcff,stroke-width:2px,color:#fff;
    classDef ai fill:#222831,stroke:#00ffcc,stroke-width:2px,color:#fff;

    subgraph Elite Command Center [Frontend - React/Vite/Tailwind]
        UI[Glassmorphism HUD]:::frontend
        Charts[Risk Gauge & History]:::frontend
        Voice[Voice commands]:::frontend
        Validation[Human-in-Loop Verify]:::frontend
    end

    subgraph Integration Core [Backend - Flask]
        API[Axios / CORS Setup]:::backend
        Alerts[Auto-Gen PDF Reports]:::backend
    end

    subgraph Artificial Intelligence [AI Logic Suite]
        YOLO[Border-Sentry YOLOv11]:::ai
        CV[Geo-Eye OpenCV Subtraction]:::ai
        Track[Track-Guard Obstructions]:::ai
    end
    
    subgraph Reasoning Engine [Logic Core]
        Fuzzy[Fuzzy Scikit Engine]:::ai
        XAI[Explainable AI Reasoning]:::ai
    end

    UI --> API
    Validation --> API
    API --> Fuzzy
    YOLO --> Fuzzy
    CV --> Fuzzy
    Track --> Fuzzy
    Fuzzy --> XAI
    XAI --> Alerts
    XAI --> Charts
```

## 🚀 Repositories & Modules

*   **/backend**: Core Flask REST APIs, Axios integrations, and PDF reporting.
*   **/frontend**: Elite command center utilizing Vite, React, Framer Motion, and Tailwind CSS.
*   **/ai_logic**:
    *   **Border-Sentry**: YOLOv11 Dynamic ROI Intrusion engine.
    *   **Geo-Eye**: Time-lapsed terrain anomaly detection.
    *   **Track-Guard**: Railway optimization & track blockade AI.
    *   **Reasoning Engine**: Scikit-Fuzzy module processing combined variable sets (Velocity, Proximity, Weather).

## 🧰 Tech Stack
-   **Frontend**: React, Vite, Tailwind CSS, Recharts, Framer Motion.
-   **Backend**: Python, Flask, Flask-CORS.
-   **AI & Logic**: Scikit-Fuzzy, OpenCV, Python.
-   **DevOps**: Docker, Github Actions.