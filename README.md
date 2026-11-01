# CITYBRAIN – AI SMART CITY SIMULATOR

> **Tagline:** *INTELLIGENCE FOR TOMORROW'S CITIES.*  
> **Demonstration City:** Chennai, Tamil Nadu, India

---

## 🌆 Overview

**CITYBRAIN** is an advanced, futuristic Smart City Simulator and AI Command Center designed for municipal urban planners, civic authorities, and researchers.

Built strictly with **pure Vanilla JavaScript (ES6+), HTML5, and CSS3** (no frontend frameworks, no backend servers, no build tools, no npm modules), CITYBRAIN models the intricate, interconnected civic ecosystems of **Chennai, India** across traffic congestion, air quality (AQI), water reservoir reserves, and power grid distribution.

---

## ⚡ Core Architecture & File Structure

All project files are located directly in the root directory:

```text
CityBrain/
├── index.html       # Main application markup & 9 modular views
├── style.css        # Futuristic command center styling & glassmorphism
├── script.js        # Core orchestrator, single-page routing, canvas animation
├── chatbot.js       # CITYBRAIN AI Assistant with intent classification & context
├── simulation.js    # Multi-variable mathematical what-if simulation engine
├── dashboard.js     # Real-time metric cards, telemetry, and Chart.js visualizations
├── maps.js          # Interactive Leaflet.js dark geospatial map of Chennai
├── data.js          # Realistic Chennai baseline metrics, arterial data, & zones
└── README.md        # Comprehensive documentation & launch guide
```

---

## 🚀 Key Modules & Capabilities

### 1. 📊 Main Dashboard & Civic Telemetry
- **6 Dynamic Metric Cards** with animated counter progression:
  - **Metropolitan Population:** 11.5M citizens
  - **Traffic Congestion:** 68% daylight baseline
  - **Air Quality Index (AQI):** 142 (Moderate / Sensitive alert)
  - **Daily Water Draw:** 985 MLD (Reservoir & Desalination balance)
  - **Electricity Demand:** 3,920 MW (Peak grid draw)
  - **Infrastructure Health Score:** 74 / 100
- **Live Visualizations (Powered by Chart.js CDN):**
  - 24-Hour Traffic Congestion Trend curve
  - Atmospheric Particulate AQI Profile
  - Hourly Water Flow Rate (MLD)
  - Peak Electricity Grid Draw with 4,500 MW distribution ceiling
  - Metropolitan Infrastructure Subsystems Radar chart

### 2. 🤖 CITYBRAIN AI Assistant
- Natural language intent classifier and entity detection engine.
- Runs **100% offline** with the built-in CityBrain Neural Rule Engine (zero API keys needed).
- Context-aware conversation memory (remembers mentioned zones and latest simulation findings).
- Typing animation, message timestamps, suggested query chips, and conversation persistence in `localStorage`.
- Optional configurable external LLM endpoint interface (supports custom OpenAI-compatible endpoints with privacy protection).

### 3. 🔬 What-If Simulation Engine (The Crown Jewel)
- Mathematical modeling of urban cascading systems with 6 policy sliders:
  1. **Population Growth %** (-10% to +50%)
  2. **Vehicle Usage %** (-40% to +50%)
  3. **Road Capacity %** (-20% to +50%)
  4. **Water Supply %** (-40% to +50%)
  5. **Electricity Demand %** (-30% to +50%)
  6. **Pollution Control %** (0% to +80%)
- **Dynamic Cascade Calculations:**
  - Evaluates non-linear vehicle factor ratios vs road capacity
  - Particulate matter emission and mitigation models
  - Per capita water deficits against Chembarambakkam & desalination yields
  - Substation saturation margins against TANGEDCO distribution limits
  - Multi-variable Infrastructure Pressure Score (0 - 100)
- **Side-by-side Before & After comparison bar chart**.
- **AI-generated analytical explanations and tailored strategic recommendations**.
- **Simulation Run History** saved automatically in `localStorage`.
- **Preset Scenarios:**
  - *🌱 Green Mobility Overhaul*
  - *⚡ OMR Tech Boom*
  - *☀️ Summer Heatwave Crisis*
  - *🚀 Autonomous Smart Grid 2030*

### 4. 🗺️ Interactive Chennai Geospatial Map
- Powered by **Leaflet.js CDN** with CartoDB Dark Matter retina cartography.
- 10 Monitored Chennai Hotspots:
  - **Anna Nagar**, **T. Nagar**, **Guindy**, **Velachery**, **Tambaram**, **Perambur**, **Adyar**, **OMR**, **Koyambedu**, and **Chennai Port**.
- Custom neon pulsating markers color-coded by congestion severity:
  - 🟢 **Green** (&lt;60% Congestion)
  - 🟡 **Yellow** (60% - 75% Congestion)
  - 🔴 **Red with Pulsing Beacon** (&gt;75% Severe Bottleneck)
- Clickable marker popups with live telemetry and a **Selected Zone Inspector** sidebar.
- Filter overlays for Traffic, Air Quality, Water Demand, and Electricity.

### 5. 🚦 Urban Domain Intelligence Views
- **Traffic Intelligence:** Live arterial corridor speeds (Anna Salai, OMR, Poonamallee High Rd, GST Rd), peak hour timeline, and interactive AI adaptive traffic signal simulation toggle.
- **Pollution Monitoring:** Emission composition breakdown donut chart, EPA AQI standard thresholds, and hotspot leaderboard.
- **Water Management:** Chembarambakkam, Poondi, and Red Hills reservoir storage vs capacity charts, plus an interactive Desalination Auxiliary Booster simulator.
- **Electricity Management:** TANGEDCO generation mix donut chart (Thermal, Wind, Solar, Nuclear), substation load analysis, and Smart Load-Shedding simulator.
- **AI Insights:** Real-time priority alerts, cross-domain cascading hazard analysis, and dynamic policy directives synchronized with active simulation results.

---

## 🎨 Futuristic UI Design Specifications

- **Color Scheme:** Dark cyber background (`#050811`, `#090e1c`), Neon Cyan (`#00f0ff`), Electric Blue (`#38bdf8`), Cyber Purple (`#a855f7`), Neon Green (`#10b981`), Warning Amber (`#fbbf24`), and Alert Red (`#f43f5e`).
- **Glassmorphism:** Frosted semi-transparent panels with `backdrop-filter: blur(14px)` and glowing neon borders.
- **Dynamic Background:** HTML5 Canvas rendering glowing road networks, pulsing intersection nodes, and moving traffic telemetry packets.
- **Typography:** Orbitron (futuristic headers), Rajdhani (digital telemetry readouts), and Inter (clean body text).
- **Responsive Layout:** Works smoothly on desktop workstations, tablets, and mobile smartphones with a slide-out drawer menu.

---

## 💻 How to Launch the Application

Because CityBrain is built exclusively with standard Web APIs (HTML5, CSS3, Vanilla ES6+):

### Option 1: Direct File Launch (Easiest)
1. Open your file manager and navigate to:
   ```
   C:\Users\gauth\.gemini\antigravity\scratch\CityBrain
   ```
2. Double-click **`index.html`** or right-click and choose **Open with Google Chrome** (or Edge, Firefox, Safari).
3. The simulator will immediately initialize with all features active.

### Option 2: Local HTTP Server (Optional)
If you prefer running via a local web server:
- Using Python:
  ```bash
  cd C:\Users\gauth\.gemini\antigravity\scratch\CityBrain
  python -m http.server 8000
  ```
  Then navigate to `http://localhost:8000` in your browser.

---

## 🛡️ Privacy & Security

- **Zero External Telemetry:** All simulation computations and chat models execute directly on your local device's JavaScript engine.
- **Safe Key Storage:** If a user specifies an optional external API endpoint, credentials remain strictly inside session memory or local browser storage and are never transmitted to third parties.
- **Simulated Data Notice:** All demonstration metrics are mathematical simulations calibrated for Chennai urban characteristics for education, planning, and portfolio demonstration.

---

*CityBrain – Intelligence for Tomorrow's Cities.*
