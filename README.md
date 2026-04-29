<div align="center">

# TRINETRA RAKSHAK

### त्रिनेत्र रक्षक — "Three-Eyed Guardian"

### AI-Powered Integrated Command & Control Surveillance System

[![Live Demo](https://img.shields.io/badge/LIVE-Command_Center-22c55e?style=for-the-badge)](https://trinetra-rakshak-ssd.vercel.app)
[![DB Viewer](https://img.shields.io/badge/ADMIN-DB_Viewer-0ea5e9?style=for-the-badge)](https://backend-ten-fawn-25.vercel.app/admin/db)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Drishtipixiee/trinetra-rakshak-ssd)

**A defense-grade AI surveillance prototype for India's defense infrastructure -- featuring border security, railway safety, and integrated GIS mining detection.**

[**Launch Command Center**](https://trinetra-rakshak-ssd.vercel.app) | [**Open DB Viewer**](https://backend-ten-fawn-25.vercel.app/admin/db) | [**Manual**](#core-modules)


</div>

---

## What is Trinetra Rakshak?

**Trinetra Rakshak** (त्रिनेत्र रक्षक -- *"Three-Eyed Guardian"*) is a real-world analogy-based prototype that demonstrates how AI can enhance India's defense infrastructure. The **3 eyes** represent:

1. **Border-Sentry** -- AI-powered perimeter intrusion detection with fuzzy logic risk scoring
2. **GEO-EYE** -- Satellite GIS terrain analysis for illegal mining detection in Jharkhand
3. **Track-Guard** -- Railway wildlife/obstruction detection with auto-brake signals

> Modeled after real programs: BSF's **BOLD-QIT**, Indian Railways' **Project Nilgiri**, and ISRO's **Mining Surveillance System (MSS)**.

---

## Core Modules

| Module | What it does | Real-world analogy |
|--------|-------------|-------------------|
| **Dashboard** | Command overview with status cards, module navigation, and GO LIVE button | Military situational briefing screen |
| **Telemetry** | Live real-time system health metrics (Signal, Latency, AI Confidence, Uptime) | Tactical sensor node health uplinks |
| **Live Feed** | 60-second border intrusion simulation with canvas-based tactical bounding boxes | BSF CCTV monitoring at border posts |
| **CCTV Grid** | Real perimeter video underlays with dynamic AI bounding boxes, "Wanted" profiling, and live webcam feed | Multi-camera surveillance rooms |
| **GEO-EYE** | Satellite map (React-Leaflet + ESRI + ISRO Bhuvan WMS) with terrain change detection scan | ISRO/NRSC Mining Surveillance System |
| **Track-Guard** | Railway wildlife detection with auto-brake and time-to-impact calculation | Project Nilgiri elephant detection |
| **Analytics** | Real-time threat charts, KPIs, and trend analysis | Military intelligence dashboards |

---

## AI Systems

| System | Technology | What it does |
|--------|-----------|-------------|
| **Fuzzy Logic Engine** | scikit-fuzzy (Python) | 9-rule risk scoring: velocity x proximity x visibility --> risk score (0-100%) with XAI reasoning |
| **AI Voice Alerts** | Web Speech API | 30+ randomized voice messages -- different every cycle. Speaks on WARNING, CRITICAL, ALL-CLEAR, Track-Guard, and GEO-EYE scans |
| **AI Threat Analyst** | Claude API (claude-haiku-4-5-20251001) with local fallback | LLM-powered chatbot -- real-time threat analysis, patrol recommendations, and module status. Falls back to keyword engine if API is unavailable |
| **Sound System** | Web Audio API | Siren (sweep), Klaxon (3 beeps), Detection beep, Success chime -- all generated programmatically |

---

## Real-World Integrations

| Integration | Description | Setup |
|-------------|-------------|-------|
| **Telegram Alerts** | Real-time threat alerts via Telegram Bot API. Triggers on WARNING (score > 50) and CRITICAL (score > 75) events. | Create a bot via [@BotFather](https://t.me/BotFather), get chat ID from [@userinfobot](https://t.me/userinfobot) |
| **Twilio SMS** | SMS alerts to designated phone numbers for CRITICAL threats (score > 75). Uses Twilio REST API. | Sign up at [twilio.com](https://www.twilio.com/console) |
| **Twilio WhatsApp** | WhatsApp notifications for CRITICAL events via Twilio WhatsApp API. Same threshold as SMS. | Enable WhatsApp sandbox in [Twilio Console](https://www.twilio.com/console/sms/whatsapp/learn) |
| **Claude AI Analyst** | Real Claude API powers the AI Threat Analyst chatbot with tactical, defense-focused responses. Falls back to local keyword engine. | Get API key at [console.anthropic.com](https://console.anthropic.com/) |
| **Supabase Database** | Persistent threat event logging to a real PostgreSQL database. Logs CRITICAL and WARNING events with module, score, and details. | Create project at [supabase.com](https://supabase.com/dashboard) |
| **ISRO Bhuvan WMS** | ISRO's Bhuvan satellite imagery as a toggleable WMS overlay in the GEO-EYE module. Sits on top of ESRI tiles. | No setup needed -- public WMS endpoint |
| **Live Webcam Feed** | Real webcam integration in CCTV Grid (CAM-05) via getUserMedia API with AI overlay rendering. | Browser camera permission required |

---

## Communication & Alerts

| Feature | Description |
|---------|-------------|
| **Walkie-Talkie (Global)** | Radio comms with push-to-talk, auto-transmissions on CRITICAL threats (from CCTV, Track-Guard, and Geo-Eye), and authentic radio static bursts |
| **Mobile SMS** | Phone mockup with SMS/WhatsApp notifications -- dynamic message templates triggered across all system modules with delivery receipts |
| **Voice Alerts** | AI speaks in Indian English -- 5 variants each for CRITICAL, WARNING, ALL-CLEAR + Track-Guard + GEO-EYE |
| **Telegram / Twilio** | Real external alert dispatch -- Telegram for WARNING+, SMS and WhatsApp for CRITICAL only |

---

## Security

- **SHA-256 password hashing** with salt via Web Crypto API
- **RSA-2048 key pair generation** during authentication
- **Session management** with sessionStorage
- Multi-role access design: Officer, Commander, Admin

---

## Sector Layout

| Sector | Location | Camera | Purpose |
|--------|---------|--------|---------|
| SEC-7 | Command HQ | -- | Sector Commander's post |
| SEC-7A | Northeast perimeter | CAM-01, CAM-02 | Main gate + perimeter fence |
| SEC-7B | East side | CAM-03 | Watchtower observation |
| SEC-7C | South perimeter | CAM-04 | Bunker area |
| SEC-7D | Local device | CAM-05 | Live webcam feed |
| TRK-2 | Railway corridor | Track sensors | KM 142 wildlife monitoring |
| GEO-3 | Jharkhand mining corridor | Satellite | Illegal mining detection |

---

## Environment Setup

Copy `.env.example` to `.env` at the repo root and fill in your credentials:

```
# Telegram Bot API
TELEGRAM_TOKEN=           # From @BotFather on Telegram
TELEGRAM_CHAT_ID=         # From @userinfobot on Telegram

# Twilio SMS + WhatsApp
TWILIO_ACCOUNT_SID=       # From Twilio Console dashboard
TWILIO_AUTH_TOKEN=         # From Twilio Console dashboard
TWILIO_FROM_NUMBER=       # Your Twilio phone number (E.164 format)
ALERT_PHONE_NUMBER=       # Recipient phone number (E.164 format)

# Anthropic Claude AI
ANTHROPIC_API_KEY=        # From console.anthropic.com

# Supabase Database
VITE_SUPABASE_URL=        # From Supabase project Settings > API
VITE_SUPABASE_ANON_KEY=   # From Supabase project Settings > API
```

**Supabase table setup** -- run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE threat_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  score FLOAT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

> All environment variables are optional. The system gracefully falls back to local/simulated behavior when credentials are not configured.

---

## Quick Start

### Prerequisites
- Node.js 18+ / Python 3.10+

### Frontend
```bash
cd command_center
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) -- Login: `officer` / `trinetra2026`

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
- **Local API**: `http://localhost:5000`
- **Local DB Viewer**: `http://localhost:5000/admin/db`
- **Vercel DB Viewer**: `https://backend-ten-fawn-25.vercel.app/admin/db`

### Docker
```bash
docker-compose up --build
```

---

## Architecture

```mermaid
flowchart TB
    USER(["User / Commander"]) --> LOGIN["SHA-256 + RSA-2048 Login"]
    LOGIN --> DASH["Dashboard Overview"]

    DASH --> |GO LIVE| SIM["Simulation Engine<br/>60-second threat scenarios"]
    DASH --> |Click Module| TABS

    subgraph TABS [" Frontend -- React 18 + Vite "]
        direction TB
        SIM --> |Threat Data| CANVAS["Canvas Detection Renderer<br/>Bounding boxes + confidence bars"]
        SIM --> |Threat Level Change| VOICE["AI Voice System<br/>30+ randomized messages"]
        SIM --> |CRITICAL alert| SMS["Mobile SMS Alert"]
        SIM --> |CRITICAL alert| RADIO["Walkie-Talkie"]

        CCTV["CCTV Grid<br/>4 simulated + 1 live webcam"]
        GEO["GEO-EYE<br/>Leaflet + ESRI + ISRO Bhuvan WMS"]
        TRACK["Track-Guard<br/>Railway wildlife detection"]
        CHAT["AI Threat Analyst<br/>Claude API + local fallback"]
        ANALYTICS["Analytics Dashboard<br/>Recharts graphs"]
    end

    GEO --> |RUN SCAN| VOICE
    TRACK --> |Wildlife detected| VOICE

    subgraph BACKEND [" Backend -- Flask + Vercel Serverless "]
        API["REST API<br/>10 endpoints"]
        FUZZY["Fuzzy Logic Engine<br/>scikit-fuzzy / lightweight"]
        PREDICT["Threat Predictor<br/>Heuristic classifier"]
        ALERT["Alert Dispatcher<br/>Telegram + Twilio SMS + WhatsApp"]
        CLAUDE["Claude AI<br/>claude-haiku-4-5-20251001"]
        API --> FUZZY
        API --> PREDICT
        API --> ALERT
        API --> CLAUDE
    end

    SIM -.-> |/api/fuzzy| API
    SIM -.-> |/api/alert| ALERT
    CHAT -.-> |/api/chat| CLAUDE

    subgraph DEPLOY [" Deployment "]
        VERCEL_F["Vercel Frontend<br/>trinetra-rakshak-ssd.vercel.app"]
        VERCEL_B["Vercel Backend<br/>backend-ten-fawn-25.vercel.app"]
        GH["GitHub Repository<br/>Drishtipixiee/trinetra-rakshak-ssd"]
        SUPA["Supabase<br/>PostgreSQL threat_logs"]
    end
```

## Project Structure

```text
trinetra-rakshak-ssd/
├── command_center/              # React Frontend (Vercel)
│   ├── src/
│   │   ├── App.jsx              # Main: login, sim engine, all 7 tabs
│   │   ├── index.css            # Tactical CSS
│   │   ├── lib/
│   │   │   └── supabase.js      # Supabase client + threat logging
│   │   └── components/
│   │       ├── AIThreatAnalyst.jsx   # Claude-powered chatbot
│   │       ├── AIVoiceSystem.js      # TTS + sound effects
│   │       ├── CCTVGrid.jsx          # 4-camera canvas + live webcam
│   │       ├── WalkieTalkie.jsx      # Radio communications
│   │       ├── MobileAlert.jsx       # Phone SMS mockup
│   │       └── ...
├── backend/                     # Flask Backend (Vercel Serverless)
│   ├── api/index.py             # Serverless entry: /api/alert, /api/chat, /api/fuzzy
│   ├── logic/
│   │   ├── fuzzy_engine.py      # Lightweight fuzzy logic
│   │   ├── threat_predictor.py  # Heuristic classifier
│   │   └── alert_manager.py     # Telegram + Twilio SMS + WhatsApp
├── .env.example                 # All required environment variables
├── docker-compose.yml
└── README.md
```

## Tech Stack

| Layer | Technologies | Why |
|-------|-------------|-----|
| **Frontend** | React 18, Vite 5, Framer Motion, Recharts, React Leaflet | Modern SPA framework with smooth animations |
| **AI/Voice** | Web Speech API, Web Audio API, Web Crypto API | Zero-cost, offline-capable, browser-native |
| **Backend** | Flask, scikit-fuzzy, FPDF | Lightweight API with real fuzzy logic AI |
| **AI Chat** | Anthropic Claude API (claude-haiku-4-5-20251001) | Real LLM for tactical threat analysis |
| **Maps** | Leaflet + ESRI World Imagery + ISRO Bhuvan WMS | Real satellite tiles + Indian government GIS |
| **Database** | Supabase (PostgreSQL) | Persistent real-time threat event logging |
| **Alerts** | Telegram Bot API, Twilio SMS, Twilio WhatsApp | Multi-channel real-world alert dispatch |
| **Deploy** | Vercel (frontend + backend) | Free, auto-deploy, serverless Python |

## What's Real vs Simulated

| Real | Simulated |
|---------|--------------|
| SHA-256 + RSA-2048 cryptography | Camera feeds (Backgrounds are real video, bounding boxes simulated) |
| Fuzzy logic risk scoring (scikit-fuzzy) | Target behavior scripts |
| Web Speech/Audio API voice alerts | Tactical SMS text message drops |
| Interconnected State logic across modules | Complete threat response pipeline |
| ESRI + ISRO Bhuvan satellite map tiles | Threat scenarios (60-second scripts) |
| Claude AI Threat Analyst | -- |
| Telegram / Twilio real alerts | -- |
| Supabase persistent logging | -- |
| Live webcam feed (CAM-05) | -- |

## Live URLs

| Service | URL |
|---------|-----|
| **Frontend Live App** | [trinetra-rakshak-ssd.vercel.app](https://trinetra-rakshak-ssd.vercel.app) |
| **Backend API** | [backend-ten-fawn-25.vercel.app](https://backend-ten-fawn-25.vercel.app) |
| **Admin DB Viewer** | [backend-ten-fawn-25.vercel.app/admin/db](https://backend-ten-fawn-25.vercel.app/admin/db) |
| **GitHub** | [Drishtipixiee/trinetra-rakshak-ssd](https://github.com/Drishtipixiee/trinetra-rakshak-ssd) |

---

<div align="center">

**Built for India's defense and security infrastructure**

*Ministry of Defence -- India*

</div>
