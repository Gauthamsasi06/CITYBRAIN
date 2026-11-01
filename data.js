/**
 * CITYBRAIN - AI SMART CITY SIMULATOR
 * Data Module (data.js)
 * Demonstration City: Chennai, Tamil Nadu, India
 * 
 * Note: Demonstration datasets representing realistic Chennai urban metrics.
 * Labeled for illustrative simulation and smart city research purposes.
 */

const CITY_DATA = {
    city: {
        name: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        coordinates: [13.0827, 80.2707],
        timezone: "Asia/Kolkata",
        metroAreaSqKm: 1189,
        lastUpdated: new Date().toISOString()
    },

    // Baseline Metropolitan Metrics
    baseline: {
        population: 11500000,           // 11.5 Million (Metro Area)
        trafficCongestion: 68,          // Baseline % during daylight hours
        aqi: 142,                       // Moderate to Unhealthy for Sensitive Groups
        waterConsumptionMLD: 985,       // Million Liters per Day
        waterSupplyCapacityMLD: 1050,   // Standard reservoir & desalination combined
        electricityDemandMW: 3920,      // Megawatts peak grid load
        gridCapacityMW: 4500,           // TANGEDCO Chennai distribution cap
        infrastructureHealth: 74,       // Out of 100
        co2EmissionsKilotons: 42.5,     // Daily estimated emissions
        publicTransitShare: 34          // % commuters using Metro, MTC bus, MRTS
    },

    // Key Urban Hotspots across Chennai
    zones: [
        {
            id: "anna-nagar",
            name: "Anna Nagar",
            zoneType: "Commercial & Residential",
            lat: 13.0850,
            lng: 80.2101,
            congestion: 62,
            aqi: 125,
            waterDemandMLD: 92,
            electricityMW: 340,
            status: "Moderate",
            statusColor: "#fbbf24",
            description: "Planned sector with heavy peak roundabout congestion and active retail zones."
        },
        {
            id: "t-nagar",
            name: "T. Nagar (Thyagaraya Nagar)",
            zoneType: "High-Density Commercial & Retail",
            lat: 13.0418,
            lng: 80.2341,
            congestion: 88,
            aqi: 168,
            waterDemandMLD: 110,
            electricityMW: 460,
            status: "Critical",
            statusColor: "#f43f5e",
            description: "South Asia's largest retail district. Extreme pedestrian & vehicular bottlenecks."
        },
        {
            id: "guindy",
            name: "Guindy Junction & Estate",
            zoneType: "Transit Interchange & Industrial",
            lat: 13.0067,
            lng: 80.2025,
            congestion: 84,
            aqi: 172,
            waterDemandMLD: 105,
            electricityMW: 490,
            status: "Critical",
            statusColor: "#f43f5e",
            description: "Crucial gateway connecting South Chennai, Kathipara Cloverleaf, and metro lines."
        },
        {
            id: "velachery",
            name: "Velachery",
            zoneType: "Rapid Urban Residential & Commercial",
            lat: 12.9815,
            lng: 80.2180,
            congestion: 74,
            aqi: 138,
            waterDemandMLD: 95,
            electricityMW: 380,
            status: "Moderate",
            statusColor: "#fbbf24",
            description: "Low-lying IT catchment area with high flood sensitivity and intense bypass traffic."
        },
        {
            id: "tambaram",
            name: "Tambaram Gateway",
            zoneType: "Suburban Transit Hub",
            lat: 12.9249,
            lng: 80.1000,
            congestion: 71,
            aqi: 130,
            waterDemandMLD: 85,
            electricityMW: 310,
            status: "Moderate",
            statusColor: "#fbbf24",
            description: "Southern intercity transport corridor with high suburban rail interchange volume."
        },
        {
            id: "perambur",
            name: "Perambur",
            zoneType: "North Chennai Industrial & Rail",
            lat: 13.1110,
            lng: 80.2430,
            congestion: 65,
            aqi: 152,
            waterDemandMLD: 88,
            electricityMW: 330,
            status: "Moderate",
            statusColor: "#fbbf24",
            description: "Industrial heritage and rail workshop district with elevated particulate matter."
        },
        {
            id: "adyar",
            name: "Adyar & Besant Nagar",
            zoneType: "Coastal Residential & Institutional",
            lat: 13.0012,
            lng: 80.2565,
            congestion: 54,
            aqi: 98,
            waterDemandMLD: 82,
            electricityMW: 290,
            status: "Normal",
            statusColor: "#10b981",
            description: "Green estuary corridor, lower pollution, well-balanced water distribution network."
        },
        {
            id: "omr",
            name: "OMR (Cyber Corridor)",
            zoneType: "IT Expressway & Tech Parks",
            lat: 12.9698,
            lng: 80.2458,
            congestion: 79,
            aqi: 148,
            waterDemandMLD: 125,
            electricityMW: 520,
            status: "High",
            statusColor: "#f43f5e",
            description: "Chennai's primary technology corridor with intense server farm & peak AC demand."
        },
        {
            id: "koyambedu",
            name: "Koyambedu (CMBT & Market)",
            zoneType: "Wholesale & Long-Distance Transit",
            lat: 13.0694,
            lng: 80.1948,
            congestion: 86,
            aqi: 175,
            waterDemandMLD: 102,
            electricityMW: 415,
            status: "Critical",
            statusColor: "#f43f5e",
            description: "Heavy freight logistics, diesel emissions, and massive continuous vegetable market traffic."
        },
        {
            id: "chennai-port",
            name: "Chennai Port & Parrys Corner",
            zoneType: "Maritime Logistics & Central Business",
            lat: 13.0900,
            lng: 80.2900,
            congestion: 78,
            aqi: 182,
            waterDemandMLD: 78,
            electricityMW: 370,
            status: "Critical",
            statusColor: "#f43f5e",
            description: "Port container movements, high commercial density, and port-side particulate count."
        }
    ],

    // Hourly 24-Hour Profile for Charts
    hourlyProfile: {
        labels: ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
        traffic: [22, 16, 19, 45, 84, 88, 64, 58, 72, 92, 81, 48], // % congestion
        aqi:     [110, 95, 92, 120, 165, 172, 135, 128, 145, 185, 170, 132], // AQI index
        water:   [310, 240, 290, 890, 1180, 1050, 820, 760, 810, 1020, 940, 520], // MLD flow
        electricity: [2450, 2180, 2050, 2800, 3650, 4100, 4320, 4410, 4150, 4380, 4210, 3100] // Megawatts
    },

    // 7-Day History for Trends
    weeklyTrend: {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        trafficAvg: [72, 74, 75, 73, 81, 62, 54],
        aqiAvg: [148, 152, 146, 144, 158, 130, 118],
        waterAvg: [990, 980, 995, 988, 1010, 960, 950],
        electricityAvg: [4050, 4120, 4180, 4150, 4220, 3750, 3480]
    },

    // Subsystems Health Scores
    subsystems: [
        { name: "Metropolitan Transit & Metro", score: 82, target: 90, status: "Good" },
        { name: "Surface Arterials & Flyovers", score: 64, target: 85, status: "Strained" },
        { name: "Desalination & Pipe Distribution", score: 71, target: 88, status: "Moderate" },
        { name: "Power Grid Substation Resilience", score: 78, target: 92, status: "Good" },
        { name: "Stormwater Drainage & Catchment", score: 58, target: 80, status: "Action Needed" },
        { name: "Air Quality Control Network", score: 66, target: 85, status: "Moderate" },
        { name: "IoT Sensor Mesh Coverage", score: 89, target: 95, status: "Optimal" }
    ],

    // Water Reservoirs Status (Chennai Water Metro)
    waterSources: [
        { name: "Chembarambakkam Lake", currentStorageMCFT: 3120, capacityMCFT: 3645, status: "85% Full" },
        { name: "Poondi Reservoir", currentStorageMCFT: 2450, capacityMCFT: 3231, status: "76% Full" },
        { name: "Red Hills (Puzhal)", currentStorageMCFT: 2890, capacityMCFT: 3300, status: "87% Full" },
        { name: "Nemmeli Desalination Plant", dailyYieldMLD: 150, capacityMLD: 150, status: "100% Operational" },
        { name: "Minjur Desalination Plant", dailyYieldMLD: 100, capacityMLD: 100, status: "100% Operational" }
    ],

    // Key Arterial Roads for Traffic Monitoring
    arterials: [
        { name: "Anna Salai (Mount Road)", lengthKm: 14.5, currentCongestion: 85, speedKmh: 14, status: "Red" },
        { name: "OMR Expressway (IT Corridor)", lengthKm: 20.0, currentCongestion: 79, speedKmh: 22, status: "Yellow" },
        { name: "Poonamallee High Road (EVR Periyar)", lengthKm: 18.2, currentCongestion: 82, speedKmh: 16, status: "Red" },
        { name: "Inner Ring Road (Jawaharlal Nehru)", lengthKm: 27.0, currentCongestion: 73, speedKmh: 24, status: "Yellow" },
        { name: "GST Road (Grand Southern Trunk)", lengthKm: 24.0, currentCongestion: 80, speedKmh: 18, status: "Red" },
        { name: "East Coast Road (ECR)", lengthKm: 15.0, currentCongestion: 48, speedKmh: 42, status: "Green" }
    ],

    // Preset Simulation Scenarios
    presets: [
        {
            id: "green-mobility",
            name: "🌱 Green Mobility Overhaul",
            description: "Shift commuters to Chennai Metro Phase 2 & EV buses with 40% emission controls.",
            params: {
                population: 0,
                vehicleUsage: -25,
                roadCapacity: 10,
                waterSupply: 0,
                electricityDemand: 5,
                pollutionControl: 45
            }
        },
        {
            id: "tech-boom",
            name: "⚡ OMR & Sriperumbudur Tech Boom",
            description: "Rapid 20% industrial & IT workforce expansion without prior capacity expansion.",
            params: {
                population: 20,
                vehicleUsage: 25,
                roadCapacity: 0,
                waterSupply: -5,
                electricityDemand: 30,
                pollutionControl: 5
            }
        },
        {
            id: "monsoon-drought",
            name: "☀️ Severe Summer Heatwave",
            description: "Reservoir depletion reduces supply by 30% while air conditioning demands surge.",
            params: {
                population: 2,
                vehicleUsage: 5,
                roadCapacity: 0,
                waterSupply: -35,
                electricityDemand: 25,
                pollutionControl: -10
            }
        },
        {
            id: "smart-transit",
            name: "🚀 Autonomous Smart Grid 2030",
            description: "AI adaptive traffic signals, 50% pollution scrubbers, and rainwater recycling.",
            params: {
                population: 5,
                vehicleUsage: -18,
                roadCapacity: 25,
                waterSupply: 20,
                electricityDemand: -10,
                pollutionControl: 60
            }
        }
    ],

    // Critical Smart City Alerts
    alerts: [
        {
            id: "alt-01",
            level: "CRITICAL",
            type: "Traffic Bottleneck",
            title: "Severe Congestion at Kathipara - Guindy Junction",
            detail: "Vehicle density exceeded 92% capacity due to high volume. Recommend routing transit via Inner Ring Road bypass.",
            time: "10 mins ago",
            icon: "fa-car-burst"
        },
        {
            id: "alt-02",
            level: "WARNING",
            type: "Air Quality Alert",
            title: "Elevated PM2.5 at Koyambedu Wholesale Corridor",
            detail: "AQI spiked to 175 due to heavy morning diesel logistics and low wind dispersal. Misting units deployed.",
            time: "24 mins ago",
            icon: "fa-smog"
        },
        {
            id: "alt-03",
            level: "WARNING",
            type: "Grid Load Notice",
            title: "Peak Electricity Draw: Sector T. Nagar Substation",
            detail: "Demand reached 460 MW (91% threshold). Auto-swapping feeder line to avoid rolling transformer trips.",
            time: "45 mins ago",
            icon: "fa-bolt"
        },
        {
            id: "alt-04",
            level: "INFO",
            type: "Water Supply Normal",
            title: "Desalination Plants Operating at 100% Efficiency",
            detail: "Nemmeli & Minjur plants injected 250 MLD directly into the Southern Chennai distribution pipeline.",
            time: "1 hour ago",
            icon: "fa-water"
        }
    ]
};

// Storage Utilities
const StorageManager = {
    KEYS: {
        CHAT_HISTORY: "citybrain_chat_history_v1",
        SIM_HISTORY: "citybrain_sim_history_v1",
        USER_PREFS: "citybrain_user_prefs_v1",
        ACTIVE_SCENARIO: "citybrain_active_scenario_v1"
    },

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error("Storage save failed:", e);
            return false;
        }
    },

    load(key, fallback = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error("Storage load failed:", e);
            return fallback;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Expose globally
window.CITY_DATA = CITY_DATA;
window.StorageManager = StorageManager;
