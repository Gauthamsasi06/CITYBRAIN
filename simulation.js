/**
 * CITYBRAIN - AI SMART CITY SIMULATOR
 * Simulation Engine (simulation.js)
 * 
 * Mathematical modeling of urban cascading systems:
 * Population dynamics, vehicular density, atmospheric particulate emission,
 * water deficit ratios, power grid strain, and infrastructure pressure index.
 */

const SimulationEngine = {
    // Current active simulation state
    currentState: null,
    comparisonChart: null,

    // Mathematical formula evaluator
    compute(inputs) {
        const base = window.CITY_DATA.baseline;
        
        // Input values (Percentages from sliders)
        const popPct = parseFloat(inputs.population) || 0;
        const vehPct = parseFloat(inputs.vehicleUsage) || 0;
        const capPct = parseFloat(inputs.roadCapacity) || 0;
        const watPct = parseFloat(inputs.waterSupply) || 0;
        const elePct = parseFloat(inputs.electricityDemand) || 0;
        const polPct = parseFloat(inputs.pollutionControl) || 0;

        // 1. POPULATION IMPACT
        const simPopulation = Math.round(base.population * (1 + popPct / 100));

        // 2. TRAFFIC CONGESTION (%)
        // Traffic grows with vehicles directly, plus partial population spillover, divided by road capacity
        const vehicleFactor = (1 + vehPct / 100) * (1 + (popPct * 0.42) / 100);
        const capacityFactor = Math.max(0.4, 1 + capPct / 100);
        const trafficRatio = vehicleFactor / capacityFactor;
        let simTraffic = Math.round(base.trafficCongestion * trafficRatio);
        simTraffic = Math.min(99, Math.max(12, simTraffic)); // Clamp to realistic 12% - 99%
        const trafficDelta = simTraffic - base.trafficCongestion;
        const trafficPctChange = ((trafficDelta / base.trafficCongestion) * 100).toFixed(1);

        // 3. AIR QUALITY INDEX (AQI)
        // Vehicular exhaust (primary urban PM2.5/NOx in Chennai), industrial/power emission, scaled by population, mitigated by pollution controls
        const vehicleEmissionFactor = 1 + (vehPct * 0.52) / 100;
        const industrialPowerFactor = 1 + (elePct * 0.22) / 100;
        const popUrbanFactor = 1 + (popPct * 0.25) / 100;
        const pollutionControlFactor = Math.max(0.2, 1 - (polPct * 0.65) / 100);

        let simAQI = Math.round(base.aqi * vehicleEmissionFactor * industrialPowerFactor * popUrbanFactor * pollutionControlFactor);
        simAQI = Math.min(480, Math.max(25, simAQI));
        const aqiDelta = simAQI - base.aqi;
        const aqiPctChange = ((aqiDelta / base.aqi) * 100).toFixed(1);

        // 4. WATER DEMAND & CAPACITY (MLD)
        // Per capita consumption scaled by population and commercial activity
        const waterDemandGrowth = (popPct * 0.94) / 100 + (vehPct * 0.04) / 100;
        const simWaterDemand = Math.round(base.waterConsumptionMLD * (1 + waterDemandGrowth));
        const simWaterSupply = Math.round(base.waterSupplyCapacityMLD * (1 + watPct / 100));
        const waterDeficit = simWaterDemand - simWaterSupply;
        const waterDelta = simWaterDemand - base.waterConsumptionMLD;
        const waterPctChange = ((waterDelta / base.waterConsumptionMLD) * 100).toFixed(1);

        // 5. ELECTRICITY DEMAND & GRID STRESS (MW)
        // Base residential draw from population + commercial/industrial modifier
        const eleDemandGrowth = (popPct * 0.65) / 100 + (elePct * 0.85) / 100;
        const simElectricity = Math.round(base.electricityDemandMW * (1 + eleDemandGrowth));
        const eleDelta = simElectricity - base.electricityDemandMW;
        const elePctChange = ((eleDelta / base.electricityDemandMW) * 100).toFixed(1);
        const gridReserveMargin = Math.round(((base.gridCapacityMW - simElectricity) / base.gridCapacityMW) * 100);

        // 6. INFRASTRUCTURE COMPOSITE HEALTH SCORE (0 - 100)
        // Negative penalties for severe congestion, hazardous AQI, water deficit, and power grid saturation
        const trafficStress = (simTraffic / 100) * 35; // 35 pts weight
        const aqiStress = Math.min(1, simAQI / 300) * 20; // 20 pts weight
        const waterStressRatio = Math.max(0, waterDeficit / simWaterDemand);
        const waterStress = Math.min(25, waterStressRatio * 50); // 25 pts weight
        const gridStress = Math.max(0, (simElectricity - 3500) / 1000) * 20; // 20 pts weight

        const totalStress = trafficStress + aqiStress + waterStress + gridStress;
        let simHealth = Math.round(100 - totalStress);
        simHealth = Math.min(98, Math.max(15, simHealth));
        const healthDelta = simHealth - base.infrastructureHealth;
        const healthPctChange = ((healthDelta / base.infrastructureHealth) * 100).toFixed(1);

        // Synthesize dynamic AI explanations and recommendations
        const analysis = this.generateAIAnalysis({
            inputs,
            popPct, vehPct, capPct, watPct, elePct, polPct,
            simPopulation, simTraffic, trafficDelta,
            simAQI, aqiDelta,
            simWaterDemand, simWaterSupply, waterDeficit,
            simElectricity, gridReserveMargin,
            simHealth, healthDelta
        });

        return {
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            inputs: { popPct, vehPct, capPct, watPct, elePct, polPct },
            baseline: {
                population: base.population,
                traffic: base.trafficCongestion,
                aqi: base.aqi,
                waterDemand: base.waterConsumptionMLD,
                waterSupply: base.waterSupplyCapacityMLD,
                electricity: base.electricityDemandMW,
                health: base.infrastructureHealth
            },
            simulated: {
                population: simPopulation,
                traffic: simTraffic,
                aqi: simAQI,
                waterDemand: simWaterDemand,
                waterSupply: simWaterSupply,
                waterDeficit: waterDeficit,
                electricity: simElectricity,
                gridReserveMargin: gridReserveMargin,
                health: simHealth
            },
            deltas: {
                traffic: trafficDelta,
                trafficPct: trafficPctChange,
                aqi: aqiDelta,
                aqiPct: aqiPctChange,
                water: waterDelta,
                waterPct: waterPctChange,
                electricity: eleDelta,
                electricityPct: elePctChange,
                health: healthDelta,
                healthPct: healthPctChange
            },
            analysis: analysis
        };
    },

    // Dynamic AI Analysis Generator based on calculated thresholds
    generateAIAnalysis(d) {
        const findings = [];
        const recommendations = [];

        // Traffic narrative
        if (d.simTraffic >= 85) {
            findings.push(`🚨 **Critical Gridlock Warning:** Congestion escalated to ${d.simTraffic}%. Corridors like Anna Salai, GST Road, and Kathipara flyover risk multi-hour delays.`);
            recommendations.push("Implement odd-even freight curfews and expand dedicated bus rapid transit lanes across Anna Salai and OMR.");
        } else if (d.simTraffic <= 50) {
            findings.push(`✅ **Traffic Fluidity Optimal:** Congestion lowered to ${d.simTraffic}%, cutting commuter travel times by an estimated 28%.`);
            recommendations.push("Reinforce micro-mobility hubs near Chennai Metro stations to sustain low private vehicle dependency.");
        } else {
            findings.push(`ℹ️ **Moderate Flow:** Congestion stabilizes at ${d.simTraffic}%, with peak hour slowdowns confined to primary nodal junctions.`);
            recommendations.push("Optimize AI synchronized signal cycles at Guindy and Koyambedu intersections.");
        }

        // Air Quality narrative
        if (d.simAQI > 200) {
            findings.push(`☣️ **Severe Atmospheric Hazard:** AQI projected at ${d.simAQI} (Very Unhealthy). High particulate saturation poses critical pulmonary risks across urban catchments.`);
            recommendations.push("Enact emergency industrial emission ceilings and activate automated dust suppression water mist cannons along construction arterials.");
        } else if (d.simAQI < 100) {
            findings.push(`🌿 **Clean Air Milestone:** AQI lowered to ${d.simAQI} (Satisfactory/Good). Airborne particulate volume drops significantly.`);
            recommendations.push("Expand Chennai's Miyawaki urban forest coverage and electric public bus fleet to lock in air quality gains.");
        } else {
            findings.push(`⚠️ **Moderate Air Burden:** AQI projected at ${d.simAQI}. Sensitive populations in central districts will encounter mild respiratory stress.`);
            recommendations.push("Mandate EV transition incentives for auto-rickshaws and delivery fleets operating inside T. Nagar and Parrys.");
        }

        // Water Balance narrative
        if (d.waterDeficit > 0) {
            findings.push(`💧 **Water Deficit Alert:** Consumption reaches ${d.simWaterDemand} MLD against ${d.simWaterSupply} MLD supply, creating a ${d.waterDeficit} MLD daily shortfall.`);
            recommendations.push("Accelerate extraction from Nemmeli-3 desalination plant and mandate smart metering with greywater recycling in high-rise tech parks.");
        } else {
            findings.push(`💧 **Hydrological Surplus:** Chennai reservoirs and desalination output provide a surplus margin of ${Math.abs(d.waterDeficit)} MLD.`);
            recommendations.push("Channel surplus output into lake rejuvenation projects at Porur, Chembarambakkam, and Pallikaranai wetlands.");
        }

        // Electricity & Grid narrative
        if (d.gridReserveMargin < 5) {
            findings.push(`⚡ **Grid Overload Crisis:** Electricity draw surges to ${d.simElectricity} MW, shrinking Chennai's distribution reserve margin to ${d.gridReserveMargin}%.`);
            recommendations.push("Institute automated commercial peak-load shaving and activate industrial captive power generation buffers between 6 PM and 10 PM.");
        } else {
            findings.push(`⚡ **Grid Stability Maintained:** Electricity demand at ${d.simElectricity} MW maintains a healthy ${d.gridReserveMargin}% reserve buffer.`);
            recommendations.push("Incentivize commercial rooftop solar installation to boost daytime feed-in tariffs.");
        }

        // Infrastructure composite summary
        let overallVerdict = "";
        if (d.simHealth < 50) {
            overallVerdict = "CRITICAL URBAN STRESS: The simulated parameters induce compound failures across civic infrastructure. Immediate municipal intervention required.";
        } else if (d.simHealth < 75) {
            overallVerdict = "ELEVATED CIVIC PRESSURE: City infrastructure operates under sustained load. Targeted investments in transit and water security will prevent systemic degradation.";
        } else {
            overallVerdict = "RESILIENT & SUSTAINABLE: Urban ecosystem metrics demonstrate robust resilience with high livability indicators.";
        }

        return {
            verdict: overallVerdict,
            findings: findings,
            recommendations: recommendations
        };
    },

    // UI Handler: Read inputs from DOM and execute simulation
    runSimulationFromUI() {
        const inputs = {
            population: document.getElementById("sim-pop-slider") ? document.getElementById("sim-pop-slider").value : 0,
            vehicleUsage: document.getElementById("sim-veh-slider") ? document.getElementById("sim-veh-slider").value : 0,
            roadCapacity: document.getElementById("sim-cap-slider") ? document.getElementById("sim-cap-slider").value : 0,
            waterSupply: document.getElementById("sim-wat-slider") ? document.getElementById("sim-wat-slider").value : 0,
            electricityDemand: document.getElementById("sim-ele-slider") ? document.getElementById("sim-ele-slider").value : 0,
            pollutionControl: document.getElementById("sim-pol-slider") ? document.getElementById("sim-pol-slider").value : 0
        };

        const result = this.compute(inputs);
        this.currentState = result;

        // Persist to local storage
        window.StorageManager.save(window.StorageManager.KEYS.ACTIVE_SCENARIO, result);
        this.appendHistory(result);

        // Render UI Results
        this.renderSimulationResults(result);

        // Notify other components if active
        if (window.Dashboard && typeof window.Dashboard.refreshFromSimulation === "function") {
            window.Dashboard.refreshFromSimulation(result);
        }
        if (window.InsightsEngine && typeof window.InsightsEngine.refreshFromSimulation === "function") {
            window.InsightsEngine.refreshFromSimulation(result);
        }

        // Trigger custom event
        window.dispatchEvent(new CustomEvent("citybrain:simulated", { detail: result }));
        return result;
    },

    // Render simulation results into the DOM
    renderSimulationResults(res) {
        const container = document.getElementById("sim-results-container");
        if (!container) return;

        // Populate metric cards
        const updateElem = (id, text, className) => {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = text;
                if (className) el.className = className;
            }
        };

        // Format numbers
        const fmt = (n) => n.toLocaleString();

        // 1. Traffic
        updateElem("res-traffic-cur", `${res.baseline.traffic}%`);
        updateElem("res-traffic-sim", `${res.simulated.traffic}%`);
        updateElem("res-traffic-diff", `${res.deltas.traffic >= 0 ? "+" : ""}${res.deltas.trafficPct}%`, 
            res.deltas.traffic > 0 ? "metric-delta delta-negative" : "metric-delta delta-positive");

        // 2. AQI
        updateElem("res-aqi-cur", `${res.baseline.aqi}`);
        updateElem("res-aqi-sim", `${res.simulated.aqi}`);
        updateElem("res-aqi-diff", `${res.deltas.aqi >= 0 ? "+" : ""}${res.deltas.aqiPct}%`, 
            res.deltas.aqi > 0 ? "metric-delta delta-negative" : "metric-delta delta-positive");

        // 3. Water
        updateElem("res-water-cur", `${fmt(res.baseline.waterDemand)} MLD`);
        updateElem("res-water-sim", `${fmt(res.simulated.waterDemand)} MLD`);
        updateElem("res-water-diff", `${res.deltas.water >= 0 ? "+" : ""}${res.deltas.waterPct}%`, 
            res.deltas.water > 0 ? "metric-delta delta-negative" : "metric-delta delta-positive");

        // 4. Electricity
        updateElem("res-ele-cur", `${fmt(res.baseline.electricity)} MW`);
        updateElem("res-ele-sim", `${fmt(res.simulated.electricity)} MW`);
        updateElem("res-ele-diff", `${res.deltas.electricity >= 0 ? "+" : ""}${res.deltas.electricityPct}%`, 
            res.deltas.electricity > 0 ? "metric-delta delta-negative" : "metric-delta delta-positive");

        // 5. Health Score
        updateElem("res-health-cur", `${res.baseline.health} / 100`);
        updateElem("res-health-sim", `${res.simulated.health} / 100`);
        updateElem("res-health-diff", `${res.deltas.health >= 0 ? "+" : ""}${res.deltas.healthPct}%`, 
            res.deltas.health < 0 ? "metric-delta delta-negative" : "metric-delta delta-positive");

        // Verdict & Narratives
        const verdictEl = document.getElementById("sim-ai-verdict");
        if (verdictEl) {
            verdictEl.innerText = res.analysis.verdict;
            verdictEl.className = res.simulated.health < 50 ? "verdict-critical" : (res.simulated.health < 75 ? "verdict-warning" : "verdict-positive");
        }

        const findingsList = document.getElementById("sim-ai-findings");
        if (findingsList) {
            findingsList.innerHTML = res.analysis.findings
                .map(f => `<li class="analysis-item">${this.formatMarkdownInline(f)}</li>`)
                .join("");
        }

        const recsList = document.getElementById("sim-ai-recommendations");
        if (recsList) {
            recsList.innerHTML = res.analysis.recommendations
                .map(r => `<li class="rec-item"><i class="fa-solid fa-lightbulb text-cyan"></i> <span>${r}</span></li>`)
                .join("");
        }

        // Render Before/After Comparison Chart
        this.renderComparisonChart(res);

        // Refresh History List in UI
        this.renderHistoryList();
    },

    formatMarkdownInline(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    },

    // Chart.js Before vs After Visualizer
    renderComparisonChart(res) {
        const ctx = document.getElementById("simComparisonChart");
        if (!ctx) return;
        if (typeof Chart === "undefined") return;

        // Normalized 0-100 values for clean bar comparison
        const labels = ["Traffic (%)", "AQI (Scaled/3)", "Water (MLD/15)", "Electricity (MW/50)", "City Health (100)"];
        const baselineData = [
            res.baseline.traffic,
            Math.round(res.baseline.aqi / 3),
            Math.round(res.baseline.waterDemand / 15),
            Math.round(res.baseline.electricity / 50),
            res.baseline.health
        ];
        const simulatedData = [
            res.simulated.traffic,
            Math.round(res.simulated.aqi / 3),
            Math.round(res.simulated.waterDemand / 15),
            Math.round(res.simulated.electricity / 50),
            res.simulated.health
        ];

        if (this.comparisonChart) {
            this.comparisonChart.data.datasets[0].data = baselineData;
            this.comparisonChart.data.datasets[1].data = simulatedData;
            this.comparisonChart.update();
            return;
        }

        this.comparisonChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Current Baseline",
                        data: baselineData,
                        backgroundColor: "rgba(56, 189, 248, 0.4)",
                        borderColor: "#38bdf8",
                        borderWidth: 1.5,
                        borderRadius: 4
                    },
                    {
                        label: "Simulated Scenario",
                        data: simulatedData,
                        backgroundColor: "rgba(168, 85, 247, 0.6)",
                        borderColor: "#a855f7",
                        borderWidth: 1.5,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: "#94a3b8", font: { family: "Rajdhani, sans-serif", size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: "#0f172a",
                        borderColor: "rgba(0, 240, 255, 0.4)",
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: "rgba(255, 255, 255, 0.05)" },
                        ticks: { color: "#94a3b8" }
                    },
                    y: {
                        beginAtZero: true,
                        max: 120,
                        grid: { color: "rgba(255, 255, 255, 0.05)" },
                        ticks: { color: "#94a3b8" }
                    }
                }
            }
        });
    },

    // Preset loader
    applyPreset(presetId) {
        const preset = window.CITY_DATA.presets.find(p => p.id === presetId);
        if (!preset) return;

        const setSlider = (id, val) => {
            const el = document.getElementById(id);
            const display = document.getElementById(`${id}-val`);
            if (el) {
                el.value = val;
                if (display) display.innerText = `${val >= 0 ? "+" : ""}${val}%`;
            }
        };

        setSlider("sim-pop-slider", preset.params.population);
        setSlider("sim-veh-slider", preset.params.vehicleUsage);
        setSlider("sim-cap-slider", preset.params.roadCapacity);
        setSlider("sim-wat-slider", preset.params.waterSupply);
        setSlider("sim-ele-slider", preset.params.electricityDemand);
        setSlider("sim-pol-slider", preset.params.pollutionControl);

        this.runSimulationFromUI();
    },

    // Reset sliders to baseline (0%)
    resetSliders() {
        const sliders = [
            "sim-pop-slider", "sim-veh-slider", "sim-cap-slider",
            "sim-wat-slider", "sim-ele-slider", "sim-pol-slider"
        ];
        sliders.forEach(id => {
            const el = document.getElementById(id);
            const display = document.getElementById(`${id}-val`);
            if (el) {
                el.value = 0;
                if (display) display.innerText = "0%";
            }
        });
        this.runSimulationFromUI();
    },

    // History tracking via LocalStorage
    appendHistory(result) {
        const history = window.StorageManager.load(window.StorageManager.KEYS.SIM_HISTORY, []);
        // Keep latest 10 simulations
        history.unshift({
            id: "sim-" + Date.now(),
            time: result.timestamp,
            date: result.date,
            inputs: result.inputs,
            health: result.simulated.health,
            traffic: result.simulated.traffic,
            aqi: result.simulated.aqi
        });
        const trimmed = history.slice(0, 10);
        window.StorageManager.save(window.StorageManager.KEYS.SIM_HISTORY, trimmed);
    },

    getHistory() {
        return window.StorageManager.load(window.StorageManager.KEYS.SIM_HISTORY, []);
    },

    clearHistory() {
        window.StorageManager.save(window.StorageManager.KEYS.SIM_HISTORY, []);
        this.renderHistoryList();
    },

    renderHistoryList() {
        const container = document.getElementById("sim-history-list");
        if (!container) return;

        const history = this.getHistory();
        if (history.length === 0) {
            container.innerHTML = `<div class="history-empty">No simulations logged yet. Adjust parameters and click "Execute Simulation".</div>`;
            return;
        }

        container.innerHTML = history.map((item, index) => `
            <div class="history-item">
                <div class="history-meta">
                    <span class="history-time"><i class="fa-regular fa-clock"></i> ${item.time}</span>
                    <span class="history-health ${item.health >= 70 ? 'text-green' : (item.health >= 50 ? 'text-yellow' : 'text-red')}">
                        Score: ${item.health}/100
                    </span>
                </div>
                <div class="history-params">
                    <span>Pop: ${item.inputs.popPct >= 0 ? '+' : ''}${item.inputs.popPct}%</span>
                    <span>Veh: ${item.inputs.vehPct >= 0 ? '+' : ''}${item.inputs.vehPct}%</span>
                    <span>AQI: ${item.aqi}</span>
                    <span>Cong: ${item.traffic}%</span>
                </div>
            </div>
        `).join("");
    },

    // Initialize UI listeners
    init() {
        const sliders = [
            "sim-pop-slider", "sim-veh-slider", "sim-cap-slider",
            "sim-wat-slider", "sim-ele-slider", "sim-pol-slider"
        ];

        sliders.forEach(id => {
            const el = document.getElementById(id);
            const display = document.getElementById(`${id}-val`);
            if (el && display) {
                el.addEventListener("input", (e) => {
                    const val = e.target.value;
                    display.innerText = `${val >= 0 ? "+" : ""}${val}%`;
                });
            }
        });

        const btnSimulate = document.getElementById("btn-run-simulation");
        if (btnSimulate) {
            btnSimulate.addEventListener("click", () => this.runSimulationFromUI());
        }

        const btnReset = document.getElementById("btn-reset-simulation");
        if (btnReset) {
            btnReset.addEventListener("click", () => this.resetSliders());
        }

        const btnClearHist = document.getElementById("btn-clear-sim-history");
        if (btnClearHist) {
            btnClearHist.addEventListener("click", () => this.clearHistory());
        }

        // Run baseline simulation initially
        this.runSimulationFromUI();
    }
};

window.SimulationEngine = SimulationEngine;
