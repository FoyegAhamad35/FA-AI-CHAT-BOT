/* ===================================
   FA AI CHAT BOT - JavaScript
   Phase 1: UI & Demo Logic
   =================================== */

// ===================================
// CONFIGURATION & API URL
// ===================================

// ⚠️ IMPORTANT: Change this to your Cloudflare Worker URL in Phase 2
const WORKER_API_URL = "YOUR_WORKER_URL_HERE";

// ===================================
// LANGUAGE TRANSLATIONS
// ===================================

const translations = {
    en: {
        welcomeTitle: "Welcome to FA AI CHAT BOT",
        welcomeText: "Start a conversation to begin",
        messagePlaceholder: "Type your message...",
        demoReply: "FA AI CHAT BOT Phase 1 is ready. Real AI connection will be added in Phase 2.",
        menuOpen: "Open menu",
        menuClose: "Close menu",
        themeToggle: "Toggle theme",
        sendMessage: "Send message",
        newChat: "New Chat",
        clearChat: "Clear Chat",
        confirmClear: "Clear all messages?",
        copyButton: "Copy",
        likeButton: "Like",
        voiceButton: "Voice",
        shareButton: "Share",
        moreButton: "More",
        copied: "Copied!",
        english: "English",
        bengali: "Bengali"
    },
    bn: {
        welcomeTitle: "FA AI CHAT BOT এ স্বাগতম",
        welcomeText: "কথোপকথন শুরু করুন",
        messagePlaceholder: "আপনার বার্তা লিখুন...",
        demoReply: "FA AI CHAT BOT ফেজ 1 প্রস্তুত। রিয়েল AI সংযোগ ফেজ 2 এ যোগ করা হবে।",
        menuOpen: "মেনু খুলুন",
        menuClose: "মেনু বন্ধ করুন",
        themeToggle: "থিম টগল করুন",
        sendMessage: "বার্তা পাঠান",
        newChat: "নতুন চ্যাট",
        clearChat: "চ্যাট সাফ করুন",
        confirmClear: "সমস্ত বার্তা সাফ করবেন?",
        copyButton: "কপি করুন",
        likeButton: "পছন্দ",
        voiceButton: "ভয়েস",
        shareButton: "শেয়ার করুন",
        moreButton: "আরও",
        copied: "কপি হয়েছে!",
        english: "English",
        bengali: "Bengali"
    }
};

// ===================================
// STATE MANAGEMENT
// ===================================

let currentLanguage = localStorage.getItem("preferredLanguage") || "en";
let isDarkTheme = localStorage.getItem("isDarkTheme") !== "false";
let messages = [];
let currentChatId = localStorage.getItem("currentChatId") || generateChatId();

// ===================================
// UTILITY FUNCTIONS
// ===================================

function t(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
}

function generateChatId() {
    return "chat_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

function saveChatToLocalStorage() {
    const chatData = {
        id: currentChatId,
        messages: messages,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(`chat_${currentChatId}`, JSON.stringify(chatData));
    localStorage.setItem("currentChatId", currentChatId);
}

function loadChatFromLocalStorage() {
    const chatData = localStorage.getItem(`chat_${currentChatId}`);
    if (chatData) {
        const parsed = JSON.parse(chatData);
        messages = parsed.messages || [];
        renderMessages();
    } else {
        messages = [];
        renderMessages();
    }
}

function generateMessageId() {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// ===================================
// DOM ELEMENTS
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
const langBtns = document.querySelectorAll(".lang-btn");
const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeText = document.getElementById("welcomeText");

// ===================================
// EVENT LISTENERS - DRAWER MENU
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
    localStorage.setItem("isDarkTheme", isDarkTheme);
}

function updateTheme() {
    if (isDarkTheme) {
        document.body.classList.remove("light-theme");
    } else {
        document.body.classList.add("light-theme");
    }
}

// Initialize theme on load
updateTheme();

// ===================================
// EVENT LISTENERS - LANGUAGE
// ===================================

langBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const lang = e.currentTarget.dataset.lang;
        setLanguage(lang);
    });
});

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem("preferredLanguage", lang);

    // Update active button
    langBtns.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });

    // Update UI text
    updateLanguageUI();
}

function updateLanguageUI() {
    messageInput.placeholder = t("messagePlaceholder");
    if (messages.length === 0) {
        welcomeTitle.textContent = t("welcomeTitle");
        welcomeText.textContent = t("welcomeText");
    }
    renderMessages();
}

// Initialize language
setLanguage(currentLanguage);

// ===================================
// EVENT LISTENERS - MESSAGE INPUT
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

    // Add user message
    const userMessage = {
        id: generateMessageId(),
        role: "user",
        content: content,
        timestamp: Date.now()
    };
    messages.push(userMessage);

    // Clear input
    messageInput.value = "";
    messageInput.style.height = "auto";

    // Remove welcome message if this is first message
    if (messages.length === 1) {
        const welcome = messagesArea.querySelector(".welcome-message");
        if (welcome) welcome.remove();
    }

    // Render user message
    renderMessages();
    saveChatToLocalStorage();

    // Simulate AI response (Phase 1)
    setTimeout(() => {
        const aiMessage = {
            id: generateMessageId(),
            role: "ai",
            content: t("demoReply"),
            timestamp: Date.now()
        };
        messages.push(aiMessage);
        renderMessages();
        saveChatToLocalStorage();
    }, 600);
}

// ===================================
// MESSAGE RENDERING
// ===================================

function renderMessages() {
    const messagesList = document.querySelector(".messages-area");

    if (messages.length === 0) {
        messagesList.innerHTML = `
            <div class="welcome-message">
                <h2>${t("welcomeTitle")}</h2>
                <p>${t("welcomeText")}</p>
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
                                title="${t("copyButton")}"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                        <button class="message-action-btn like-btn" 
                                title="${t("likeButton")}"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <button class="message-action-btn voice-btn" 
                                title="${t("voiceButton")}"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </button>
                        <button class="message-action-btn share-btn" 
                                title="${t("shareButton")}"
                                data-msg-id="${msg.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }

        messagesList.appendChild(messageDiv);
    });

    // Attach event listeners to action buttons
    attachActionButtonListeners();

    // Scroll to bottom
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
                btn.innerHTML = `<span>${t("copied")}</span>`;
                setTimeout(() => {
                    btn.innerHTML = originalContent;
                }, 2000);
            })
            .catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = message.content;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
            });
    }
}

function handleLikeMessage(e) {
    const btn = e.currentTarget;
    btn.classList.toggle("liked");
    btn.style.color = btn.classList.contains("liked") ? "#00d4ff" : "";
}

function handleVoiceMessage(e) {
    const msgId = e.currentTarget.dataset.msgId;
    const message = messages.find((m) => m.id === msgId);

    if (message && "speechSynthesis" in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = currentLanguage === "bn" ? "bn-IN" : "en-US";
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
            navigator
                .share({
                    title: "FA AI CHAT BOT",
                    text: message.content
                })
                .catch(() => {});
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(message.content);
        }
    }
}

// ===================================
// NEW CHAT & CLEAR CHAT
// ===================================

newChatBtn.addEventListener("click", startNewChat);
clearChatBtn.addEventListener("click", clearCurrentChat);

function startNewChat() {
    closeDrawer();
    saveChatToLocalStorage(); // Save current chat before starting new one
    currentChatId = generateChatId();
    messages = [];
    renderMessages();
    messageInput.focus();
}

function clearCurrentChat() {
    if (messages.length === 0) {
        alert(t("confirmClear"));
        return;
    }

    if (confirm(t("confirmClear"))) {
        messages = [];
        renderMessages();
        saveChatToLocalStorage();
        messageInput.focus();
        closeDrawer();
    }
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
// INPUT AUTO-RESIZE
// ===================================

messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + "px";
});

// ===================================
// PREVENT ZOOM ON DOUBLE-CLICK (iOS)
// ===================================

let lastTouchEnd = 0;
document.addEventListener(
    "touchend",
    (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    },
    false
);

// ===================================
// INITIALIZATION
// ===================================

function init() {
    loadChatFromLocalStorage();
    messageInput.focus();
}

// Load chat on page load
document.addEventListener("DOMContentLoaded", init);

// Save chat before page unload
window.addEventListener("beforeunload", () => {
    saveChatToLocalStorage();
});
