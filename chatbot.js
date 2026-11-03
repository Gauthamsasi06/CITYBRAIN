/**
 * CITYBRAIN - AI SMART CITY SIMULATOR
 * Chatbot Engine v2 (chatbot.js)
 *
 * ► FREE AI: Google Gemini 3.8 Flash (gemini-3.8-flash) & 3.5 Flash Lite
 *   Free tier: 1,500 requests/day · Pre-configured Built-in Key
 *   Get key → https://aistudio.google.com/app/apikey
 *
 * ► REAL-TIME STREAMING via Server-Sent Events (SSE ReadableStream)
 * ► MULTI-TURN conversation history (full context memory)
 * ► OFFLINE fallback if no API key provided
 */

// Built-in Gemini API key for instant out-of-the-box live AI
const BUILTIN_GEMINI_KEY = atob("QVEuQWI4Uk42TEFKbjVTeHVvSWN3QnoxSGNaX2NtVE04SXU4U3BrZUc5RF96X2MzaGpaOUE=");

const CityBrainChatbot = {

    // ── Persistent Conversation History (Gemini format) ──────────────────────
    history: [],

    // ── Runtime State ─────────────────────────────────────────────────────────
    isStreaming: false,
    context: {
        lastTopic: null,
        lastZone: null,
        interactionCount: 0
    },

    // ── Config ────────────────────────────────────────────────────────────────
    config: {
        apiKey: "",
        model: "gemini-2.5-flash",
        offlineMode: false   // active with built-in or custom key
    },

    // ── Gemini API endpoint ───────────────────────────────────────────────────
    get ENDPOINT() {
        return `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(this.config.apiKey)}`;
    },

    // ── System Instruction (sent with every Gemini request) ──────────────────
    SYSTEM_PROMPT: `You are CITYBRAIN AI — a fast, natural, highly intelligent conversational AI assistant powered by Google Gemini, dedicated to Chennai Smart City.
You speak naturally, warmly, and directly just like Gemini, with deep real-time domain knowledge of Chennai's urban infrastructure, traffic, pollution, water resources, and power grid.

Key Chennai Context:
• City: Chennai, Tamil Nadu, India (population ~11.5M metro).
• Traffic: 68% average congestion; key corridors include Anna Salai, GST Road, OMR (IT expressway), Kathipara / Guindy, and T. Nagar.
• Air Quality (AQI): Baseline ~142 (Moderate). Industrial/freight zones (Koyambedu, Port, Guindy) are higher; coastal zones (Adyar, Besant Nagar) are cleaner.
• Water: 985 MLD daily demand vs 1,050 MLD supply; reservoirs: Chembarambakkam (85%), Poondi (76%), Red Hills, Cholavaram; Minjur & Nemmeli desalination plants.
• Electricity: 3,920 MW peak demand against 4,500 MW grid capacity (TANGEDCO).
• Urban Infrastructure: Health score ~74/100; active investments in Metro Phase 2, smart signals, and stormwater drainage.

Guidelines:
1. Respond immediately, naturally, and conversationally. Avoid robotic formulas or unnecessary filler.
2. Structure answers cleanly with Markdown, bullet points, and bold text when explaining complex city data.
3. For what-if scenarios or simulations, give clear, realistic projections and practical urban planning insights.
4. If asked general or conversational questions, converse naturally and fluidly like Google Gemini.`,

    // ── Welcome message ───────────────────────────────────────────────────────
    WELCOME: "🌐 **CITYBRAIN NEURAL CORE ONLINE**\n\nI'm your AI copilot for Chennai's smart city grid. Ask me anything — traffic forecasts, pollution hotspots, water reserves, what-if simulations, or just a natural conversation.\n\n*Configure a free Gemini API key above to unlock full AI mode with streaming responses!*",

    // ─────────────────────────────────────────────────────────────────────────
    //  INITIALISE
    // ─────────────────────────────────────────────────────────────────────────
    init() {
        this.loadConfig();
        this.renderKeySetupUI();
        this.bindEvents();
        this.loadChatHistory();
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  CONFIG
    // ─────────────────────────────────────────────────────────────────────────
    loadConfig() {
        const saved = window.StorageManager.load("citybrain_gemini_config", null);
        // Use user-saved custom key if available, otherwise default to built-in key
        const activeKey = (saved && saved.apiKey !== undefined && saved.apiKey !== "") ? saved.apiKey : BUILTIN_GEMINI_KEY;
        const activeModel = (saved && saved.model && saved.model !== "gemini-2.0-flash") ? saved.model : "gemini-2.5-flash";

        this.config.apiKey      = activeKey;
        this.config.model       = activeModel;
        this.config.offlineMode = !activeKey;

        const savedHistory = window.StorageManager.load("citybrain_gemini_history", []);
        this.history = savedHistory || [];
    },

    saveConfig(key, model) {
        this.config.apiKey      = key;
        this.config.model       = model || "gemini-2.5-flash";
        this.config.offlineMode = !key;
        window.StorageManager.save("citybrain_gemini_config", {
            apiKey: this.config.apiKey,
            model:  this.config.model
        });
        this.updateStatusBadge();
    },

    saveHistory() {
        // Keep last 40 turns
        const trimmed = this.history.slice(-40);
        this.history = trimmed;
        window.StorageManager.save("citybrain_gemini_history", trimmed);
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  KEY SETUP UI (rendered inside the HUD header area)
    // ─────────────────────────────────────────────────────────────────────────
    renderKeySetupUI() {
        const panel = document.getElementById("gemini-key-panel");
        if (!panel) return;

        const hasKey = !!this.config.apiKey;

        panel.innerHTML = `
            <div class="gemini-setup-bar ${hasKey ? 'setup-connected' : 'setup-needs-key'}">
                ${hasKey ? `
                    <div class="setup-status connected">
                        <span class="setup-dot"></span>
                        <span class="setup-label">Gemini AI Connected</span>
                        <span class="setup-model">${this.config.model}</span>
                    </div>
                    <button class="btn-setup-change" id="btn-change-api-key" title="Change API Key">
                        <i class="fa-solid fa-key"></i> Change Key
                    </button>
                ` : `
                    <div class="setup-status needs-key">
                        <i class="fa-brands fa-google" style="color:#fbbf24"></i>
                        <span class="setup-label text-yellow">Add FREE Gemini API Key for real AI</span>
                    </div>
                    <button class="btn-setup-change btn-setup-add" id="btn-add-api-key">
                        <i class="fa-solid fa-plus"></i> Add Key (Free)
                    </button>
                `}
            </div>
            <div class="gemini-key-form" id="gemini-key-form" style="display:none;">
                <div class="key-form-inner">
                    <div class="key-form-info">
                        <i class="fa-brands fa-google text-cyan"></i>
                        <div>
                            <strong class="text-white">Google Gemini — 100% Free</strong>
                            <div class="text-xs text-muted">1,500 requests/day · No credit card needed</div>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" class="key-link">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Get free key at aistudio.google.com
                            </a>
                        </div>
                    </div>
                    <div class="key-form-fields">
                        <input type="password" id="gemini-key-input" class="gemini-key-input"
                            placeholder="Gemini API key (Pre-configured Built-in)"
                            value="${this.config.apiKey || ''}" autocomplete="off" spellcheck="false">
                        <select id="gemini-model-select" class="gemini-model-select">
                            <option value="gemini-2.5-flash" ${this.config.model === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash ✦ (Instant & Natural - Recommended)</option>
                            <option value="gemini-flash-latest" ${this.config.model === 'gemini-flash-latest' ? 'selected' : ''}>gemini-flash-latest (Auto-Updated Fast)</option>
                            <option value="gemini-3.8-flash" ${this.config.model === 'gemini-3.8-flash' ? 'selected' : ''}>gemini-3.8-flash (Advanced Model)</option>
                            <option value="gemini-3.5-flash-lite" ${this.config.model === 'gemini-3.5-flash-lite' ? 'selected' : ''}>gemini-3.5-flash-lite (Ultra Lightweight)</option>
                            <option value="gemini-3.7-flash" ${this.config.model === 'gemini-3.7-flash' ? 'selected' : ''}>gemini-3.7-flash (Next-Gen)</option>
                        </select>
                    </div>
                    <div class="key-form-actions">
                        <button class="btn-key-save" id="btn-save-gemini-key">
                            <i class="fa-solid fa-bolt"></i> Connect AI
                        </button>
                        <button class="btn-key-clear" id="btn-clear-gemini-key">
                            Use Offline Engine
                        </button>
                    </div>
                    <div id="key-test-status" class="key-test-status" style="display:none;"></div>
                </div>
            </div>
        `;

        this.bindSetupEvents();
    },

    bindSetupEvents() {
        const openBtn  = document.getElementById("btn-add-api-key") || document.getElementById("btn-change-api-key");
        const form     = document.getElementById("gemini-key-form");
        const saveBtn  = document.getElementById("btn-save-gemini-key");
        const clearBtn = document.getElementById("btn-clear-gemini-key");

        if (openBtn && form) {
            openBtn.addEventListener("click", () => {
                form.style.display = form.style.display === "none" ? "block" : "none";
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener("click", () => this.testAndSaveKey());
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                this.saveConfig("", "gemini-2.5-flash");
                window.StorageManager.remove("citybrain_gemini_config");
                if (form) form.style.display = "none";
                this.renderKeySetupUI();
                this.updateStatusBadge();
            });
        }

        // Enter key in input
        const keyInput = document.getElementById("gemini-key-input");
        if (keyInput) {
            keyInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") this.testAndSaveKey();
            });
        }
    },

    async testAndSaveKey() {
        const key   = (document.getElementById("gemini-key-input")?.value || "").trim() || BUILTIN_GEMINI_KEY;
        const model = document.getElementById("gemini-model-select")?.value || "gemini-2.5-flash";
        const status = document.getElementById("key-test-status");

        if (!key) {
            this.showKeyStatus("⚠️ Please paste your API key first.", "status-warn");
            return;
        }

        this.showKeyStatus("🔄 Verifying key with Gemini...", "status-testing");

        try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
            const res = await fetch(testUrl, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "X-goog-api-key": key
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Respond only with: OK" }] }]
                })
            });

            if (res.ok) {
                this.saveConfig(key, model);
                this.showKeyStatus("✅ Connected! AI streaming is now active.", "status-ok");
                setTimeout(() => {
                    document.getElementById("gemini-key-form").style.display = "none";
                    this.renderKeySetupUI();
                    this.updateStatusBadge();
                }, 1200);
            } else {
                const err = await res.json().catch(() => ({}));
                const msg = err?.error?.message || `HTTP ${res.status}`;
                this.showKeyStatus(`❌ Status: ${msg}`, "status-error");
            }
        } catch (e) {
            this.showKeyStatus(`❌ Network error: ${e.message}`, "status-error");
        }
    },

    showKeyStatus(msg, cls) {
        const el = document.getElementById("key-test-status");
        if (!el) return;
        el.style.display = "block";
        el.className = `key-test-status ${cls}`;
        el.innerHTML = msg;
    },

    updateStatusBadge() {
        const badge = document.getElementById("llm-mode-badge");
        if (!badge) return;
        if (this.config.apiKey) {
            badge.textContent = "Gemini AI ✦ Live";
            badge.className = "badge-gemini-live";
        } else {
            badge.textContent = "Offline Engine";
            badge.className = "badge-offline";
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  EVENT BINDING
    // ─────────────────────────────────────────────────────────────────────────
    bindEvents() {
        const input   = document.getElementById("chat-input");
        const sendBtn = document.getElementById("btn-chat-send");
        const clearBtn= document.getElementById("btn-clear-chat");

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
            clearBtn.addEventListener("click", () => this.clearChat());
        }

        // Suggestion chips
        document.querySelectorAll(".suggestion-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                const q = chip.getAttribute("data-query") || chip.innerText.trim();
                if (input) { input.value = q; this.handleUserSubmit(); }
            });
        });
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  SUBMIT HANDLER
    // ─────────────────────────────────────────────────────────────────────────
    async handleUserSubmit() {
        const input = document.getElementById("chat-input");
        if (!input || this.isStreaming) return;

        const userText = input.value.trim();
        if (!userText) return;
        input.value = "";

        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Render user bubble
        this.appendMessage("user", userText, ts);
        this.pushHistory("user", userText);

        // Show typing
        this.showTyping();

        try {
            if (this.config.apiKey && !this.config.offlineMode) {
                await this.streamGeminiResponse(userText);
            } else {
                // Offline engine with simulated delay
                const response = await this.offlineEngine(userText);
                this.hideTyping();
                await this.streamOfflineResponse(response);
            }
        } catch (err) {
            this.hideTyping();
            console.error("Chat error:", err);
            const fallbackText = await this.offlineEngine(userText);
            this.appendMessage("bot",
                `⚠️ *[Live Engine Notice: ${err.message}]*\n\n${fallbackText}`,
                new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            );
            this.pushHistory("model", fallbackText);
        }

        this.context.interactionCount++;
        this.saveHistory();
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  GEMINI STREAMING API (Ultra-low latency, natural output)
    // ─────────────────────────────────────────────────────────────────────────
    async streamGeminiResponse(userText) {
        this.isStreaming = true;

        const payload = {
            system_instruction: { parts: [{ text: this.SYSTEM_PROMPT }] },
            contents: this.history.map(h => ({
                role: h.role,
                parts: [{ text: h.text }]
            })),
            generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 1500,
                thinkingConfig: {
                    thinkingBudget: 0
                }
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4800); // 4.8s fast timeout

        let response;
        try {
            response = await fetch(this.ENDPOINT, {
                method: "POST",
                signal: controller.signal,
                headers: { 
                    "Content-Type": "application/json",
                    "X-goog-api-key": this.config.apiKey
                },
                body: JSON.stringify(payload)
            });

            // If thinkingConfig is not recognized by a specific endpoint/model, retry without it
            if (!response.ok && payload.generationConfig?.thinkingConfig) {
                delete payload.generationConfig.thinkingConfig;
                response = await fetch(this.ENDPOINT, {
                    method: "POST",
                    signal: controller.signal,
                    headers: { 
                        "Content-Type": "application/json",
                        "X-goog-api-key": this.config.apiKey
                    },
                    body: JSON.stringify(payload)
                });
            }
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson?.error?.message || `API error ${response.status}`);
        }

        this.hideTyping();

        // Create streaming bubble
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const { bubble, msgDiv } = this.createBotBubble(ts);

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = "";
        let fullText  = "";

        // Blink cursor
        bubble.innerHTML = '<span class="stream-cursor"></span>';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const raw = line.slice(6).trim();
                    if (!raw || raw === "[DONE]") continue;

                    try {
                        const json  = JSON.parse(raw);
                        const parts = json?.candidates?.[0]?.content?.parts || [];
                        let chunk = "";
                        for (const p of parts) {
                            if (p.thought) continue; // Skip raw internal thinking tokens
                            if (p.text) chunk += p.text;
                        }
                        if (chunk) {
                            fullText += chunk;
                            bubble.innerHTML = this.formatMarkdown(fullText) + '<span class="stream-cursor"></span>';
                            this.scrollToBottom();
                        }
                    } catch (_) { /* partial JSON, skip */ }
                }
            }
        } finally {
            reader.cancel().catch(() => {});
        }

        // Finalise
        bubble.innerHTML = this.formatMarkdown(fullText);
        this.scrollToBottom();
        this.pushHistory("model", fullText);
        this.isStreaming = false;
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  NATURAL CONVERSATIONAL ENGINE (Instant, Answers Every Question)
    // ─────────────────────────────────────────────────────────────────────────
    async offlineEngine(text) {
        await new Promise(r => setTimeout(r, 40));
        const t = text.toLowerCase().trim();
        const base = window.CITY_DATA?.baseline || {
            trafficCongestion: 68,
            aqi: 142,
            waterConsumptionMLD: 985,
            waterSupplyCapacityMLD: 1050,
            electricityDemandMW: 3920,
            infrastructureHealth: 74
        };
        const zones = window.CITY_DATA?.zones || [];

        // 1. Generic Percentage What-If Simulation Engine
        const pctMatch = text.match(/([+-]?\d+)\s*%/);
        if (pctMatch) {
            const pctVal = parseInt(pctMatch[1]);
            if (t.includes("population") || t.includes("citizen") || t.includes("people")) {
                const sim = window.SimulationEngine?.compute({ population: pctVal, vehicleUsage: 0, roadCapacity: 0, waterSupply: 0, electricityDemand: 0, pollutionControl: 0 });
                if (sim) return `📊 **Simulation Analysis: ${pctVal > 0 ? '+' : ''}${pctVal}% Population Growth**\n\n• **Traffic Congestion:** Reaches **${sim.simulated.traffic}%** (${sim.deltas.trafficPct > 0 ? '+' : ''}${sim.deltas.trafficPct}%)\n• **Daily Water Demand:** **${sim.simulated.waterDemand} MLD** (Deficit of **${sim.simulated.waterDeficit} MLD**)\n• **Grid Electricity Draw:** **${sim.simulated.electricity} MW** (${sim.deltas.electricityPct > 0 ? '+' : ''}${sim.deltas.electricityPct}%)\n• **Overall Infrastructure Health:** **${sim.simulated.health}/100**\n\n💡 **AI Strategic Recommendation:**\nPrioritize accelerated commissioning of the Minjur 150 MLD desalination expansion and fast-track Chennai Metro Phase 2 Corridors 3 & 5 to absorb commuter surges.`;
            }
            if (t.includes("vehicle") || t.includes("car") || t.includes("traffic")) {
                const sim = window.SimulationEngine?.compute({ population: 0, vehicleUsage: pctVal, roadCapacity: 0, waterSupply: 0, electricityDemand: 0, pollutionControl: Math.abs(pctVal) });
                if (sim) return `🚗 **Simulation Analysis: ${pctVal > 0 ? '+' : ''}${pctVal}% Vehicular Density**\n\n• **Congestion Level:** Moves to **${sim.simulated.traffic}%** (${sim.deltas.trafficPct > 0 ? '+' : ''}${sim.deltas.trafficPct}%)\n• **Air Quality Index (AQI):** Projected at **${sim.simulated.aqi}** (Baseline: ${base.aqi})\n• **Average Arterial Speed:** ~${Math.max(12, Math.round(19.2 * (100 - sim.simulated.traffic) / 32))} km/h\n• **Infrastructure Score:** **${sim.simulated.health}/100**\n\n💡 **AI Action Item:**\nDeploy automated dynamic green corridors along Poonamallee High Road and GST Road to maintain freight throughput.`;
            }
            if (t.includes("water") || t.includes("reservoir") || t.includes("supply")) {
                const sim = window.SimulationEngine?.compute({ population: 0, vehicleUsage: 0, roadCapacity: 0, waterSupply: pctVal, electricityDemand: 0, pollutionControl: 0 });
                if (sim) return `💧 **Simulation Analysis: ${pctVal > 0 ? '+' : ''}${pctVal}% Water Supply Adjustment**\n\n• **Available Net Supply:** **${sim.simulated.waterSupply} MLD** vs ${sim.simulated.waterDemand} MLD demand\n• **Net Balance:** ${sim.simulated.waterDeficit > 0 ? `Deficit of **${sim.simulated.waterDeficit} MLD**` : `Surplus buffer of **${sim.simulated.waterSurplus} MLD**`}\n• **Key Reservoir Reserve Margin:** Chembarambakkam & Poondi projected at 82% capacity\n\n💡 **Conservation Strategy:**\nActivate localized greywater recycling in commercial IT parks along OMR to preserve tertiary reserves.`;
            }
            if (t.includes("electricity") || t.includes("power") || t.includes("energy")) {
                const sim = window.SimulationEngine?.compute({ population: 0, vehicleUsage: 0, roadCapacity: 0, waterSupply: 0, electricityDemand: pctVal, pollutionControl: 0 });
                if (sim) return `⚡ **Simulation Analysis: ${pctVal > 0 ? '+' : ''}${pctVal}% Grid Load Shift**\n\n• **Total Peak Demand:** **${sim.simulated.electricity} MW** (Grid Maximum Capacity: 4,500 MW)\n• **Operating Reserve Margin:** **${Math.round((4500 - sim.simulated.electricity) / 45)}%**\n• **Substation Health Status:** ${sim.simulated.electricity > 4300 ? '⚠️ Critical Stress (Load Shedding Risk)' : '✅ Stable & Balanced'}\n\n💡 **Grid Stabilization:**\nIncentivize commercial building HVAC pre-cooling between 06:00 and 09:00 AM before industrial peak draw.`;
            }
        }

        // 2. Specific Peak Hours & Commuter Questions
        if (t.includes("6 pm") || t.includes("peak hour") || t.includes("evening") || t.includes("rush hour") || t.includes("morning")) {
            return `🚦 **Chennai Peak Commuter Forecast**\n\n• **Peak Congestion Windows:** **08:30 – 11:00 AM** (Inbound) and **17:30 – 20:30 PM** (Outbound).\n• **Projected Evening Peak Congestion:** **91%** across primary corridors.\n• **High-Impact Chokepoints:**\n  1. **Kathipara Cloverleaf & Guindy Flyover:** Inbound GST merge (speeds down to 10-14 km/h).\n  2. **OMR Tech Expressway (Tidel Park to Sholinganallur):** Major evening workforce egress.\n  3. **Poonamallee High Road & Koyambedu Roundabout:** Heavy regional logistics & intercity buses.\n\n💡 **Best Route Advice:** Take Chennai Metro (Blue & Green Lines) — operates with 4.5-minute headways, bypassing 40+ minutes of arterial road congestion.`;
        }

        // 3. Traffic & Road Management
        if (t.includes("traffic") || t.includes("congestion") || t.includes("signal") || t.includes("road") || t.includes("jam")) {
            return `🚦 **Chennai Metropolitan Traffic Intelligence**\n\n• **Citywide Real-Time Congestion:** **${base.trafficCongestion}%**\n• **Average Arterial Speed:** 18.8 km/h\n• **Highest Congestion Zones:** T. Nagar (88%), Guindy (84%), Koyambedu (86%)\n• **Smooth Flow Corridors:** East Coast Road (ECR) at 44%, Outer Ring Road (ORR) at 36%\n• **Smart City Infrastructure:** 180+ AI-actuated adaptive signal controllers active across GCC intersections, automatically adjusting green splits based on camera queues.`;
        }

        // 4. Pollution & Environmental Health
        if (t.includes("pollution") || t.includes("aqi") || t.includes("air") || t.includes("smog") || t.includes("pm2.5") || t.includes("environment")) {
            return `🌫️ **Atmospheric & AQI Environmental Report**\n\n• **Metropolitan Average AQI:** **${base.aqi}** (Moderate — Sensitivities apply)\n• **Pollution Hotspots:**\n  1. **Chennai Port & Parrys (AQI 182):** Heavy maritime diesel emissions & container logistics.\n  2. **Koyambedu CMBT (AQI 175):** Dense diesel bus and commercial cargo exhaust.\n  3. **Guindy Industrial Estate (AQI 172):** Manufacturing output & freight traffic.\n• **Cleanest Air Pockets:** Adyar & Besant Nagar (**AQI 98**) and ECR coastline, benefiting from steady Bay of Bengal sea breezes and dense urban tree canopy.`;
        }

        // 5. Water Management, Reservoirs & Desalination
        if (t.includes("water") || t.includes("reservoir") || t.includes("lake") || t.includes("desalination") || t.includes("chembarambakkam") || t.includes("poondi")) {
            return `💧 **Chennai Metro Water & Lake Storage Status**\n\n• **Daily City Demand:** **${base.waterConsumptionMLD} MLD**\n• **Daily Total Supply Capacity:** **${base.waterSupplyCapacityMLD} MLD** (Safe operational buffer: +65 MLD)\n• **Primary Reservoirs:**\n  • **Chembarambakkam:** 3,120 / 3,645 Mcft (**85.6% Full**)\n  • **Poondi Lake:** 2,450 / 3,231 Mcft (**75.8% Full**)\n  • **Red Hills (Puzhal):** 2,890 / 3,300 Mcft (**87.5% Full**)\n• **Desalination Plants:** Nemmeli (150 MLD) and Minjur (100 MLD) operating at 100% baseload.\n• **Mandatory Rainwater Harvesting (RWH):** Active across 94% of documented residential structures.`;
        }

        // 6. Electricity, Energy & Power Grid
        if (t.includes("electricity") || t.includes("power") || t.includes("grid") || t.includes("tangedco") || t.includes("energy") || t.includes("solar")) {
            return `⚡ **TANGEDCO Power Grid Intelligence**\n\n• **Real-Time City Demand:** **${base.electricityDemandMW} MW**\n• **Grid Capacity Ceiling:** 4,500 MW (Grid Reserve Margin: **13.5%**)\n• **Top Consumption Zones:** OMR Tech Corridor (520 MW), T. Nagar Commercial Substation (460 MW), Ambattur Industrial Estate (410 MW)\n• **Green Energy Mix:** 28% renewable contribution during peak solar hours (rooftop solar + southern Tamil Nadu wind corridor wheeling).\n• **Grid Stability:** Operating at 50.01 Hz nominal frequency with zero unscheduled load shedding.`;
        }

        // 7. Metro Rail & Public Transit
        if (t.includes("metro") || t.includes("train") || t.includes("bus") || t.includes("mtc") || t.includes("transit") || t.includes("suburban")) {
            return `🚇 **Chennai Public Transit Network Status**\n\n• **Chennai Metro Phase 1:** Blue Line (Wimco Nagar to Airport) & Green Line (Central to St. Thomas Mount) carrying ~285,000 riders daily.\n• **Phase 2 Expansion (Under Construction):** 116.1 km across 3 Corridors (Madhavaram to SIPCOT, Light House to Poonamallee, Madhavaram to Sholinganallur).\n• **Suburban Rail:** Chennai Central to Arakkonam & Chennai Beach to Tambaram lines operating with high punctuality.\n• **MTC Smart Bus Fleet:** 3,200 active buses with GPS tracking and electronic ticketing integration via the Chennai Commute Unified App.`;
        }

        // 8. Monsoons, Rain, Drainage & Flood Safety
        if (t.includes("rain") || t.includes("flood") || t.includes("monsoon") || t.includes("storm") || t.includes("drain") || t.includes("cyclone")) {
            return `🌧️ **Chennai Weather & Flood Preparedness Intelligence**\n\n• **Current Status:** Stormwater drainage monitoring online across all 15 Greater Chennai Corporation (GCC) zones.\n• **Flood Resilience Infrastructure:**\n  • 1,200+ km of integrated Stormwater Drains (SWD) completed under Singara Chennai 2.0.\n  • Automated sensor gates active at Cooum River and Buckingham Canal discharge points.\n  • High-capacity mobile dewatering pumps prepositioned at vulnerable low-lying zones (Velachery, Mudichur, Perambur).\n• **Emergency GCC Helpline:** Dial **1913** for round-the-clock flood control and civic rescue.`;
        }

        // 9. Specific Zone Lookups
        const matchedZone = zones.find(z => t.includes(z.name.toLowerCase().split(" ")[0]) || t.includes(z.name.toLowerCase()));
        if (matchedZone) {
            return `📍 **Smart Zone Dossier: ${matchedZone.name}**\n\n• **Zone Classification:** ${matchedZone.zoneType}\n• **Congestion Status:** **${matchedZone.congestion}%** (${matchedZone.status})\n• **Air Quality Index:** **${matchedZone.aqi} AQI**\n• **Resource Draw:** Water: **${matchedZone.waterDemandMLD} MLD** | Electricity: **${matchedZone.electricityMW} MW**\n\n${matchedZone.description}\n\n💡 **Zone Insight:** Connected to Central SCADA urban command and AI adaptive signal loops.`;
        }

        // 10. Tourism, Culture, Food & Attractions
        if (t.includes("visit") || t.includes("place") || t.includes("tourist") || t.includes("beach") || t.includes("food") || t.includes("temple") || t.includes("culture")) {
            return `🌴 **Chennai City Highlights & Heritage**\n\n• **Iconic Landmarks:**\n  • **Marina Beach:** World's second longest urban natural beach; vibrant evening promenade.\n  • **Kapaleeshwarar Temple (Mylapore):** 7th-century Dravidian architectural marvel.\n  • **Fort St. George & Ripon Building:** Historic colonial civic hubs.\n  • **Guindy National Park:** Unique protected wildlife sanctuary located entirely inside city limits.\n• **Culinary Specialties:** Authentic Madras filter coffee, hot ghee idlis & crispy dosas, Chettinad specialties, and Royapuram seafood.\n• **Cultural Hub:** UNESCO Creative Cities Network member for rich Carnatic musical legacy and Bharatanatyam dance arts.`;
        }

        // 11. Technology, AI, Economy & Smart City Architecture
        if (t.includes("how does") || t.includes("ai") || t.includes("smart city") || t.includes("sensor") || t.includes("iot") || t.includes("economy")) {
            return `💡 **CityBrain Smart City Architecture**\n\n• **Unified Urban AI Core:** Synthesizes telemetry from 4,500+ IoT sensors, camera feeds, weather stations, and reservoir telemetry across Chennai.\n• **Digital Twin Engine:** Uses mathematical differential models to simulate scenarios before real-world infrastructure investments.\n• **Economic Hub:** Known as the *"Detroit of Asia"* (automotive powerhouse) and India's SaaS capital, contributing over \$110B to national GDP.\n• **Live Subsystems:** Intelligent Traffic Management System (ITMS), SCADA automated water distribution, and GIS-mapped subterranean utilities.`;
        }

        // 12. Greetings & Salutations
        if (/^(hi|hello|hey|vanakkam|namaste|good morning|good evening|sup)/i.test(t)) {
            return `Vanakkam! 🙏 **Welcome to CITYBRAIN AI**\n\nI am your intelligent copilot for Chennai Smart City. I can help you with:\n• **Real-Time Grid Status:** Traffic congestion, air quality (AQI), water reserves, and electrical draw.\n• **Predictive Forecasts:** Rush-hour chokepoints and weather flood resilience.\n• **What-If Simulations:** Ask *"What happens if population grows 20%?"* or *"What if vehicles drop 15%?"*\n• **Urban Exploration:** Metro routes, zone dossiers, and city heritage.\n\nWhat would you like to know about Chennai today?`;
        }

        // 13. Help & Capabilities
        if (t.includes("help") || t.includes("who are you") || t.includes("what can you do") || t.includes("features")) {
            return `🤖 **What CityBrain AI Can Do For You**\n\n• **🚦 Traffic Analytics:** Real-time arterial speeds, signal timings, and alternative metro routes.\n• **🌫️ Air & Ecology:** Ward-level AQI readings, pollution sources, and coastal climate patterns.\n• **💧 Water Resources:** Reservoir storage capacities, desalination outputs, and conservation models.\n• **⚡ Energy Intelligence:** TANGEDCO peak load forecasts and rooftop solar metrics.\n• **🔮 What-If Simulations:** Compute cross-sector impacts of any policy or demographic change.\n• **📍 Neighborhood Intel:** Deep dossiers on Anna Nagar, T. Nagar, OMR, Guindy, Velachery, and more.\n\nFeel free to ask any question naturally!`;
        }

        // 14. Universal Natural Conversational Answer for ANY Other Question
        return `🧠 **CITYBRAIN Intelligence Analysis**\n\nRegarding: *"**${text}**"*\n\nHere is how this connects to Chennai's smart urban ecosystem:\n\n• **Urban Context:** Chennai is rapidly evolving under Singara Chennai 2.0 with connected infrastructure across 426 sq km.\n• **Live City Vitals:**\n  - Traffic Congestion: **${base.trafficCongestion}%** (Peak bottlenecks monitored)\n  - Air Quality Index: **${base.aqi} AQI** (Moderate coastal dispersion)\n  - Water Supply: **${base.waterConsumptionMLD} MLD** draw against **${base.waterSupplyCapacityMLD} MLD** capacity\n  - Electrical Grid: **${base.electricityDemandMW} MW** load (13.5% safe reserve)\n\n• **Insight:** To simulate changes on this topic, try asking a What-If query (e.g., *"What if vehicle density decreases 20%?"* or *"Predict traffic at 6 PM"*).`;
    },

    // Simulated character-stream for offline responses (High velocity, ultra-smooth)
    async streamOfflineResponse(text) {
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const { bubble } = this.createBotBubble(ts);
        this.isStreaming = true;

        let i = 0;
        bubble.innerHTML = '<span class="stream-cursor"></span>';

        await new Promise(resolve => {
            const iv = setInterval(() => {
                i = Math.min(i + 22, text.length);
                bubble.innerHTML = this.formatMarkdown(text.substring(0, i)) + '<span class="stream-cursor"></span>';
                this.scrollToBottom();
                if (i >= text.length) {
                    clearInterval(iv);
                    bubble.innerHTML = this.formatMarkdown(text);
                    this.scrollToBottom();
                    resolve();
                }
            }, 10);
        });

        this.pushHistory("model", text);
        this.isStreaming = false;
    },
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  DOM HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    appendMessage(sender, text, ts) {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;
        const div = document.createElement("div");
        div.className = `chat-message ${sender}-message`;
        div.innerHTML = sender === "user"
            ? `<div class="msg-avatar user-avatar"><i class="fa-solid fa-user-astronaut"></i></div>
               <div class="msg-content-wrapper">
                   <div class="msg-header"><span class="msg-sender">YOU</span><span class="msg-time">${ts}</span></div>
                   <div class="msg-bubble user-bubble">${this.escapeHtml(text)}</div>
               </div>`
            : `<div class="msg-avatar bot-avatar"><i class="fa-solid fa-brain"></i></div>
               <div class="msg-content-wrapper">
                   <div class="msg-header"><span class="msg-sender">CITYBRAIN AI</span><span class="msg-time">${ts}</span></div>
                   <div class="msg-bubble bot-bubble">${this.formatMarkdown(text)}</div>
               </div>`;
        container.appendChild(div);
        this.scrollToBottom();
    },

    createBotBubble(ts) {
        const container = document.getElementById("chat-messages-container");
        const msgDiv = document.createElement("div");
        msgDiv.className = "chat-message bot-message";
        msgDiv.innerHTML = `
            <div class="msg-avatar bot-avatar"><i class="fa-solid fa-brain"></i></div>
            <div class="msg-content-wrapper">
                <div class="msg-header"><span class="msg-sender">CITYBRAIN AI</span><span class="msg-time">${ts}</span></div>
                <div class="msg-bubble bot-bubble"></div>
            </div>`;
        container.appendChild(msgDiv);
        const bubble = msgDiv.querySelector(".bot-bubble");
        this.scrollToBottom();
        return { bubble, msgDiv };
    },

    showTyping() {
        const container = document.getElementById("chat-messages-container");
        let ind = document.getElementById("chat-typing-indicator");
        if (!ind) {
            ind = document.createElement("div");
            ind.id = "chat-typing-indicator";
            ind.className = "chat-typing-indicator";
            ind.innerHTML = `
                <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                <span class="typing-text">CityBrain AI is responding...</span>`;
            container.appendChild(ind);
        }
        ind.style.display = "flex";
        this.scrollToBottom();
    },

    hideTyping() {
        const ind = document.getElementById("chat-typing-indicator");
        if (ind) ind.style.display = "none";
    },

    scrollToBottom() {
        const c = document.getElementById("chat-messages-container");
        if (c) c.scrollTop = c.scrollHeight;
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  HISTORY
    // ─────────────────────────────────────────────────────────────────────────
    pushHistory(role, text) {
        // Gemini uses "model" not "assistant"
        this.history.push({ role, text });
    },

    loadChatHistory() {
        const container = document.getElementById("chat-messages-container");
        if (!container) return;
        container.innerHTML = "";

        const stored = window.StorageManager.load(window.StorageManager.KEYS.CHAT_HISTORY, []) || [];
        if (stored.length === 0) {
            this.appendMessage("bot", this.WELCOME, "Just now");
            return;
        }
        stored.forEach(m => this.appendMessage(m.sender || m.role, m.text, m.timestamp || ""));
        this.scrollToBottom();
    },

    clearChat() {
        if (!confirm("Clear all chat history?")) return;
        this.history = [];
        window.StorageManager.remove(window.StorageManager.KEYS.CHAT_HISTORY);
        window.StorageManager.remove("citybrain_gemini_history");
        const c = document.getElementById("chat-messages-container");
        if (c) c.innerHTML = "";
        this.appendMessage("bot", this.WELCOME, "Just now");
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  TEXT UTILS
    // ─────────────────────────────────────────────────────────────────────────
    formatMarkdown(text) {
        if (!text) return "";
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\n\n/g, "<br><br>")
            .replace(/\n•/g, "<br>•")
            .replace(/\n(\d+\.)/g, "<br>$1")
            .replace(/\n/g, "<br>");
    },

    escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
};

window.CityBrainChatbot = CityBrainChatbot;
