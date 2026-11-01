/**
 * CITYBRAIN - AI SMART CITY SIMULATOR
 * Chatbot Engine v2 (chatbot.js)
 *
 * ► FREE AI: Google Gemini 2.0 Flash (gemini-2.0-flash)
 *   Free tier: 1,500 requests/day · No credit card required
 *   Get key → https://aistudio.google.com/app/apikey
 *
 * ► REAL-TIME STREAMING via Server-Sent Events (SSE ReadableStream)
 * ► MULTI-TURN conversation history (full context memory)
 * ► OFFLINE fallback if no API key provided
 */

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
        model: "gemini-2.0-flash",
        offlineMode: true   // flips to false when valid key is saved
    },

    // ── Gemini API endpoint ───────────────────────────────────────────────────
    get ENDPOINT() {
        return `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`;
    },

    // ── System Instruction (sent with every Gemini request) ──────────────────
    SYSTEM_PROMPT: `You are CITYBRAIN AI ASSISTANT — an elite urban intelligence engine monitoring
Chennai, India's smart city grid in real time.

Your personality: precise, futuristic, slightly dramatic — like a mission control operator.
Keep responses concise but rich (use bullet lists and bold text freely).
You know everything about Chennai's traffic, pollution (AQI), water reservoirs,
electricity grid, and urban infrastructure.

Key facts you always know:
• City: Chennai, Tamil Nadu, India — population 11.5 million (metro)
• Traffic congestion baseline: 68% citywide, worst at T. Nagar (88%), Guindy (84%)
• AQI baseline: 142 (Moderate). Worst: Koyambedu (175), Port (182). Best: Adyar (98)
• Water: 985 MLD demand, 1050 MLD supply. Reservoirs: Chembarambakkam 85%, Poondi 76%
• Electricity: 3,920 MW demand vs 4,500 MW grid cap (TANGEDCO). 13% reserve margin
• Infrastructure health: 74/100. Worst sub-sector: Stormwater Drainage (58/100)

Answer questions about the city warmly and intelligently.
When users ask what-if scenarios, compute approximate impacts using common sense ratios.
Always label simulation outputs as "illustrative projections" not verified forecasts.`,

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
        if (saved && saved.apiKey) {
            this.config.apiKey    = saved.apiKey;
            this.config.model     = saved.model || "gemini-2.0-flash";
            this.config.offlineMode = false;
        }
        const savedHistory = window.StorageManager.load("citybrain_gemini_history", []);
        this.history = savedHistory || [];
    },

    saveConfig(key, model) {
        this.config.apiKey     = key;
        this.config.model      = model || "gemini-2.0-flash";
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
                            placeholder="Paste your Gemini API key → AIzaSy..."
                            value="${this.config.apiKey || ''}" autocomplete="off" spellcheck="false">
                        <select id="gemini-model-select" class="gemini-model-select">
                            <option value="gemini-2.0-flash" ${this.config.model === 'gemini-2.0-flash' ? 'selected' : ''}>gemini-2.0-flash (Recommended)</option>
                            <option value="gemini-1.5-flash" ${this.config.model === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash</option>
                            <option value="gemini-1.5-flash-8b" ${this.config.model === 'gemini-1.5-flash-8b' ? 'selected' : ''}>gemini-1.5-flash-8b (Fastest)</option>
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
                this.saveConfig("", "gemini-2.0-flash");
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
        const key   = (document.getElementById("gemini-key-input")?.value || "").trim();
        const model = document.getElementById("gemini-model-select")?.value || "gemini-2.0-flash";
        const status = document.getElementById("key-test-status");

        if (!key) {
            this.showKeyStatus("⚠️ Please paste your API key first.", "status-warn");
            return;
        }

        this.showKeyStatus("🔄 Verifying key with Gemini...", "status-testing");

        try {
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            const res = await fetch(testUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
                this.showKeyStatus(`❌ Invalid key: ${msg}`, "status-error");
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
            this.appendMessage("bot",
                `⚠️ **Connection Error:** ${err.message}\n\nFalling back to offline engine...`,
                new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            );
        }

        this.context.interactionCount++;
        this.saveHistory();
    },

    // ─────────────────────────────────────────────────────────────────────────
    //  GEMINI STREAMING API
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
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        };

        const response = await fetch(this.ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

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
                        const chunk = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
    //  OFFLINE ENGINE (keyword + intent)
    // ─────────────────────────────────────────────────────────────────────────
    async offlineEngine(text) {
        await new Promise(r => setTimeout(r, 380));
        const t = text.toLowerCase();
        const base = window.CITY_DATA?.baseline || {};
        const zones = window.CITY_DATA?.zones || [];

        // Population what-if
        const popMatch = text.match(/population.{0,25}(\d+)\s*%/i);
        if (popMatch) {
            const pct = parseInt(popMatch[1]);
            const sim = window.SimulationEngine?.compute({ population: pct, vehicleUsage:0, roadCapacity:0, waterSupply:0, electricityDemand:0, pollutionControl:0 });
            if (sim) return `📊 **Simulation: +${pct}% Population Growth**\n\n• **Traffic:** ${sim.simulated.traffic}% congestion (${sim.deltas.trafficPct}% change)\n• **Water Demand:** ${sim.simulated.waterDemand} MLD — deficit of **${sim.simulated.waterDeficit} MLD**\n• **Electricity:** ${sim.simulated.electricity} MW (${sim.deltas.electricityPct}% change)\n• **City Health:** ${sim.simulated.health}/100\n\n💡 Accelerate the Outer Ring Road transit corridor and Perur desalination plant.`;
        }

        // Vehicle what-if
        const vehMatch = text.match(/vehicle.{0,20}(\d+)\s*%/i);
        if (vehMatch) {
            const pct = t.includes("decreas") || t.includes("reduc") ? -parseInt(vehMatch[1]) : parseInt(vehMatch[1]);
            const sim = window.SimulationEngine?.compute({ population:0, vehicleUsage:pct, roadCapacity:0, waterSupply:0, electricityDemand:0, pollutionControl:20 });
            if (sim) return `🚗 **Simulation: ${pct}% Vehicle Usage**\n\n• **Traffic:** Drops to **${sim.simulated.traffic}%** (${sim.deltas.trafficPct}%)\n• **AQI:** Improves to **${sim.simulated.aqi}** from ${base.aqi}\n• **Health Score:** ${sim.simulated.health}/100\n\n💡 Expand Chennai Metro Phase 2 and deploy EV feeder buses from suburban rail hubs.`;
        }

        // 6 PM / peak traffic
        if (t.includes("6 pm") || t.includes("peak") || t.includes("evening traffic")) {
            return `🚦 **Chennai 18:00 Peak Traffic Forecast**\n\n• **Projected Congestion:** **92%** (Critical — Red)\n• **Worst Bottlenecks:**\n  1. Kathipara Cloverleaf / Guindy — severe inbound merge\n  2. OMR Tidel Park to Perungudi — tech workforce egress (~12 km/h)\n  3. Poonamallee High Road & Koyambedu junction\n• **Best Alternative:** Chennai Metro (Blue/Green lines) — 5-min headway, bypasses 45 min of gridlock.`;
        }

        // Traffic general
        if (t.includes("traffic") || t.includes("congestion")) {
            return `🚦 **Live Traffic Intelligence**\n\n• **Citywide Congestion:** **${base.trafficCongestion || 68}%** — High load\n• **Most Congested:** T. Nagar (88%), Guindy (84%), Koyambedu (86%)\n• **Freest Corridor:** ECR — East Coast Road at 48%\n• **Average Speed:** 19.2 km/h across primary arterials\n• 180 AI-adaptive signals are active at major junctions right now.`;
        }

        // Pollution / AQI
        if (t.includes("pollution") || t.includes("aqi") || t.includes("air quality")) {
            return `🌫️ **Atmospheric Intelligence Report**\n\n• **Metro Average AQI:** **${base.aqi || 142}** (Moderate — Unhealthy for Sensitive Groups)\n• **Critical Hotspots:**\n  1. Chennai Port & Parrys — AQI 182 (maritime diesel + freight)\n  2. Koyambedu CMBT — AQI 175 (bus exhaust + logistics)\n  3. Guindy Estate — AQI 172 (industrial output)\n• **Cleanest Zone:** Adyar & Besant Nagar — AQI **98** (sea breeze + green canopy)`;
        }

        // Water
        if (t.includes("water") || t.includes("reservoir") || t.includes("demand")) {
            return `💧 **Chennai Water Metro Status**\n\n• **Daily Consumption:** **${base.waterConsumptionMLD || 985} MLD**\n• **Supply Capacity:** ${base.waterSupplyCapacityMLD || 1050} MLD (Surplus: 65 MLD)\n• **Chembarambakkam:** 3,120 / 3,645 mcft — **85% full**\n• **Poondi Reservoir:** 2,450 / 3,231 mcft — **76% full**\n• **Desalination:** Nemmeli (150 MLD) + Minjur (100 MLD) at 100% output\n• **Projected Tomorrow:** ~1,010 MLD (+2.5% weekend draw)`;
        }

        // Electricity
        if (t.includes("electricity") || t.includes("power") || t.includes("grid") || t.includes("energy")) {
            return `⚡ **TANGEDCO Grid Intelligence**\n\n• **Peak Demand:** **${base.electricityDemandMW || 3920} MW** vs 4,500 MW ceiling\n• **Reserve Buffer:** 13% — grid frequency stable at 50.02 Hz\n• **Top Load Zones:** OMR Cyber Grid (520 MW), T. Nagar Substation (460 MW)\n• **AI Energy Tips:**\n  1. Pre-cool IT campus buildings before 11:00 AM\n  2. Shift heavy industrial loads to 23:00–05:00 off-peak\n  3. Mandate commercial rooftop solar in Guindy & Ambattur estates`;
        }

        // Zone lookup
        const zone = zones.find(z => t.includes(z.name.toLowerCase().split(" ")[0]));
        if (zone) {
            return `📍 **Zone Dossier: ${zone.name}**\n\n• **Type:** ${zone.zoneType}\n• **Congestion:** ${zone.congestion}% (${zone.status})\n• **AQI:** ${zone.aqi}\n• **Water Demand:** ${zone.waterDemandMLD} MLD\n• **Electricity:** ${zone.electricityMW} MW\n\n${zone.description}`;
        }

        // Greetings
        if (/^(hi|hello|hey|vanakkam|namaste)/i.test(t)) {
            return `Vanakkam! 🙏 **CITYBRAIN NEURAL CORE ONLINE**\n\nI'm monitoring Chennai's 11.5M-citizen smart grid in real time. Ask me about traffic, pollution, water, electricity, or run what-if scenarios.\n\n*Add your free Gemini API key (top of this panel) for full AI conversation mode!*`;
        }

        // Help
        if (t.includes("help") || t.includes("what can you do")) {
            return `🤖 **CITYBRAIN Capabilities**\n\n• **Traffic:** peak hours, bottlenecks, corridor speeds\n• **Air Quality:** AQI readings, hotspots, emission sources\n• **What-If:** *"What if population increases 20%?"* or *"Vehicle usage -15%?"*\n• **Resources:** water demand, reservoir levels, grid MW draw\n• **Zone Intel:** Anna Nagar, T. Nagar, Tambaram, OMR, Adyar and more\n\n💡 Add your **free Gemini API key** for full natural-language AI answers!`;
        }

        // Fallback
        return `🧠 **CITYBRAIN Dispatch**\n\nQueried: *"${text}"*\n\n**Current Grid Snapshot:**\n• Congestion: **${base.trafficCongestion || 68}%** · AQI: **${base.aqi || 142}** · Grid: **${base.electricityDemandMW || 3920} MW** · Health: **${base.infrastructureHealth || 74}/100**\n\n💡 For full natural-language AI answers, add your **free Gemini API key** at the top of this panel.\nOr try: *"Predict traffic at 6 PM"*, *"What if population increases by 20%?"*`;
    },

    // Simulated character-stream for offline responses
    async streamOfflineResponse(text) {
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const { bubble } = this.createBotBubble(ts);
        this.isStreaming = true;

        let i = 0;
        bubble.innerHTML = '<span class="stream-cursor"></span>';

        await new Promise(resolve => {
            const iv = setInterval(() => {
                i = Math.min(i + 6, text.length);
                bubble.innerHTML = this.formatMarkdown(text.substring(0, i)) + '<span class="stream-cursor"></span>';
                this.scrollToBottom();
                if (i >= text.length) {
                    clearInterval(iv);
                    bubble.innerHTML = this.formatMarkdown(text);
                    this.scrollToBottom();
                    resolve();
                }
            }, 14);
        });

        this.pushHistory("model", text);
        this.isStreaming = false;
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
                <span class="typing-text">CityBrain AI is thinking...</span>`;
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
