/**
 * CITYBRAIN - AI SMART CITY SIMULATOR
 * Core Orchestrator & Navigation (script.js)
 * 
 * Single-Page View Routing, Interactive Controls,
 * Dynamic AI Insights Generator, Animated Cyber City Canvas Background.
 */

// Navigation & View Routing
const CityBrainNav = {
    currentView: "overview",

    init() {
        const navItems = document.querySelectorAll(".nav-item");
        navItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();
                const targetView = item.getAttribute("data-view");
                if (targetView) {
                    this.switchView(targetView);
                }
            });
        });

        // Mobile drawer toggle
        const menuBtn = document.getElementById("mobile-menu-btn");
        const sidebar = document.querySelector(".app-sidebar");
        const overlay = document.getElementById("sidebar-overlay");

        if (menuBtn && sidebar) {
            menuBtn.addEventListener("click", () => {
                sidebar.classList.toggle("open");
                if (overlay) overlay.classList.toggle("active");
            });
        }

        if (overlay) {
            overlay.addEventListener("click", () => {
                sidebar.classList.remove("open");
                overlay.classList.remove("active");
            });
        }

        // Quick action links
        document.querySelectorAll("[data-navigate]").forEach(el => {
            el.addEventListener("click", (e) => {
                e.preventDefault();
                const view = el.getAttribute("data-navigate");
                this.switchView(view);
            });
        });
    },

    switchView(viewName) {
        if (!viewName) return;
        this.currentView = viewName;

        // Update active nav link
        document.querySelectorAll(".nav-item").forEach(item => {
            if (item.getAttribute("data-view") === viewName) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        // Update active view section
        document.querySelectorAll(".view-section").forEach(sec => {
            if (sec.id === `view-${viewName}`) {
                sec.classList.add("active");
                // Animate entrance
                sec.style.opacity = "0";
                setTimeout(() => {
                    sec.style.opacity = "1";
                }, 20);
            } else {
                sec.classList.remove("active");
            }
        });

        // Close mobile drawer if open
        const sidebar = document.querySelector(".app-sidebar");
        const overlay = document.getElementById("sidebar-overlay");
        if (sidebar && sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
            if (overlay) overlay.classList.remove("active");
        }

        // Special handling for Leaflet map render sizing
        if (viewName === "map" && window.CityMapEngine) {
            window.CityMapEngine.invalidate();
        }

        // Scroll to top of content
        const mainContent = document.querySelector(".main-content");
        if (mainContent) mainContent.scrollTop = 0;
    }
};

// AI Insights Generator & Alerts Manager
const InsightsEngine = {
    init() {
        this.renderAllInsights();
        this.bindScenarioButtons();
    },

    renderAllInsights(simData = null) {
        const base = window.CITY_DATA.baseline;
        const currentSim = simData || window.SimulationEngine.currentState;

        // 1. Critical City Alerts
        const alertsContainer = document.getElementById("insights-alerts-list");
        if (alertsContainer) {
            const alerts = [...window.CITY_DATA.alerts];
            // If simulation is severe, inject dynamic critical alert
            if (currentSim && currentSim.simulated.health < 60) {
                alerts.unshift({
                    id: "alt-sim-critical",
                    level: "CRITICAL",
                    type: "Simulation Warning",
                    title: `Simulated Civic Stress: Health Score ${currentSim.simulated.health}/100`,
                    detail: `Active simulation indicates high systemic vulnerability across Chennai water & power distribution.`,
                    time: "Active Scenario",
                    icon: "fa-triangle-exclamation"
                });
            }

            alertsContainer.innerHTML = alerts.map(a => `
                <div class="insight-alert-card level-${a.level.toLowerCase()}">
                    <div class="insight-alert-badge">${a.level}</div>
                    <div class="insight-alert-content">
                        <h4><i class="fa-solid ${a.icon}"></i> ${a.title}</h4>
                        <p>${a.detail}</p>
                        <span class="insight-alert-time">${a.time} • ${a.type}</span>
                    </div>
                </div>
            `).join("");
        }

        // 2. Domain Warnings Grid
        this.renderDomainWarnings(currentSim);

        // 3. Dynamic Action Recommendations
        this.renderDynamicRecommendations(currentSim);
    },

    renderDomainWarnings(sim) {
        const container = document.getElementById("insights-domain-warnings");
        if (!container) return;

        const base = window.CITY_DATA.baseline;
        const trafficVal = sim ? sim.simulated.traffic : base.trafficCongestion;
        const aqiVal = sim ? sim.simulated.aqi : base.aqi;
        const waterDeficit = sim ? sim.simulated.waterDeficit : (base.waterConsumptionMLD - base.waterSupplyCapacityMLD);
        const gridMargin = sim ? sim.simulated.gridReserveMargin : Math.round(((base.gridCapacityMW - base.electricityDemandMW) / base.gridCapacityMW) * 100);

        container.innerHTML = `
            <div class="domain-card ${trafficVal >= 80 ? 'border-red' : (trafficVal >= 65 ? 'border-yellow' : 'border-green')}">
                <div class="domain-icon"><i class="fa-solid fa-car"></i></div>
                <div class="domain-info">
                    <h5>Traffic Warning</h5>
                    <div class="domain-val">${trafficVal}% Congestion</div>
                    <p>${trafficVal >= 80 ? 'Severe bottle-necking along Kathipara, GST road and OMR. Average speed dropped to 14 km/h.' : 'Arterial flow within normal parameters.'}</p>
                </div>
            </div>

            <div class="domain-card ${aqiVal > 150 ? 'border-red' : (aqiVal > 100 ? 'border-yellow' : 'border-green')}">
                <div class="domain-icon"><i class="fa-solid fa-smog"></i></div>
                <div class="domain-info">
                    <h5>Air Quality Warning</h5>
                    <div class="domain-val">${aqiVal} AQI</div>
                    <p>${aqiVal > 150 ? 'Particulate PM2.5 elevated in industrial sectors and Parrys port gateway.' : 'Air index meets state health tolerance limits.'}</p>
                </div>
            </div>

            <div class="domain-card ${waterDeficit > 0 ? 'border-red' : 'border-green'}">
                <div class="domain-icon"><i class="fa-solid fa-water"></i></div>
                <div class="domain-info">
                    <h5>Water Shortage Warning</h5>
                    <div class="domain-val">${waterDeficit > 0 ? `Deficit: ${waterDeficit} MLD` : 'Surplus Supply'}</div>
                    <p>${waterDeficit > 0 ? 'Daily consumption outstrips combined storage and desalination output.' : 'Reservoir storage levels at 82% capacity.'}</p>
                </div>
            </div>

            <div class="domain-card ${gridMargin < 8 ? 'border-red' : (gridMargin < 15 ? 'border-yellow' : 'border-green')}">
                <div class="domain-icon"><i class="fa-solid fa-bolt"></i></div>
                <div class="domain-info">
                    <h5>Electricity Demand Warning</h5>
                    <div class="domain-val">${gridMargin}% Reserve Buffer</div>
                    <p>${gridMargin < 8 ? 'Critical transformer load at T. Nagar & OMR substations. Rolling load-shedding imminent.' : 'Grid frequency stable at 50.02 Hz.'}</p>
                </div>
            </div>
        `;
    },

    renderDynamicRecommendations(sim) {
        const container = document.getElementById("insights-recommendations-list");
        if (!container) return;

        let recs = [];
        if (sim && sim.analysis && sim.analysis.recommendations.length > 0) {
            recs = sim.analysis.recommendations;
        } else {
            recs = [
                "Synchronize 180 traffic lights along Anna Salai and Mount-Poonamallee Road with AI adaptive green waves.",
                "Enforce mandatory industrial dust suppression along North Chennai maritime and refinery corridors.",
                "Mandate smart greywater recycling tanks for all IT complexes and multi-family residential towers above 5 storeys.",
                "Expand rooftop solar feed-in tariff credits across industrial estates in Guindy, Ambattur, and Sriperumbudur."
            ];
        }

        container.innerHTML = recs.map((r, i) => `
            <div class="rec-card">
                <div class="rec-num">${i + 1}</div>
                <div class="rec-content">
                    <p class="rec-text">${r}</p>
                    <div class="rec-tag"><i class="fa-solid fa-circle-check text-green"></i> AI Priority Strategic Directive</div>
                </div>
            </div>
        `).join("");
    },

    refreshFromSimulation(simResult) {
        this.renderAllInsights(simResult);
    },

    bindScenarioButtons() {
        document.querySelectorAll(".btn-preset-scenario").forEach(btn => {
            btn.addEventListener("click", () => {
                const presetId = btn.getAttribute("data-preset");
                if (presetId && window.SimulationEngine) {
                    window.SimulationEngine.applyPreset(presetId);
                    CityBrainNav.switchView("simulator");
                }
            });
        });
    }
};

// Animated Smart City Canvas Background
const CyberCityCanvas = {
    canvas: null,
    ctx: null,
    nodes: [],
    trafficPackets: [],
    roads: [],
    width: 0,
    height: 0,

    init() {
        this.canvas = document.getElementById("city-bg-canvas");
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
        this.resize();
        this.generateCityGrid();

        window.addEventListener("resize", () => {
            this.resize();
            this.generateCityGrid();
        });

        this.animate();
    },

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    },

    generateCityGrid() {
        this.nodes = [];
        this.roads = [];
        this.trafficPackets = [];

        const cols = Math.floor(this.width / 140) + 2;
        const rows = Math.floor(this.height / 120) + 2;

        // Generate intersections
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                this.nodes.push({
                    x: i * 140 + (Math.sin(j * 0.5) * 20),
                    y: j * 120 + (Math.cos(i * 0.5) * 15),
                    pulse: Math.random() * Math.PI,
                    size: Math.random() > 0.8 ? 3 : 1.8
                });
            }
        }

        // Generate horizontal and vertical connecting roads
        for (let i = 0; i < cols - 1; i++) {
            for (let j = 0; j < rows; j++) {
                const n1 = this.nodes[i * rows + j];
                const n2 = this.nodes[(i + 1) * rows + j];
                if (n1 && n2) {
                    this.roads.push({ from: n1, to: n2 });
                }
            }
        }

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows - 1; j++) {
                const n1 = this.nodes[i * rows + j];
                const n2 = this.nodes[i * rows + (j + 1)];
                if (n1 && n2) {
                    this.roads.push({ from: n1, to: n2 });
                }
            }
        }

        // Create glowing moving traffic packets (cars / data telemetry)
        for (let k = 0; k < 45; k++) {
            const randomRoad = this.roads[Math.floor(Math.random() * this.roads.length)];
            this.trafficPackets.push({
                road: randomRoad,
                progress: Math.random(),
                speed: 0.003 + Math.random() * 0.006,
                color: Math.random() > 0.5 ? "#00f0ff" : (Math.random() > 0.5 ? "#a855f7" : "#10b981")
            });
        }
    },

    animate() {
        const render = () => {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Subtle dark grid overlay
            this.ctx.strokeStyle = "rgba(0, 240, 255, 0.035)";
            this.ctx.lineWidth = 1;

            // Draw roads
            this.roads.forEach(r => {
                this.ctx.beginPath();
                this.ctx.moveTo(r.from.x, r.from.y);
                this.ctx.lineTo(r.to.x, r.to.y);
                this.ctx.stroke();
            });

            // Draw intersection nodes
            this.nodes.forEach(n => {
                n.pulse += 0.02;
                const alpha = 0.2 + Math.sin(n.pulse) * 0.15;
                this.ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
                this.ctx.fill();
            });

            // Draw moving traffic packets with glowing heads
            this.trafficPackets.forEach(p => {
                p.progress += p.speed;
                if (p.progress >= 1) {
                    p.progress = 0;
                    p.road = this.roads[Math.floor(Math.random() * this.roads.length)];
                }

                if (p.road) {
                    const curX = p.road.from.x + (p.road.to.x - p.road.from.x) * p.progress;
                    const curY = p.road.from.y + (p.road.to.y - p.road.from.y) * p.progress;

                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowColor = p.color;
                    this.ctx.fillStyle = p.color;
                    this.ctx.beginPath();
                    this.ctx.arc(curX, curY, 2.2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0; // reset
                }
            });

            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }
};

// Interactive Features across Specific Domain Tabs
const DomainFeatures = {
    init() {
        // Traffic: AI Adaptive Signal Control Toggle
        const toggleSignal = document.getElementById("toggle-adaptive-signals");
        if (toggleSignal) {
            toggleSignal.addEventListener("change", (e) => {
                const statusTag = document.getElementById("adaptive-signal-status");
                const impactBox = document.getElementById("adaptive-signal-impact");
                if (e.target.checked) {
                    if (statusTag) {
                        statusTag.innerText = "ACTIVE: AI Synchronized Corridor";
                        statusTag.className = "badge badge-green";
                    }
                    if (impactBox) {
                        impactBox.innerHTML = `<strong>🟢 Adaptive Control Engaged:</strong> 180 signals synchronized. Corridor average speed increased by <strong>+14%</strong>. Kathipara bottleneck delays reduced by 12 minutes.`;
                    }
                } else {
                    if (statusTag) {
                        statusTag.innerText = "STANDBY: Fixed Timer Cycles";
                        statusTag.className = "badge badge-yellow";
                    }
                    if (impactBox) {
                        impactBox.innerHTML = `<strong>🟡 Fixed Timing:</strong> Standard pre-programmed signal delays. Peak congestion likely during shift changes.`;
                    }
                }
            });
        }

        // Water: Desalination Plant Boost Toggle
        const btnWaterBoost = document.getElementById("btn-water-desal-boost");
        if (btnWaterBoost) {
            btnWaterBoost.addEventListener("click", () => {
                const note = document.getElementById("water-boost-output");
                if (note) {
                    note.innerHTML = `
                        <div class="alert-item alert-info mt-2">
                            <i class="fa-solid fa-water text-cyan"></i>
                            <div>
                                <strong>Desalination Aux Booster Engaged:</strong> Pumping Nemmeli & Minjur auxiliary reserves at +45 MLD. Southern pipeline pressure stabilized.
                            </div>
                        </div>
                    `;
                }
            });
        }

        // Electricity: Smart Load Shedding Simulator
        const btnLoadShed = document.getElementById("btn-sim-load-shed");
        if (btnLoadShed) {
            btnLoadShed.addEventListener("click", () => {
                const out = document.getElementById("load-shed-output");
                if (out) {
                    out.innerHTML = `
                        <div class="alert-item alert-warning mt-2">
                            <i class="fa-solid fa-bolt text-yellow"></i>
                            <div>
                                <strong>Smart Micro-Grid Load Shedding Active:</strong> Non-essential decorative & municipal pump loads delayed. 110 MW peak shaved from TANGEDCO Central Grid.
                            </div>
                        </div>
                    `;
                }
            });
        }
    }
};

// Global App Initialization
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing CITYBRAIN AI SMART CITY SIMULATOR...");

    // 1. Start background animation
    CyberCityCanvas.init();

    // 2. Initialize Navigation
    CityBrainNav.init();

    // 3. Initialize Dashboard & Charts
    if (window.Dashboard) {
        window.Dashboard.init();
    }

    // 4. Initialize Interactive Leaflet Map
    if (window.CityMapEngine) {
        window.CityMapEngine.init();
    }

    // 5. Initialize What-If Simulation Engine
    if (window.SimulationEngine) {
        window.SimulationEngine.init();
    }

    // 6. Initialize Chatbot
    if (window.CityBrainChatbot) {
        window.CityBrainChatbot.init();
    }

    // 7. Initialize AI Insights
    if (window.InsightsEngine) {
        InsightsEngine.init();
    }

    // 8. Domain specific interactive controls
    DomainFeatures.init();

    console.log("CITYBRAIN fully initialized and operational.");
});

// Global exports
window.CityBrainNav = CityBrainNav;
window.InsightsEngine = InsightsEngine;
