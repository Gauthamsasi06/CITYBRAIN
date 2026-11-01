/**
 * CITYBRAIN - AI SMART CITY SIMULATOR
 * Dashboard & Visualization Engine (dashboard.js)
 * 
 * Chart.js CDN visualizers:
 * - Traffic Trend Chart
 * - Air Quality & Pollution Trend Chart
 * - Water Consumption vs Reservoir Yield Chart
 * - Electricity Demand & Grid Load Chart
 * - Metropolitan Infrastructure Radar & Comparison Chart
 */

const Dashboard = {
    charts: {},

    init() {
        this.startClock();
        this.renderMetricCards();
        this.initAllCharts();
        this.renderSubsystemsTable();
        this.renderAlertsList();
        this.renderArterialsTable();
        this.renderHotspotsList();
    },

    // Real-time digital clock (IST - Chennai)
    startClock() {
        const update = () => {
            const clockEl = document.getElementById("live-clock");
            if (clockEl) {
                const now = new Date();
                clockEl.innerText = now.toLocaleTimeString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }) + " IST";
            }
        };
        update();
        setInterval(update, 1000);
    },

    // Populate baseline metric cards with animated numbers
    renderMetricCards(simResult = null) {
        const base = window.CITY_DATA.baseline;
        const data = simResult ? simResult.simulated : base;

        // Animate counter
        const animateValue = (id, target, suffix = "", prefix = "") => {
            const el = document.getElementById(id);
            if (!el) return;
            const current = parseFloat(el.getAttribute("data-val") || 0);
            const duration = 600;
            const start = performance.now();

            const step = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const val = Math.round(current + (target - current) * progress);
                el.innerText = `${prefix}${val.toLocaleString()}${suffix}`;
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    el.setAttribute("data-val", target);
                }
            };
            requestAnimationFrame(step);
        };

        // 1. Population (11.5M)
        const popM = (data.population / 1000000).toFixed(2);
        const popEl = document.getElementById("metric-pop-val");
        if (popEl) popEl.innerText = `${popM}M`;

        // 2. Traffic Congestion
        animateValue("metric-traffic-val", data.traffic || data.trafficCongestion, "%");
        const trafficProgress = document.getElementById("metric-traffic-bar");
        if (trafficProgress) {
            trafficProgress.style.width = `${data.traffic || data.trafficCongestion}%`;
            trafficProgress.className = (data.traffic || data.trafficCongestion) > 80 ? "progress-fill bg-red" : "progress-fill bg-cyan";
        }

        // 3. AQI
        animateValue("metric-aqi-val", data.aqi);
        const aqiProgress = document.getElementById("metric-aqi-bar");
        if (aqiProgress) {
            const aqiVal = data.aqi;
            const pct = Math.min(100, Math.round((aqiVal / 300) * 100));
            aqiProgress.style.width = `${pct}%`;
            aqiProgress.className = aqiVal > 150 ? "progress-fill bg-red" : (aqiVal > 100 ? "progress-fill bg-yellow" : "progress-fill bg-green");
        }

        // 4. Water
        animateValue("metric-water-val", data.waterDemand || data.waterConsumptionMLD, " MLD");
        const waterProgress = document.getElementById("metric-water-bar");
        if (waterProgress) {
            const wVal = data.waterDemand || data.waterConsumptionMLD;
            const wPct = Math.min(100, Math.round((wVal / 1200) * 100));
            waterProgress.style.width = `${wPct}%`;
        }

        // 5. Electricity
        animateValue("metric-electricity-val", data.electricity || data.electricityDemandMW, " MW");
        const eleProgress = document.getElementById("metric-ele-bar");
        if (eleProgress) {
            const eVal = data.electricity || data.electricityDemandMW;
            const ePct = Math.min(100, Math.round((eVal / 4500) * 100));
            eleProgress.style.width = `${ePct}%`;
        }

        // 6. Health
        animateValue("metric-health-val", data.health || data.infrastructureHealth, "/100");
        const healthRing = document.getElementById("metric-health-bar");
        if (healthRing) {
            const hVal = data.health || data.infrastructureHealth;
            healthRing.style.width = `${hVal}%`;
            healthRing.className = hVal < 50 ? "progress-fill bg-red" : (hVal < 75 ? "progress-fill bg-yellow" : "progress-fill bg-green");
        }
    },

    // Refresh dashboard if a simulation is executed
    refreshFromSimulation(simResult) {
        this.renderMetricCards(simResult);
        this.updateChartsWithSimulation(simResult);
    },

    // Initialize all Chart.js instances
    initAllCharts() {
        if (typeof Chart === "undefined") {
            console.warn("Chart.js is not loaded. Skipping chart initializations.");
            return;
        }

        const hourly = window.CITY_DATA.hourlyProfile;

        // Global Chart Defaults
        Chart.defaults.color = "#94a3b8";
        Chart.defaults.font.family = "'Rajdhani', 'Inter', sans-serif";

        // 1. Traffic Trend Line Chart
        this.initTrafficTrendChart(hourly);

        // 2. Pollution Trend Chart
        this.initPollutionTrendChart(hourly);

        // 3. Water Consumption Chart
        this.initWaterChart(hourly);

        // 4. Electricity Demand Chart
        this.initElectricityChart(hourly);

        // 5. Infrastructure Comparison Radar Chart
        this.initInfrastructureRadar();

        // 6. Traffic Intelligence Page: Arterial Congestion Bar Chart
        this.initArterialChart();

        // 7. Pollution Page: AQI Breakdown Donut Chart
        this.initPollutionDonut();

        // 8. Water Page: Reservoir Storage Comparison Bar Chart
        this.initReservoirChart();

        // 9. Electricity Page: Energy Mix Donut Chart
        this.initEnergyMixChart();
    },

    // 1. Overview Traffic Chart
    initTrafficTrendChart(hourly) {
        const ctx = document.getElementById("overviewTrafficChart");
        if (!ctx) return;

        this.charts.traffic = new Chart(ctx, {
            type: "line",
            data: {
                labels: hourly.labels,
                datasets: [
                    {
                        label: "Congestion Index (%)",
                        data: [...hourly.traffic],
                        borderColor: "#00f0ff",
                        backgroundColor: "rgba(0, 240, 255, 0.12)",
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: "#00f0ff",
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: "Safe Threshold (65%)",
                        data: hourly.labels.map(() => 65),
                        borderColor: "rgba(244, 63, 94, 0.6)",
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: this.getChartOptions("Congestion (%)", 100)
        });
    },

    // 2. Pollution Trend Chart
    initPollutionTrendChart(hourly) {
        const ctx = document.getElementById("overviewPollutionChart");
        if (!ctx) return;

        this.charts.pollution = new Chart(ctx, {
            type: "line",
            data: {
                labels: hourly.labels,
                datasets: [
                    {
                        label: "Metropolitan AQI",
                        data: [...hourly.aqi],
                        borderColor: "#fbbf24",
                        backgroundColor: "rgba(251, 191, 36, 0.12)",
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: "#fbbf24",
                        pointRadius: 4
                    },
                    {
                        label: "Moderate Clean Ceiling (100)",
                        data: hourly.labels.map(() => 100),
                        borderColor: "rgba(16, 185, 129, 0.6)",
                        borderDash: [4, 4],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: this.getChartOptions("AQI Value", 220)
        });
    },

    // 3. Water Consumption Chart
    initWaterChart(hourly) {
        const ctx = document.getElementById("overviewWaterChart");
        if (!ctx) return;

        this.charts.water = new Chart(ctx, {
            type: "bar",
            data: {
                labels: hourly.labels,
                datasets: [
                    {
                        label: "Hourly Water Draw (MLD Rate)",
                        data: [...hourly.water],
                        backgroundColor: "rgba(56, 189, 248, 0.55)",
                        borderColor: "#38bdf8",
                        borderWidth: 1.5,
                        borderRadius: 4
                    }
                ]
            },
            options: this.getChartOptions("Rate (MLD)", 1300)
        });
    },

    // 4. Electricity Demand Chart
    initElectricityChart(hourly) {
        const ctx = document.getElementById("overviewElectricityChart");
        if (!ctx) return;

        this.charts.electricity = new Chart(ctx, {
            type: "line",
            data: {
                labels: hourly.labels,
                datasets: [
                    {
                        label: "Grid Demand (MW)",
                        data: [...hourly.electricity],
                        borderColor: "#a855f7",
                        backgroundColor: "rgba(168, 85, 247, 0.18)",
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: "#a855f7",
                        pointRadius: 4
                    },
                    {
                        label: "Distribution Cap (4500 MW)",
                        data: hourly.labels.map(() => 4500),
                        borderColor: "#f43f5e",
                        borderDash: [6, 4],
                        borderWidth: 1.5,
                        pointRadius: 0
                    }
                ]
            },
            options: this.getChartOptions("Power (MW)", 4800)
        });
    },

    // 5. Infrastructure Radar Chart
    initInfrastructureRadar() {
        const ctx = document.getElementById("overviewInfrastructureChart");
        if (!ctx) return;

        const subsystems = window.CITY_DATA.subsystems;
        this.charts.infrastructure = new Chart(ctx, {
            type: "radar",
            data: {
                labels: subsystems.map(s => s.name),
                datasets: [
                    {
                        label: "Current Health Index",
                        data: subsystems.map(s => s.score),
                        borderColor: "#00f0ff",
                        backgroundColor: "rgba(0, 240, 255, 0.25)",
                        borderWidth: 2,
                        pointBackgroundColor: "#00f0ff",
                        pointRadius: 4
                    },
                    {
                        label: "Target Benchmark",
                        data: subsystems.map(s => s.target),
                        borderColor: "rgba(16, 185, 129, 0.8)",
                        borderDash: [4, 4],
                        borderWidth: 1.5,
                        pointRadius: 2,
                        backgroundColor: "transparent"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: { color: "#94a3b8", font: { size: 11 } }
                    }
                },
                scales: {
                    r: {
                        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
                        grid: { color: "rgba(255, 255, 255, 0.08)" },
                        pointLabels: {
                            color: "#cbd5e1",
                            font: { size: 10, family: "Rajdhani, sans-serif" }
                        },
                        ticks: {
                            backdropColor: "transparent",
                            color: "#64748b",
                            stepSize: 20
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    },

    // Domain Chart: Arterial Congestion
    initArterialChart() {
        const ctx = document.getElementById("trafficArterialChart");
        if (!ctx) return;

        const arterials = window.CITY_DATA.arterials;
        this.charts.arterials = new Chart(ctx, {
            type: "bar",
            data: {
                labels: arterials.map(a => a.name.split(" ")[0]),
                datasets: [
                    {
                        label: "Congestion (%)",
                        data: arterials.map(a => a.currentCongestion),
                        backgroundColor: arterials.map(a => 
                            a.currentCongestion > 80 ? "rgba(244, 63, 94, 0.7)" :
                            (a.currentCongestion > 65 ? "rgba(251, 191, 36, 0.7)" : "rgba(16, 185, 129, 0.7)")
                        ),
                        borderColor: arterials.map(a => 
                            a.currentCongestion > 80 ? "#f43f5e" :
                            (a.currentCongestion > 65 ? "#fbbf24" : "#10b981")
                        ),
                        borderWidth: 1.5,
                        borderRadius: 4
                    }
                ]
            },
            options: this.getChartOptions("Congestion (%)", 100)
        });
    },

    // Domain Chart: Pollution Composition
    initPollutionDonut() {
        const ctx = document.getElementById("pollutionDonutChart");
        if (!ctx) return;

        this.charts.pollutionDonut = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Vehicular Exhaust", "Industrial Emissions", "Construction Dust", "Waste Burning", "Port Logistics"],
                datasets: [
                    {
                        data: [42, 24, 18, 9, 7],
                        backgroundColor: ["#00f0ff", "#a855f7", "#fbbf24", "#f43f5e", "#38bdf8"],
                        borderColor: "#0f172a",
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: { color: "#cbd5e1", font: { size: 11 } }
                    }
                },
                cutout: "68%"
            }
        });
    },

    // Domain Chart: Water Reservoir Capacity
    initReservoirChart() {
        const ctx = document.getElementById("waterReservoirChart");
        if (!ctx) return;

        const sources = window.CITY_DATA.waterSources.slice(0, 3);
        this.charts.reservoirs = new Chart(ctx, {
            type: "bar",
            data: {
                labels: sources.map(s => s.name.split(" ")[0]),
                datasets: [
                    {
                        label: "Current Storage (mcft)",
                        data: sources.map(s => s.currentStorageMCFT),
                        backgroundColor: "rgba(56, 189, 248, 0.7)",
                        borderColor: "#38bdf8",
                        borderWidth: 1.5,
                        borderRadius: 4
                    },
                    {
                        label: "Total Capacity (mcft)",
                        data: sources.map(s => s.capacityMCFT),
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: this.getChartOptions("Storage (mcft)", 4000)
        });
    },

    // Domain Chart: Electricity Grid Mix
    initEnergyMixChart() {
        const ctx = document.getElementById("energyMixChart");
        if (!ctx) return;

        this.charts.energyMix = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Thermal Coal (North Chennai)", "Wind (Muppandal Grid)", "Solar (Rooftop & Farm)", "Nuclear (Kalpakkam MAPS)", "Gas / Cogen"],
                datasets: [
                    {
                        data: [48, 22, 16, 10, 4],
                        backgroundColor: ["#f43f5e", "#10b981", "#fbbf24", "#a855f7", "#00f0ff"],
                        borderColor: "#0f172a",
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: { color: "#cbd5e1", font: { size: 11 } }
                    }
                },
                cutout: "68%"
            }
        });
    },

    // Dynamic Chart Update when What-If simulation executes
    updateChartsWithSimulation(simResult) {
        if (typeof Chart === "undefined") return;

        const ratioTraffic = simResult.simulated.traffic / simResult.baseline.traffic;
        const ratioAQI = simResult.simulated.aqi / simResult.baseline.aqi;
        const ratioWater = simResult.simulated.waterDemand / simResult.baseline.waterDemand;
        const ratioEle = simResult.simulated.electricity / simResult.baseline.electricity;

        const hourly = window.CITY_DATA.hourlyProfile;

        if (this.charts.traffic) {
            this.charts.traffic.data.datasets[0].data = hourly.traffic.map(v => Math.min(99, Math.round(v * ratioTraffic)));
            this.charts.traffic.update();
        }

        if (this.charts.pollution) {
            this.charts.pollution.data.datasets[0].data = hourly.aqi.map(v => Math.round(v * ratioAQI));
            this.charts.pollution.update();
        }

        if (this.charts.water) {
            this.charts.water.data.datasets[0].data = hourly.water.map(v => Math.round(v * ratioWater));
            this.charts.water.update();
        }

        if (this.charts.electricity) {
            this.charts.electricity.data.datasets[0].data = hourly.electricity.map(v => Math.round(v * ratioEle));
            this.charts.electricity.update();
        }
    },

    // Reusable Chart.js options
    getChartOptions(yLabel, yMax) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: { color: "#94a3b8", font: { size: 11 } }
                },
                tooltip: {
                    backgroundColor: "#0f172a",
                    borderColor: "rgba(0, 240, 255, 0.4)",
                    borderWidth: 1,
                    titleColor: "#00f0ff"
                }
            },
            scales: {
                x: {
                    grid: { color: "rgba(255, 255, 255, 0.04)" },
                    ticks: { color: "#64748b" }
                },
                y: {
                    beginAtZero: true,
                    max: yMax || undefined,
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#64748b" },
                    title: {
                        display: !!yLabel,
                        text: yLabel,
                        color: "#64748b",
                        font: { size: 11 }
                    }
                }
            }
        };
    },

    // Populate Subsystems Table in Overview
    renderSubsystemsTable() {
        const table = document.getElementById("subsystems-table-body");
        if (!table) return;

        const subsystems = window.CITY_DATA.subsystems;
        table.innerHTML = subsystems.map(s => `
            <tr>
                <td class="font-medium text-white">${s.name}</td>
                <td>
                    <div class="table-bar-wrapper">
                        <div class="table-bar-fill" style="width: ${s.score}%; background: ${s.score > 75 ? '#10b981' : (s.score > 60 ? '#fbbf24' : '#f43f5e')}"></div>
                    </div>
                </td>
                <td class="font-mono text-cyan">${s.score} / 100</td>
                <td>
                    <span class="badge ${s.status === 'Optimal' || s.status === 'Good' ? 'badge-green' : (s.status === 'Moderate' ? 'badge-yellow' : 'badge-red')}">
                        ${s.status}
                    </span>
                </td>
            </tr>
        `).join("");
    },

    // Populate Critical Smart City Alerts
    renderAlertsList() {
        const container = document.getElementById("overview-alerts-container");
        if (!container) return;

        const alerts = window.CITY_DATA.alerts;
        container.innerHTML = alerts.map(a => `
            <div class="alert-item alert-${a.level.toLowerCase()}">
                <div class="alert-icon-box">
                    <i class="fa-solid ${a.icon}"></i>
                </div>
                <div class="alert-body">
                    <div class="alert-head">
                        <span class="alert-badge badge-${a.level.toLowerCase()}">${a.level}</span>
                        <span class="alert-title">${a.title}</span>
                        <span class="alert-time">${a.time}</span>
                    </div>
                    <p class="alert-desc">${a.detail}</p>
                </div>
            </div>
        `).join("");
    },

    // Arterials Table on Traffic Page
    renderArterialsTable() {
        const tbody = document.getElementById("traffic-arterials-tbody");
        if (!tbody) return;

        tbody.innerHTML = window.CITY_DATA.arterials.map(a => `
            <tr>
                <td class="font-bold text-white">${a.name}</td>
                <td>${a.lengthKm} km</td>
                <td>
                    <div class="d-flex align-center gap-2">
                        <span class="status-dot dot-${a.status.toLowerCase()}"></span>
                        <strong>${a.currentCongestion}%</strong>
                    </div>
                </td>
                <td class="font-mono text-cyan">${a.speedKmh} km/h</td>
                <td>
                    <span class="badge ${a.status === 'Green' ? 'badge-green' : (a.status === 'Yellow' ? 'badge-yellow' : 'badge-red')}">
                        ${a.status === 'Red' ? 'Gridlock Alert' : (a.status === 'Yellow' ? 'Slow Flow' : 'Free Moving')}
                    </span>
                </td>
            </tr>
        `).join("");
    },

    // Hotspots List on Pollution Page
    renderHotspotsList() {
        const container = document.getElementById("pollution-hotspots-container");
        if (!container) return;

        const zones = [...window.CITY_DATA.zones].sort((a, b) => b.aqi - a.aqi);
        container.innerHTML = zones.map((z, idx) => `
            <div class="hotspot-card ${idx < 3 ? 'hotspot-severe' : ''}">
                <div class="hotspot-rank">#${idx + 1}</div>
                <div class="hotspot-info">
                    <h4>${z.name}</h4>
                    <p class="text-muted">${z.zoneType}</p>
                </div>
                <div class="hotspot-aqi-box">
                    <span class="hotspot-aqi-val ${z.aqi > 150 ? 'text-red' : (z.aqi > 100 ? 'text-yellow' : 'text-green')}">${z.aqi}</span>
                    <span class="hotspot-aqi-label">AQI</span>
                </div>
            </div>
        `).join("");
    }
};

window.Dashboard = Dashboard;
