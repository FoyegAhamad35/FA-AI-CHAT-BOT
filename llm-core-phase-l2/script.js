/* ===================================
   FA AI CHAT BOT - JavaScript
   FA LLM CORE Phase L2 - Local Memory Brain
   =================================== */

// ===================================
// CONFIGURATION & STORAGE KEYS
// ===================================

const STORAGE_CHATS = "fa_llm_core_chats";
const STORAGE_MEMORY = "fa_llm_core_memory";
const STORAGE_THEME = "fa_llm_core_theme";
const MEMORY_FACTS_LIMIT = 50;

// ===================================
// STATE MANAGEMENT
// ===================================

let currentChatId = localStorage.getItem("fa_llm_core_current_chat") || generateChatId();
let messages = [];
let isDarkTheme = localStorage.getItem(STORAGE_THEME) !== "false";
let memoryBrain = new MemoryBrain();

// ===================================
// FA LLM CORE - LANGUAGE DETECTOR
// ===================================

function languageDetector(userMessage) {
    if (!userMessage) return "en";
    
    const bengaliPattern = /[\u0980-\u09FF]/g;
    const bengaliMatches = userMessage.match(bengaliPattern) || [];
    
    // If more than 30% Bengali characters, detect as Bengali
    if (bengaliMatches.length > userMessage.length * 0.3) {
        return "bn";
    }
    
    return "en";
}

// ===================================
// FA LLM CORE - MEMORY BRAIN
// ===================================

class MemoryBrain {
    constructor() {
        this.facts = this.loadFacts();
    }

    loadFacts() {
        const stored = localStorage.getItem(STORAGE_MEMORY);
        return stored ? JSON.parse(stored) : {};
    }

    saveFacts() {
        localStorage.setItem(STORAGE_MEMORY, JSON.stringify(this.facts));
        updateMemoryDisplay();
    }

    saveFact(key, value) {
        this.facts[key] = value;
        this.saveFacts();
    }

    getFact(key) {
        return this.facts[key] || null;
    }

    getAllFacts() {
        return this.facts;
    }

    clearFacts() {
        this.facts = {};
        localStorage.removeItem(STORAGE_MEMORY);
        updateMemoryDisplay();
    }

    extractFacts(userMessage, language) {
        // Bengali fact patterns
        if (language === "bn") {
            // আমার নাম [name]
            let nameMatch = userMessage.match(/আমার\s+নাম\s+(.+?)(?:\s|।|$)/);
            if (nameMatch) {
                this.saveFact("user_name_bn", nameMatch[1].trim());
                return "name";
            }

            // আমার প্রজেক্টের নাম [project]
            let projectMatch = userMessage.match(/আমার\s+প্রজেক্টের\s+নাম\s+(.+?)(?:\s|।|$)/);
            if (projectMatch) {
                this.saveFact("project_name_bn", projectMatch[1].trim());
                return "project";
            }

            // আমি [preference] পছন্দ করি
            let preferenceMatch = userMessage.match(/আমি\s+(.+?)\s+পছন্দ\s+করি/);
            if (preferenceMatch) {
                this.saveFact("preference_bn", preferenceMatch[1].trim());
                return "preference";
            }
        }
        // English fact patterns
        else {
            // my name is [name] / i am [name]
            let nameMatch = userMessage.match(/(?:my\s+name\s+is|i\s+am)\s+(.+?)(?:\.|$)/i);
            if (nameMatch) {
                this.saveFact("user_name_en", nameMatch[1].trim());
                return "name";
            }

            // my project name is [project]
            let projectMatch = userMessage.match(/my\s+project\s+name\s+is\s+(.+?)(?:\.|$)/i);
            if (projectMatch) {
                this.saveFact("project_name_en", projectMatch[1].trim());
                return "project";
            }

            // i prefer / i like [preference]
            let preferenceMatch = userMessage.match(/i\s+(?:prefer|like)\s+(.+?)(?:\.|$)/i);
            if (preferenceMatch) {
                this.saveFact("preference_en", preferenceMatch[1].trim());
                return "preference";
            }
        }

        return "unknown";
    }

    answerMemoryQuestion(userMessage, language) {
        if (language === "bn") {
            // আমার নাম কি?
            if (userMessage.match(/আমার\s+নাম\s+কি/)) {
                const name = this.getFact("user_name_bn");
                if (name) {
                    return { answered: true, response: `আপনার নাম ${name}।` };
                }
                return { answered: false };
            }

            // আমার প্রজেক্টের নাম কি?
            if (userMessage.match(/আমার\s+প্রজেক্টের\s+নাম\s+কি/)) {
                const project = this.getFact("project_name_bn");
                if (project) {
                    return { answered: true, response: `আপনার প্রজেক্টের নাম ${project}।` };
                }
                return { answered: false };
            }

            // আমি কোন ভাষা পছন্দ করি? / কোন ভাষা পছন্দ করি?
            if (userMessage.match(/কোন\s+ভাষা\s+পছন্দ|আমি\s+.+\s+পছন্দ\s+করি/)) {
                const pref = this.getFact("preference_bn");
                if (pref) {
                    return { answered: true, response: `আপনি ${pref} পছন্দ করেন।` };
                }
                return { answered: false };
            }
        } else {
            // what is my name?
            if (userMessage.match(/what\s+is\s+my\s+name/i)) {
                const name = this.getFact("user_name_en");
                if (name) {
                    return { answered: true, response: `Your name is ${name}.` };
                }
                return { answered: false };
            }

            // what is my project name?
            if (userMessage.match(/what\s+is\s+my\s+project\s+name/i)) {
                const project = this.getFact("project_name_en");
                if (project) {
                    return { answered: true, response: `Your project name is ${project}.` };
                }
                return { answered: false };
            }

            // what language do i prefer?
            if (userMessage.match(/what\s+language\s+do\s+i\s+prefer|what.*prefer/i)) {
                const pref = this.getFact("preference_en");
                if (pref) {
                    return { answered: true, response: `You prefer ${pref}.` };
                }
                return { answered: false };
            }
        }

        return { answered: false };
    }
}

// ===================================
// FA LLM CORE - INTENT DETECTOR
// ===================================

function intentDetector(userMessage, language) {
    const msg = userMessage.toLowerCase();

    if (language === "bn") {
        // Greetings
        if (msg.match(/^(হ্যালো|হাই|নমস্কার|সালাম|আসালামু আলাইকুম)/)) {
            return "greeting";
        }
        // Identity question
        if (msg.match(/তুমি\s+কে|তুমি\s+কি|আপনি\s+কে|আপনি\s+কি/)) {
            return "identity";
        }
        // Name memory statement
        if (msg.match(/আমার\s+নাম\s+.+|আমার\s+প্রজেক্টের\s+নাম|আমি\s+.+\s+পছন্দ\s+করি/)) {
            return "name_memory_statement";
        }
        // Name memory question
        if (msg.match(/আমার\s+নাম\s+কি|আমার\s+প্রজেক্টের\s+নাম\s+কি|কোন\s+ভাষা\s+পছন্দ/)) {
            return "name_memory_question";
        }
        // Help request
        if (msg.match(/সাহায্য|সহায়তা|কী পারো|কি কর/)) {
            return "help";
        }
        // Project question
        if (msg.match(/প্রজেক্ট|FA AI|চ্যাটবট/)) {
            return "project";
        }
    } else {
        // Greetings
        if (msg.match(/^(hello|hi|hey|greetings|hey there)/)) {
            return "greeting";
        }
        // Identity question
        if (msg.match(/who\s+are\s+you|what\s+are\s+you/)) {
            return "identity";
        }
        // Name memory statement
        if (msg.match(/my\s+name\s+is|i\s+am|my\s+project|i\s+prefer|i\s+like/)) {
            return "name_memory_statement";
        }
        // Name memory question
        if (msg.match(/what\s+is\s+my\s+name|what.*project|what.*prefer/)) {
            return "name_memory_question";
        }
        // Help request
        if (msg.match(/help|what\s+can\s+you\s+do|capabilities/)) {
            return "help";
        }
        // Project question
        if (msg.match(/fa\s+ai|chatbot|project|llm|core/)) {
            return "project";
        }
    }

    return "unknown";
}

// ===================================
// FA LLM CORE - SAFETY LAYER
// ===================================

function safetyLayer(userMessage, language) {
    const msg = userMessage.toLowerCase();

    // Dangerous keywords to block
    const dangerousPatterns = [
        /hidden\s+prompt|secret\s+prompt|system\s+prompt/i,
        /api\s+key|password|secret|private/i,
        /internal\s+config|config\s+file/i,
        /reveal|show\s+me|tell\s+me.*secret/i,
        /hack|exploit|vulnerability/i
    ];

    for (let pattern of dangerousPatterns) {
        if (pattern.test(msg)) {
            return {
                blocked: true,
                language: language,
                response: language === "bn"
                    ? "দুঃখিত, আমি সেই ধরনের তথ্য শেয়ার করতে পারি না।"
                    : "Sorry, I cannot share that kind of information."
            };
        }
    }

    return { blocked: false };
}

// ===================================
// FA LLM CORE - RESPONSE ENGINE
// ===================================

function responseEngine(userMessage, intent, language) {
    // Check safety first
    const safety = safetyLayer(userMessage, language);
    if (safety.blocked) {
        return safety.response;
    }

    // Check if memory question
    if (intent === "name_memory_question") {
        const memoryAnswer = memoryBrain.answerMemoryQuestion(userMessage, language);
        if (memoryAnswer.answered) {
            return memoryAnswer.response;
        }
        // No memory found
        if (language === "bn") {
            return "এই চ্য��টে আপনি এখনো এই তথ্য বলেননি।";
        } else {
            return "You have not shared that information in this chat yet.";
        }
    }

    // Extract and save facts for memory statements
    if (intent === "name_memory_statement") {
        const factType = memoryBrain.extractFacts(userMessage, language);
        if (language === "bn") {
            if (factType === "name") {
                const name = memoryBrain.getFact("user_name_bn");
                return `ঠিক আছে, আমি এই চ্যাটে আপনার নাম ${name} হিসেবে মনে রাখলাম।`;
            } else if (factType === "project") {
                const project = memoryBrain.getFact("project_name_bn");
                return `ঠিক আছে, আমি এই চ্যাটে আপনার প্রজেক্টের নাম ${project} হিসেবে মনে রাখলাম।`;
            } else if (factType === "preference") {
                const pref = memoryBrain.getFact("preference_bn");
                return `ঠিক আছে, আমি এই চ্যাটে আপনি ${pref} পছন্দ করেন এটি মনে রাখলাম।`;
            }
        } else {
            if (factType === "name") {
                const name = memoryBrain.getFact("user_name_en");
                return `Okay, I will remember in this chat that your name is ${name}.`;
            } else if (factType === "project") {
                const project = memoryBrain.getFact("project_name_en");
                return `Okay, I will remember in this chat that your project name is ${project}.`;
            } else if (factType === "preference") {
                const pref = memoryBrain.getFact("preference_en");
                return `Okay, I will remember in this chat that you prefer ${pref}.`;
            }
        }
    }

    // Handle intents
    if (intent === "greeting") {
        if (language === "bn") {
            return "আপনাকে স্বাগতম! আমি FA AI CHAT BOT-এর FA LLM CORE Phase L2।";
        } else {
            return "Hello! I am FA AI CHAT BOT's FA LLM CORE Phase L2.";
        }
    }

    if (intent === "identity") {
        if (language === "bn") {
            return "আমি FA AI CHAT BOT-এর FA LLM CORE Phase L2। আমি এখন local rule-based brain এবং local memory system হিসেবে কাজ করছি। Real LLM brain পরে যোগ করা যাবে।";
        } else {
            return "I am FA LLM CORE Phase L2 of FA AI CHAT BOT. I work as a local rule-based brain with local memory system. A real LLM brain can be added later.";
        }
    }

    if (intent === "help") {
        if (language === "bn") {
            return "আমি যা করতে পারি:\n• আপনার নাম, প্রজেক্ট, এবং পছন্দ মনে রাখা\n• আপনার প্রশ্নের উত্তর দেওয়া\n• বাংলা এবং ইংরেজি উভয়ে কথা বলা\n• এই চ্যাটে সবকিছু স্থানীয় এবং ব্যক্তিগত";
        } else {
            return "What I can do:\n• Remember your name, project, and preferences\n• Answer your questions\n• Speak both Bengali and English\n• Everything in this chat is local and private";
        }
    }

    if (intent === "project") {
        if (language === "bn") {
            return "FA AI CHAT BOT একটি স্থানীয় AI চ্যাটবট যার একটি custom brain আছে। Phase L2 এ আমি local memory system সহ কাজ করছি।";
        } else {
            return "FA AI CHAT BOT is a local AI chatbot with a custom brain. In Phase L2, I work with a local memory system.";
        }
    }

    // Default fallback
    if (language === "bn") {
        return "আমি এই বিষয়ে নিশ্চিত নই। এটি FA LLM CORE Phase L2 এবং আমার জ্ঞান সীমিত। পরে একটি real reasoning brain যোগ করা হবে।";
    } else {
        return "I am not sure about that. This is FA LLM CORE Phase L2 and my knowledge is limited. A real reasoning brain will be added later.";
    }
}

// ===================================
// CHAT FUNCTIONS
// ===================================

function generateChatId() {
    return "chat_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

function generateMessageId() {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

function saveChatToLocalStorage() {
    let chats = JSON.parse(localStorage.getItem(STORAGE_CHATS) || "[]");
    let chatIndex = chats.findIndex(c => c.id === currentChatId);

    const chatData = {
        id: currentChatId,
        messages: messages,
        timestamp: new Date().toISOString()
    };

    if (chatIndex >= 0) {
        chats[chatIndex] = chatData;
    } else {
        chats.unshift(chatData);
    }

    localStorage.setItem(STORAGE_CHATS, JSON.stringify(chats));
    localStorage.setItem("fa_llm_core_current_chat", currentChatId);
}

function loadChatFromLocalStorage() {
    let chats = JSON.parse(localStorage.getItem(STORAGE_CHATS) || "[]");
    let chat = chats.find(c => c.id === currentChatId);

    if (chat) {
        messages = chat.messages || [];
    } else {
        messages = [];
    }

    renderMessages();
}

// ===================================
// UI FUNCTIONS
// ===================================

const menuToggle = document.getElementById("menuToggle");
const themeToggle = document.getElementById("themeToggle");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerMenu = document.getElementById("drawerMenu");
const drawerClose = document.getElementById("drawerClose");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messagesArea = document.getElementById("messagesArea");
const newChatBtn = document.getElementById("newChatBtn");
const clearChatBtn = document.getElementById("clearChatBtn");

// ===================================
// EVENT LISTENERS - DRAWER
// ===================================

menuToggle.addEventListener("click", openDrawer);
drawerClose.addEventListener("click", closeDrawer);
drawerOverlay.addEventListener("click", closeDrawer);

function openDrawer() {
    drawerMenu.classList.add("active");
    drawerOverlay.classList.add("active");
}

function closeDrawer() {
    drawerMenu.classList.remove("active");
    drawerOverlay.classList.remove("active");
}

// ===================================
// EVENT LISTENERS - THEME
// ===================================

themeToggle.addEventListener("click", toggleTheme);

function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    updateTheme();
    localStorage.setItem(STORAGE_THEME, isDarkTheme);
}

function updateTheme() {
    if (isDarkTheme) {
        document.body.classList.remove("light-theme");
    } else {
        document.body.classList.add("light-theme");
    }
}

updateTheme();

// ===================================
// EVENT LISTENERS - MESSAGE
// ===================================

messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendButton.addEventListener("click", sendMessage);

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;

    // Detect language
    const language = languageDetector(content);

    // Add user message
    const userMessage = {
        id: generateMessageId(),
        role: "user",
        content: content,
        timestamp: Date.now(),
        language: language
    };
    messages.push(userMessage);

    // Clear input
    messageInput.value = "";
    messageInput.style.height = "auto";

    // Remove welcome message if first message
    if (messages.length === 1) {
        const welcome = messagesArea.querySelector(".welcome-message");
        if (welcome) welcome.remove();
    }

    renderMessages();
    saveChatToLocalStorage();

    // Process through FA LLM CORE
    setTimeout(() => {
        const intent = intentDetector(content, language);
        const aiResponse = responseEngine(content, intent, language);

        const aiMessage = {
            id: generateMessageId(),
            role: "ai",
            content: aiResponse,
            timestamp: Date.now(),
            language: language
        };

        messages.push(aiMessage);
        renderMessages();
        saveChatToLocalStorage();
    }, 400);
}

// ===================================
// MESSAGE RENDERING
// ===================================

function renderMessages() {
    const messagesList = messagesArea;

    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="welcome-message">
                <h2>Welcome to FA AI CHAT BOT</h2>
                <p>FA LLM CORE Phase L2 - Local Memory Brain</p>
                <div class="welcome-info">
                    <p class="info-title">🧠 What can I do?</p>
                    <ul class="info-list">
                        <li>Remember your name, preferences, and facts</li>
                        <li>Answer questions about what you've told me</li>
                        <li>Support Bengali and English</li>
                        <li>All memory is local and private</li>
                    </ul>
                </div>
            </div>
        `;
        return;
    }

    messagesList.innerHTML = "";

    messages.forEach((msg) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${msg.role}`;

        if (msg.role === "user") {
            messageDiv.innerHTML = `
                <div class="message-bubble">${escapeHtml(msg.content)}</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div>
                    <div class="message-bubble">${escapeHtml(msg.content)}</div>
                    <div class="message-actions">
                        <button class="message-action-btn copy-btn" 
                                title="Copy"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                        <button class="message-action-btn like-btn" 
                                title="Like"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <button class="message-action-btn voice-btn" 
                                title="Voice"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </button>
                        <button class="message-action-btn share-btn" 
                                title="Share"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                        <button class="message-action-btn more-btn" 
                                title="More"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="6" cy="12" r="2"></circle>
                                <circle cx="12" cy="12" r="2"></circle>
                                <circle cx="18" cy="12" r="2"></circle>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }

        messagesArea.appendChild(messageDiv);
    });

    attachActionButtonListeners();
    setTimeout(() => {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 0);
}

function attachActionButtonListeners() {
    document.querySelectorAll(".copy-btn").forEach((btn) => {
        btn.addEventListener("click", handleCopyMessage);
    });

    document.querySelectorAll(".like-btn").forEach((btn) => {
        btn.addEventListener("click", handleLikeMessage);
    });

    document.querySelectorAll(".voice-btn").forEach((btn) => {
        btn.addEventListener("click", handleVoiceMessage);
    });

    document.querySelectorAll(".share-btn").forEach((btn) => {
        btn.addEventListener("click", handleShareMessage);
    });

    document.querySelectorAll(".more-btn").forEach((btn) => {
        btn.addEventListener("click", handleMoreMessage);
    });
}

function handleCopyMessage(e) {
    const msgId = e.currentTarget.dataset.msgId;
    const message = messages.find((m) => m.id === msgId);

    if (message) {
        navigator.clipboard
            .writeText(message.content)
            .then(() => {
                const btn = e.currentTarget;
                const originalContent = btn.innerHTML;
                btn.innerHTML = `<span>✓</span>`;
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                }, 1500);
            });
    }
}

function handleLikeMessage(e) {
    const btn = e.currentTarget;
    btn.classList.toggle("liked");
}

function handleVoiceMessage(e) {
    const msgId = e.currentTarget.dataset.msgId;
    const message = messages.find((m) => m.id === msgId);

    if (message && "speechSynthesis" in window) {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = message.language === "bn" ? "bn-IN" : "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;

        speechSynthesis.speak(utterance);

        e.currentTarget.classList.add("speaking");
        utterance.onend = () => {
            e.currentTarget.classList.remove("speaking");
        };
    }
}

function handleShareMessage(e) {
    const msgId = e.currentTarget.dataset.msgId;
    const message = messages.find((m) => m.id === msgId);

    if (message) {
        if (navigator.share) {
            navigator.share({
                title: "FA AI CHAT BOT",
                text: message.content
            });
        } else {
            navigator.clipboard.writeText(message.content);
        }
    }
}

function handleMoreMessage(e) {
    // Placeholder for future features
    console.log("More options for message");
}

// ===================================
// NEW CHAT & CLEAR CHAT
// ===================================

newChatBtn.addEventListener("click", startNewChat);
clearChatBtn.addEventListener("click", clearCurrentChat);

function startNewChat() {
    closeDrawer();
    saveChatToLocalStorage();
    currentChatId = generateChatId();
    messages = [];
    renderMessages();
    messageInput.focus();
}

function clearCurrentChat() {
    if (confirm("Clear current chat and memory?")) {
        messages = [];
        memoryBrain.clearFacts();
        renderMessages();
        saveChatToLocalStorage();
        messageInput.focus();
        closeDrawer();
    }
}

// ===================================
// MEMORY DISPLAY
// ===================================

function updateMemoryDisplay() {
    const memoryItems = document.getElementById("memoryItems");
    const facts = memoryBrain.getAllFacts();
    const factKeys = Object.keys(facts);

    if (factKeys.length === 0) {
        memoryItems.innerHTML = '<p class="no-memory">No facts stored yet</p>';
        return;
    }

    memoryItems.innerHTML = "";
    factKeys.forEach((key) => {
        const value = facts[key];
        const displayText = `${key}: ${value}`;
        const item = document.createElement("div");
        item.className = "memory-item";
        item.textContent = displayText;
        memoryItems.appendChild(item);
    });
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

// ===================================
// INITIALIZATION
// ===================================

function init() {
    loadChatFromLocalStorage();
    updateMemoryDisplay();
    messageInput.focus();
}

document.addEventListener("DOMContentLoaded", init);

window.addEventListener("beforeunload", () => {
    saveChatToLocalStorage();
});