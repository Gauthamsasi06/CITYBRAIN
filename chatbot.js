/**
 * CITYBRAIN - AI SMART CITY SIMULATOR
 * Chatbot Intelligence Engine (chatbot.js)
 * Assistant: CITYBRAIN AI ASSISTANT
 * 
 * Modular Intent Classification, Context Awareness,
 * Regex & Keyword Entity Extraction, and Offline Autonomous Rule Engine.
 * Optional Configurable LLM API Endpoint Interface for online enhancement.
 */

const CityBrainChatbot = {
    // Conversation State & Context Memory
    context: {
        lastTopic: null,
        lastZoneMentioned: null,
        lastSimResult: null,
        interactionCount: 0
    },

    // Default configuration for offline demo / optional external LLM
    config: {
        offlineMode: true,
        endpoint: "",
        apiKey: "",
        model: "gpt-4o-mini"
    },

    isTyping: false,

    // Initial greeting message
    welcomeMessage: {
        sender: "bot",
        text: "👋 Greetings! I am the **CITYBRAIN AI ASSISTANT**, monitoring Chennai's metropolitan neural grid in real-time. You can query live traffic status, atmospheric pollution, water reserves, electricity demands, or ask me to run what-if civic simulations.\n\nTry clicking a suggested query below or ask your own question!",
        timestamp: "Just now"
    },

    init() {
        this.loadConfig();
        this.bindEvents();
        this.loadChatHistory();
    },

    loadConfig() {
        const saved = window.StorageManager.load(window.StorageManager.KEYS.USER_PREFS, null);
        if (saved && saved.llmConfig) {
            this.config = { ...this.config, ...saved.llmConfig };
        }
    },

    saveConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        const prefs = window.StorageManager.load(window.StorageManager.KEYS.USER_PREFS, {}) || {};
        prefs.llmConfig = {
            offlineMode: this.config.offlineMode,
            endpoint: this.config.endpoint,
            model: this.config.model
            // Never persist raw keys in plain storage if user prefers session-only
        };
        window.StorageManager.save(window.StorageManager.KEYS.USER_PREFS, prefs);
    },

    bindEvents() {
        const input = document.getElementById("chat-input");
        const sendBtn = document.getElementById("btn-chat-send");
        const clearBtn = document.getElementById("btn-clear-chat");
        const configBtn = document.getElementById("btn-chat-config");

        if (input && sendBtn) {
            sendBtn.addEventListener("click", () => this.handleUserSubmit());

            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    this.handleUserSubmit();
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => this.clearChatHistory());
        }

        // Suggested question chips
        const chips = document.querySelectorAll(".suggestion-chip");
        chips.forEach(chip => {
            chip.addEventListener("click", (e) => {
                const query = chip.getAttribute("data-query") || chip.innerText.trim();
                if (input) {
                    input.value = query;
                    this.handleUserSubmit();
                }
            });
        });

        // LLM Modal bindings
        this.bindModalEvents();
    },

    bindModalEvents() {
        const modal = document.getElementById("llm-config-modal");
        const openBtn = document.getElementById("btn-open-llm-settings");
        const closeBtn = document.getElementById("btn-close-llm-modal");
        const saveBtn = document.getElementById("btn-save-llm-config");

        if (openBtn && modal) {
            openBtn.addEventListener("click", () => {
                const endpointInput = document.getElementById("llm-endpoint-input");
                const modelInput = document.getElementById("llm-model-input");
                const offlineToggle = document.getElementById("llm-offline-toggle");

                if (endpointInput) endpointInput.value = this.config.endpoint || "";
                if (modelInput) modelInput.value = this.config.model || "gpt-4o-mini";
                if (offlineToggle) offlineToggle.checked = this.config.offlineMode;

                modal.classList.add("active");
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener("click", () => modal.classList.remove("active"));
        }

        if (saveBtn && modal) {
            saveBtn.addEventListener("click", () => {
                const endpoint = document.getElementById("llm-endpoint-input")?.value.trim() || "";
                const apiKey = document.getElementById("llm-key-input")?.value.trim() || "";
                const model = document.getElementById("llm-model-input")?.value.trim() || "gpt-4o-mini";
                const offlineMode = document.getElementById("llm-offline-toggle")?.checked ?? true;

                this.saveConfig({ endpoint, apiKey, model, offlineMode });
                modal.classList.remove("active");

                const statusTag = document.getElementById("llm-mode-badge");
                if (statusTag) {
                    statusTag.innerText = offlineMode ? "Offline Rule Engine" : "Custom LLM Connected";
                    statusTag.className = offlineMode ? "badge-offline" : "badge-online";
                }
            });
        }
    },

    loadChatHistory() {
        const history = window.StorageManager.load(window.StorageManager.KEYS.CHAT_HISTORY, null);
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        container.innerHTML = "";

        if (!history || history.length === 0) {
            this.appendMessageToDOM(this.welcomeMessage.sender, this.welcomeMessage.text, this.welcomeMessage.timestamp);
            return;
        }

        history.forEach(msg => {
            this.appendMessageToDOM(msg.sender, msg.text, msg.timestamp);
        });

        this.scrollToBottom();
    },

    clearChatHistory() {
        if (confirm("Reset conversation history? This will clear session transcripts.")) {
            window.StorageManager.remove(window.StorageManager.KEYS.CHAT_HISTORY);
            const container = document.getElementById("chat-messages-container");
            if (container) container.innerHTML = "";
            this.context = { lastTopic: null, lastZoneMentioned: null, lastSimResult: null, interactionCount: 0 };
            this.appendMessageToDOM(this.welcomeMessage.sender, this.welcomeMessage.text, "Just now");
        }
    },

    async handleUserSubmit() {
        const input = document.getElementById("chat-input");
        if (!input || this.isTyping) return;

        const query = input.value.trim();
        if (!query) return;

        input.value = "";
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 1. Render User Message
        this.appendMessageToDOM("user", query, timestamp);
        this.saveMessage("user", query, timestamp);

        // 2. Show Typing Indicator
        this.showTypingIndicator();

        // 3. Process Response
        try {
            const botResponse = await this.generateResponse(query);
            this.hideTypingIndicator();
            this.typeBotResponse(botResponse);
        } catch (err) {
            console.error("Chat error:", err);
            this.hideTypingIndicator();
            this.typeBotResponse("⚠️ Error communicating with intelligence service. Operating in failsafe offline mode.");
        }
    },

    // Core Intent & Response Engine
    async generateResponse(userText) {
        const text = userText.toLowerCase().trim();
        const base = window.CITY_DATA.baseline;
        const zones = window.CITY_DATA.zones;
        this.context.interactionCount++;

        // If user configured a custom LLM endpoint and disabled offline mode
        if (!this.config.offlineMode && this.config.endpoint && this.config.apiKey) {
            try {
                return await this.callExternalLLM(userText);
            } catch (e) {
                console.warn("External LLM failed, falling back to offline rule engine:", e);
            }
        }

        // Simulate intelligent slight latency (300-600ms) for realistic command room feel
        await new Promise(r => setTimeout(r, 450));

        // 1. SPECIFIC WHAT-IF / SIMULATION PROMPTS
        // e.g. "What happens if population increases by 20%?"
        const popMatch = text.match(/population\s*(increases|grows|rises|drops|decreases)?\s*(by)?\s*([+-]?\d+)\s*%/i);
        if (popMatch || (text.includes("population") && (text.includes("increase") || text.includes("growth")))) {
            const pct = popMatch ? parseInt(popMatch[3], 10) : 20;
            const sim = window.SimulationEngine.compute({
                population: pct,
                vehicleUsage: 0,
                roadCapacity: 0,
                waterSupply: 0,
                electricityDemand: 0,
                pollutionControl: 0
            });
            this.context.lastTopic = "simulation";
            this.context.lastSimResult = sim;
            return `📊 **Simulation Analysis: +${pct}% Population Growth**\n\nIf Chennai's metropolitan population increases by **${pct}%** (reaching **${(sim.simulated.population / 1000000).toFixed(2)}M citizens**):\n\n` +
                   `• **Traffic Congestion:** Expands to **${sim.simulated.traffic}%** (${sim.deltas.traffic >= 0 ? '+' : ''}${sim.deltas.trafficPct}%) due to passenger volume spillover on bus and road corridors.\n` +
                   `• **Water Demand:** Surges to **${sim.simulated.waterDemand} MLD**, opening a daily deficit gap of **${sim.simulated.waterDeficit} MLD** against existing reservoir and desalination limits.\n` +
                   `• **Electricity Grid:** Peak draw escalates to **${sim.simulated.electricity} MW**, reducing reserve margin to **${sim.simulated.gridReserveMargin}%**.\n` +
                   `• **City Infrastructure Health:** Drops from **${base.infrastructureHealth}** to **${sim.simulated.health} / 100**.\n\n` +
                   `💡 *Recommendation:* High-density transit-oriented development along Outer Ring Road and accelerating the 150 MLD Perur desalination plant.`;
        }

        // e.g. "What if vehicle usage decreases by 15%?"
        const vehMatch = text.match(/vehicle\s*(usage|count)?\s*(decreases|drops|reduces|rises|increases)?\s*(by)?\s*([+-]?\d+)\s*%/i);
        if (vehMatch || (text.includes("vehicle") && (text.includes("decrease") || text.includes("reduce") || text.includes("electric")))) {
            const pct = vehMatch ? -Math.abs(parseInt(vehMatch[4], 10)) : -15;
            const sim = window.SimulationEngine.compute({
                population: 0,
                vehicleUsage: pct,
                roadCapacity: 0,
                waterSupply: 0,
                electricityDemand: 0,
                pollutionControl: 20
            });
            this.context.lastTopic = "simulation";
            return `🌱 **Simulation Analysis: ${pct}% Vehicle Reduction**\n\n` +
                   `Lowering vehicular density across Chennai yields dramatic cascade benefits:\n\n` +
                   `• **Traffic Congestion:** Drops from **${base.trafficCongestion}%** down to **${sim.simulated.traffic}%** (${sim.deltas.trafficPct}% improvement).\n` +
                   `• **Air Quality Index:** Improves significantly to **${sim.simulated.aqi} AQI** (down from ${base.aqi}), cutting harmful nitrogen oxides and PM2.5 in commercial zones like T. Nagar.\n` +
                   `• **Commuter Speeds:** Average speed across Anna Salai and OMR estimated to increase by **7.4 km/h**.\n` +
                   `• **Civic Health Score:** Elevated to **${sim.simulated.health} / 100**.\n\n` +
                   `💡 *Next Step:* You can verify this full multi-variable scenario in the **What-If Simulator** tab.`;
        }

        // 2. TRAFFIC PREDICTIONS & CONDITIONS
        // e.g. "Predict traffic at 6 PM"
        if (text.includes("predict traffic at 6 pm") || text.includes("6 pm") || text.includes("evening traffic") || text.includes("peak hour")) {
            this.context.lastTopic = "traffic";
            return `🚦 **Chennai Traffic Forecast (18:00 / 6:00 PM Peak Window):**\n\n` +
                   `• **Projected Congestion Level:** **92% (Severe / Red)**\n` +
                   `• **Primary Bottlenecks:**\n` +
                   `  1. **Kathipara Cloverleaf (Guindy):** Extreme inbound convergence from GST Road and Anna Salai.\n` +
                   `  2. **OMR Cyber Corridor (Tidel Park to Perungudi):** Heavy tech workforce egress. Speeds ~12 km/h.\n` +
                   `  3. **Poonamallee High Road & Koyambedu Market:** Elevated commercial logistics flow.\n` +
                   `• **Recommended Transit Alternative:** Chennai Metro Blue and Green Lines operate at 99.4% punctuality with 5-minute headway, bypassing 45 minutes of arterial gridlock.`;
        }

        if (text.includes("traffic condition") || text.includes("current traffic") || text.includes("congestion in chennai") || text.includes("traffic status")) {
            this.context.lastTopic = "traffic";
            return `🚦 **Current Metropolitan Traffic Overview:**\n\n` +
                   `• **Citywide Congestion:** **${base.trafficCongestion}%** (High peak load)\n` +
                   `• **Most Congested Sector:** **T. Nagar (88%)** and **Guindy Interchange (84%)**\n` +
                   `• **Freest Flowing Corridor:** **East Coast Road (ECR) at 48%**\n` +
                   `• **Average Commuter Speed:** **19.2 km/h** across primary arterials.\n` +
                   `• **Active Signal Control:** 180 smart AI adaptive signals operational at key junctions. Check the **Traffic Intelligence** tab for live road gauges.`;
        }

        // 3. POLLUTION & AIR QUALITY
        // e.g. "Which city areas have high pollution?"
        if (text.includes("high pollution") || text.includes("pollution hotspot") || text.includes("which areas") || text.includes("air quality") || text.includes("aqi")) {
            this.context.lastTopic = "pollution";
            return `🌫️ **Chennai Air Quality & Hotspot Report:**\n\n` +
                   `The metropolitan average AQI is currently **${base.aqi}** (Moderate/Unhealthy for Sensitive Groups).\n\n` +
                   `**Top 3 High-Pollution Zones:**\n` +
                   `1. **Chennai Port & Parrys Corner (AQI 182):** Heavy diesel container truck idling and maritime freight activities.\n` +
                   `2. **Koyambedu CMBT Hub (AQI 175):** Dense long-distance bus exhaust and wholesale freight logistics.\n` +
                   `3. **Guindy Industrial Estate (AQI 172):** Industrial manufacturing outputs paired with high vehicle density.\n\n` +
                   `🌿 **Cleanest Zone:** **Adyar & Besant Nagar (AQI 98)** aided by sea breezes and green estuarine canopy.`;
        }

        // 4. WATER MANAGEMENT
        // e.g. "Predict tomorrow's water demand."
        if (text.includes("water demand") || text.includes("water consumption") || text.includes("water shortage") || text.includes("reservoir")) {
            this.context.lastTopic = "water";
            const currentDemand = base.waterConsumptionMLD;
            const projectedTomorrow = Math.round(currentDemand * 1.025);
            return `💧 **Chennai Water Metro Intelligence:**\n\n` +
                   `• **Current Daily Consumption:** **${currentDemand} MLD**\n` +
                   `• **Predicted Tomorrow's Demand:** **${projectedTomorrow} MLD** (+2.5% weekend commercial and residential draw)\n` +
                   `• **Key Reservoir Storage:** Chembarambakkam (85%), Poondi (76%), Red Hills (87%)\n` +
                   `• **Desalination Yield:** **250 MLD** combined uninterrupted output from Nemmeli and Minjur plants.\n` +
                   `• **Shortage Vulnerability:** Low to moderate. Summer reserves are adequate for 118 days at current extraction velocity.`;
        }

        // 5. ELECTRICITY CONSUMPTION
        // e.g. "How can we reduce electricity consumption?"
        if (text.includes("reduce electricity") || text.includes("electricity consumption") || text.includes("power demand") || text.includes("save energy")) {
            this.context.lastTopic = "electricity";
            return `⚡ **CityBrain Energy Optimization Strategies:**\n\n` +
                   `Chennai currently draws **${base.electricityDemandMW} MW** against a safe grid threshold of **${base.gridCapacityMW} MW**.\n\n` +
                   `**AI Recommendations to Cut Load by 14-18%:**\n` +
                   `1. **Dynamic Chiller Modulation:** Mandate IT parks on OMR and DLF Porur to pre-cool campus buildings before 11:00 AM, lowering peak thermal draw.\n` +
                   `2. **Smart LED Streetlighting:** Deploy motion-dimming on ECR, Inner Ring Road, and bypass corridors, reducing municipal power drain by 32 MW.\n` +
                   `3. **Rooftop Solar Net-Metering:** Fast-track 200 MW commercial rooftop solar integration in industrial corridors.\n` +
                   `4. **Peak Tariff Incentives:** Shift non-critical industrial heavy loads to off-peak night cycles (23:00 - 05:00).`;
        }

        // 6. ZONE SPECIFIC QUERY
        // e.g. "Tell me about Anna Nagar" or "T Nagar" or "Guindy"
        const foundZone = zones.find(z => text.includes(z.name.toLowerCase()) || text.includes(z.id.replace("-", " ")));
        if (foundZone) {
            this.context.lastZoneMentioned = foundZone;
            return `📍 **Zone Intelligence Dossier: ${foundZone.name}**\n\n` +
                   `• **Classification:** ${foundZone.zoneType}\n` +
                   `• **Congestion Level:** **${foundZone.congestion}%** (${foundZone.status})\n` +
                   `• **Air Quality:** **AQI ${foundZone.aqi}**\n` +
                   `• **Water Consumption:** **${foundZone.waterDemandMLD} MLD**\n` +
                   `• **Electricity Draw:** **${foundZone.electricityMW} MW**\n` +
                   `• **Situation Summary:** ${foundZone.description}\n\n` +
                   `💡 *Tip:* View this sector with glowing visual beacons in the **Smart City Map** tab.`;
        }

        // 7. GREETINGS & INTRO
        if (text.match(/^(hi|hello|hey|greetings|namaste|vanakkam)/)) {
            return `Vanakkam! 🙏 I am your **CITYBRAIN AI ASSISTANT**. All civic telemetry systems for Chennai are connected and transmitting.\n\n` +
                   `I can assist you with real-time analytics, infrastructure stress predictions, and what-if policy scenarios. How may I assist your command session?`;
        }

        // 8. HELP / CAPABILITIES
        if (text.includes("help") || text.includes("what can you do") || text.includes("commands")) {
            return `🤖 **CityBrain Assistant Capabilities:**\n\n` +
                   `• **Traffic Queries:** Ask about peak hours, bottlenecks, or corridor speeds (Anna Salai, OMR, Guindy).\n` +
                   `• **Air Quality:** Inquire about AQI readings, pollution hotspots, and emission mitigation.\n` +
                   `• **What-If Simulations:** Ask things like *"What happens if population increases by 20%?"* or *"What if vehicle usage decreases by 15%?"*.\n` +
                   `• **Resource Metrics:** Check daily MLD water demand or MW grid consumption.\n` +
                   `• **Zone Lookups:** Request data for Anna Nagar, T. Nagar, Tambaram, Perambur, Adyar, etc.`;
        }

        // 9. CONTEXTUAL FOLLOW-UP
        if (this.context.lastTopic === "traffic" && (text.includes("how to fix") || text.includes("solutions") || text.includes("recommendation"))) {
            return `🛠️ **AI Action Plan for Traffic Mitigation:**\n\n` +
                   `1. Synchronize traffic signals along the Kathipara-Guindy and Gemini Flyover corridors.\n` +
                   `2. Mandate flexible office entry hours for tech parks along OMR (staggering between 8:30 AM and 10:30 AM).\n` +
                   `3. Deploy feeder feeder e-shuttles connecting suburban rail and metro stations.`;
        }

        // 10. DEFAULT INTELLIGENT FALLBACK
        return `🧠 **CityBrain Intelligence Dispatch:**\n\n` +
               `I analyzed your query: *"\"${userText}\""* against Chennai's municipal data mesh.\n\n` +
               `Current telemetry indicators:\n` +
               `• **Metropolitan Health:** **${base.infrastructureHealth} / 100** (Operational)\n` +
               `• **Active Congestion:** **${base.trafficCongestion}%**\n` +
               `• **Air Quality Index:** **${base.aqi} AQI**\n\n` +
               `Try asking: *"Predict traffic at 6 PM"*, *"What happens if population increases by 20%?"*, or *"Which city areas have high pollution?"*.`;
    },

    // Optional external LLM API caller (e.g., standard OpenAI/Gemini proxy endpoint)
    async callExternalLLM(prompt) {
        const payload = {
            model: this.config.model || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are CITYBRAIN AI ASSISTANT, an advanced AI system for the futuristic Chennai Smart City Simulator. Answer with crisp, authoritative urban-planning intelligence, statistics, and concrete civic recommendations."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7
        };

        const res = await fetch(this.config.endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`LLM API returned ${res.status}`);
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "No response received from external LLM.";
    },

    // Append to DOM
    appendMessageToDOM(sender, text, timestamp) {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-message ${sender}-message`;

        const avatar = sender === "user" 
            ? `<div class="msg-avatar user-avatar"><i class="fa-solid fa-user-astronaut"></i></div>`
            : `<div class="msg-avatar bot-avatar"><i class="fa-solid fa-brain"></i></div>`;

        const formattedText = this.formatMarkdown(text);

        msgDiv.innerHTML = `
            ${avatar}
            <div class="msg-content-wrapper">
                <div class="msg-header">
                    <span class="msg-sender">${sender === "user" ? "OPERATOR" : "CITYBRAIN AI"}</span>
                    <span class="msg-time">${timestamp || "Now"}</span>
                </div>
                <div class="msg-bubble">${formattedText}</div>
            </div>
        `;

        container.appendChild(msgDiv);
        this.scrollToBottom();
    },

    // Save message to LocalStorage
    saveMessage(sender, text, timestamp) {
        const history = window.StorageManager.load(window.StorageManager.KEYS.CHAT_HISTORY, []) || [];
        history.push({ sender, text, timestamp });
        // Keep latest 50 messages
        const trimmed = history.slice(-50);
        window.StorageManager.save(window.StorageManager.KEYS.CHAT_HISTORY, trimmed);
    },

    // Typing effect for bot responses
    typeBotResponse(fullText) {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const msgDiv = document.createElement("div");
        msgDiv.className = "chat-message bot-message";
        msgDiv.innerHTML = `
            <div class="msg-avatar bot-avatar"><i class="fa-solid fa-brain"></i></div>
            <div class="msg-content-wrapper">
                <div class="msg-header">
                    <span class="msg-sender">CITYBRAIN AI</span>
                    <span class="msg-time">${timestamp}</span>
                </div>
                <div class="msg-bubble typing-bubble"></div>
            </div>
        `;

        container.appendChild(msgDiv);
        const bubble = msgDiv.querySelector(".msg-bubble");
        this.scrollToBottom();

        this.isTyping = true;
        let charIndex = 0;
        const totalChars = fullText.length;
        
        // Dynamic speed based on length to keep it snappy
        const speed = totalChars > 250 ? 5 : 12;

        const interval = setInterval(() => {
            if (charIndex <= totalChars) {
                // Render formatted markdown incrementally
                const currentSlice = fullText.substring(0, charIndex);
                bubble.innerHTML = this.formatMarkdown(currentSlice);
                charIndex += 4; // Step faster for futuristic responsive feel
                this.scrollToBottom();
            } else {
                clearInterval(interval);
                bubble.innerHTML = this.formatMarkdown(fullText);
                this.isTyping = false;
                this.saveMessage("bot", fullText, timestamp);
                this.scrollToBottom();
            }
        }, speed);
    },

    showTypingIndicator() {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;

        let indicator = document.getElementById("chat-typing-indicator");
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = "chat-typing-indicator";
            indicator.className = "chat-typing-indicator";
            indicator.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <span class="typing-text">CITYBRAIN AI computing neural telemetry...</span>
            `;
            container.appendChild(indicator);
        }
        indicator.style.display = "flex";
        this.scrollToBottom();
    },

    hideTypingIndicator() {
        const indicator = document.getElementById("chat-typing-indicator");
        if (indicator) {
            indicator.style.display = "none";
        }
    },

    scrollToBottom() {
        const container = document.getElementById("chat-messages-container");
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    },

    formatMarkdown(text) {
        if (!text) return "";
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n• /g, '<br>• ')
            .replace(/\n/g, '<br>');
    }
};

window.CityBrainChatbot = CityBrainChatbot;
