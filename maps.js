/**
 * CITYBRAIN - AI SMART CITY SIMULATOR
 * Interactive Map Engine (maps.js)
 * Powered by Leaflet.js (CDN)
 * 
 * Futuristic Dark Matter cartography of Chennai, India.
 * Custom glowing SVG beacons, live telemetry tooltips,
 * and multi-metric urban filter overlays.
 */

const CityMapEngine = {
    map: null,
    markers: [],
    circles: [],
    activeFilter: "all",
    selectedZone: null,

    init() {
        const mapContainer = document.getElementById("leaflet-map");
        if (!mapContainer) return;

        // Ensure Leaflet is loaded
        if (typeof L === "undefined") {
            console.error("Leaflet.js is not loaded.");
            return;
        }

        // Center on Chennai Metropolitan Core
        const chennaiCoords = [13.0450, 80.2200];
        
        this.map = L.map("leaflet-map", {
            center: chennaiCoords,
            zoom: 12,
            minZoom: 10,
            maxZoom: 16,
            zoomControl: false
        });

        // Add Zoom Control on top right
        L.control.zoom({ position: "topright" }).addTo(this.map);

        // Dark Matter Futuristic Tile Layer (CartoDB)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> | CityBrain Simulation Data',
            subdomains: "abcd",
            maxZoom: 19
        }).addTo(this.map);

        this.renderMarkers();
        this.bindFilterButtons();

        // Select the first zone by default for the sidebar inspector
        if (window.CITY_DATA.zones.length > 0) {
            this.selectZone(window.CITY_DATA.zones[0]);
        }

        // Handle window resize or view tab switch
        window.addEventListener("resize", () => {
            if (this.map) this.map.invalidateSize();
        });
    },

    // Refresh map size when map tab is opened
    invalidate() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    },

    // Render custom futuristic pulsating markers
    renderMarkers() {
        // Clear previous
        this.markers.forEach(m => this.map.removeLayer(m));
        this.circles.forEach(c => this.map.removeLayer(c));
        this.markers = [];
        this.circles = [];

        const zones = window.CITY_DATA.zones;

        zones.forEach(zone => {
            // Determine marker color and severity
            let color = "#10b981"; // Green (<60%)
            let statusClass = "marker-green";

            if (zone.congestion >= 80) {
                color = "#f43f5e"; // Red
                statusClass = "marker-red pulsing-beacon";
            } else if (zone.congestion >= 65) {
                color = "#fbbf24"; // Yellow
                statusClass = "marker-yellow";
            }

            // Create custom HTML divIcon for neon cyber look
            const customIcon = L.divIcon({
                className: "custom-cyber-marker",
                html: `
                    <div class="marker-pin ${statusClass}" style="--marker-color: ${color}">
                        <div class="marker-core"></div>
                        <div class="marker-ring"></div>
                        <span class="marker-label">${zone.name.split(" ")[0]}</span>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 18]
            });

            // Add Marker
            const marker = L.marker([zone.lat, zone.lng], { icon: customIcon }).addTo(this.map);

            // Radius heat circle
            const radius = Math.max(700, zone.congestion * 18);
            const circle = L.circle([zone.lat, zone.lng], {
                radius: radius,
                color: color,
                fillColor: color,
                fillOpacity: 0.12,
                weight: 1.2
            }).addTo(this.map);

            this.circles.push(circle);

            // Popup content
            const popupContent = `
                <div class="map-popup-card">
                    <div class="map-popup-header">
                        <h4>${zone.name}</h4>
                        <span class="badge" style="background:${color}22; color:${color}; border:1px solid ${color}66">${zone.status}</span>
                    </div>
                    <p class="map-popup-type">${zone.zoneType}</p>
                    <div class="map-popup-stats">
                        <div class="stat-row">
                            <span><i class="fa-solid fa-car text-cyan"></i> Congestion:</span>
                            <strong>${zone.congestion}%</strong>
                        </div>
                        <div class="stat-row">
                            <span><i class="fa-solid fa-smog text-yellow"></i> Air Quality (AQI):</span>
                            <strong>${zone.aqi}</strong>
                        </div>
                        <div class="stat-row">
                            <span><i class="fa-solid fa-water text-blue"></i> Water Demand:</span>
                            <strong>${zone.waterDemandMLD} MLD</strong>
                        </div>
                        <div class="stat-row">
                            <span><i class="fa-solid fa-bolt text-purple"></i> Electricity Draw:</span>
                            <strong>${zone.electricityMW} MW</strong>
                        </div>
                    </div>
                    <p class="map-popup-desc">${zone.description}</p>
                    <div class="map-popup-actions">
                        <button class="btn-popup-inspect" onclick="CityMapEngine.selectZoneById('${zone.id}')">Inspect Telemetry</button>
                    </div>
                    <div class="map-sim-tag"><i class="fa-solid fa-triangle-exclamation"></i> Simulated Demonstration Data</div>
                </div>
            `;

            marker.bindPopup(popupContent, {
                className: "cyber-popup",
                maxWidth: 280
            });

            marker.on("click", () => {
                this.selectZone(zone);
            });

            this.markers.push(marker);
        });
    },

    selectZoneById(zoneId) {
        const zone = window.CITY_DATA.zones.find(z => z.id === zoneId);
        if (zone) {
            this.selectZone(zone);
            this.map.setView([zone.lat, zone.lng], 14, { animate: true });
        }
    },

    // Populate zone details in the inspector sidebar
    selectZone(zone) {
        this.selectedZone = zone;
        const panel = document.getElementById("zone-inspector-panel");
        if (!panel) return;

        const color = zone.congestion >= 80 ? "#f43f5e" : (zone.congestion >= 65 ? "#fbbf24" : "#10b981");

        panel.innerHTML = `
            <div class="inspector-header">
                <div>
                    <h3 class="text-white">${zone.name}</h3>
                    <span class="text-muted text-sm">${zone.zoneType}</span>
                </div>
                <span class="badge" style="background:${color}22; color:${color}; border:1px solid ${color}88">${zone.status} Congestion</span>
            </div>
            
            <p class="inspector-summary">${zone.description}</p>

            <div class="inspector-grid">
                <div class="inspector-stat-card">
                    <div class="stat-label"><i class="fa-solid fa-car text-cyan"></i> Traffic Congestion</div>
                    <div class="stat-val font-mono" style="color: ${color}">${zone.congestion}%</div>
                    <div class="inspector-bar"><div class="fill" style="width: ${zone.congestion}%; background: ${color}"></div></div>
                </div>

                <div class="inspector-stat-card">
                    <div class="stat-label"><i class="fa-solid fa-smog text-yellow"></i> Air Quality Index</div>
                    <div class="stat-val font-mono ${zone.aqi > 150 ? 'text-red' : (zone.aqi > 100 ? 'text-yellow' : 'text-green')}">${zone.aqi} AQI</div>
                    <div class="inspector-bar"><div class="fill" style="width: ${Math.min(100, (zone.aqi / 250) * 100)}%; background: #fbbf24"></div></div>
                </div>

                <div class="inspector-stat-card">
                    <div class="stat-label"><i class="fa-solid fa-water text-blue"></i> Daily Water Demand</div>
                    <div class="stat-val font-mono text-cyan">${zone.waterDemandMLD} MLD</div>
                    <div class="inspector-bar"><div class="fill" style="width: ${(zone.waterDemandMLD / 150) * 100}%; background: #38bdf8"></div></div>
                </div>

                <div class="inspector-stat-card">
                    <div class="stat-label"><i class="fa-solid fa-bolt text-purple"></i> Grid Power Load</div>
                    <div class="stat-val font-mono text-purple">${zone.electricityMW} MW</div>
                    <div class="inspector-bar"><div class="fill" style="width: ${(zone.electricityMW / 600) * 100}%; background: #a855f7"></div></div>
                </div>
            </div>

            <div class="inspector-actions">
                <button class="btn-cyber-primary w-100" id="btn-ask-ai-zone">
                    <i class="fa-solid fa-brain"></i> Ask AI Assistant About ${zone.name.split(" ")[0]}
                </button>
            </div>
            <div class="text-xs text-muted mt-2 text-center">
                Coordinates: ${zone.lat.toFixed(4)}° N, ${zone.lng.toFixed(4)}° E • Chennai Urban Telemetry
            </div>
        `;

        // Bind "Ask AI" button
        const askBtn = document.getElementById("btn-ask-ai-zone");
        if (askBtn) {
            askBtn.addEventListener("click", () => {
                if (window.CityBrainNav) {
                    window.CityBrainNav.switchView("chatbot");
                    setTimeout(() => {
                        const input = document.getElementById("chat-input");
                        if (input && window.CityBrainChatbot) {
                            input.value = `Tell me about the conditions in ${zone.name}`;
                            window.CityBrainChatbot.handleUserSubmit();
                        }
                    }, 200);
                }
            });
        }
    },

    // Filter controls for map overlays
    bindFilterButtons() {
        const filterBtns = document.querySelectorAll(".map-filter-btn");
        filterBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                filterBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const filter = btn.getAttribute("data-filter");
                this.applyFilter(filter);
            });
        });
    },

    applyFilter(filter) {
        this.activeFilter = filter;
        const zones = window.CITY_DATA.zones;

        this.circles.forEach((circle, index) => {
            const z = zones[index];
            if (!z) return;

            let color = "#00f0ff";
            let radius = 800;

            if (filter === "traffic") {
                color = z.congestion >= 80 ? "#f43f5e" : (z.congestion >= 65 ? "#fbbf24" : "#10b981");
                radius = z.congestion * 18;
            } else if (filter === "pollution") {
                color = z.aqi > 150 ? "#f43f5e" : (z.aqi > 110 ? "#fbbf24" : "#10b981");
                radius = z.aqi * 9;
            } else if (filter === "water") {
                color = "#38bdf8";
                radius = z.waterDemandMLD * 12;
            } else if (filter === "electricity") {
                color = "#a855f7";
                radius = z.electricityMW * 3;
            } else {
                // all
                color = z.congestion >= 80 ? "#f43f5e" : (z.congestion >= 65 ? "#fbbf24" : "#10b981");
                radius = Math.max(700, z.congestion * 18);
            }

            circle.setStyle({ color: color, fillColor: color });
            circle.setRadius(radius);
        });
    }
};

window.CityMapEngine = CityMapEngine;
