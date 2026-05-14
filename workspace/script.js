// ==================== DOM ELEMENTS ====================
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const newChatBtn = document.getElementById('newChatBtn');
const chatHistory = document.getElementById('chatHistory');
const searchInput = document.getElementById('searchInput');
const sidebar = document.querySelector('.sidebar');
const menuBtn = document.getElementById('menuBtn');
const chatTitle = document.getElementById('chatTitle');

// ==================== STATE MANAGEMENT ====================
let chats = [];
let currentChatId = null;
let isSpeaking = false;
let speechSynthesis = window.speechSynthesis;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadChats();
  setupEventListeners();
  loadTheme();
});

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  newChatBtn.addEventListener('click', createNewChat);
  menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  searchInput.addEventListener('input', filterChats);

  // Theme toggle
  document.querySelectorAll('.btn-icon')[1].addEventListener('click', toggleTheme);

  // Close sidebar on message area click (mobile)
  messagesContainer.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
    }
  });
}

// ==================== CHAT MANAGEMENT ====================
function createNewChat() {
  const chat = {
    id: generateId(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString()
  };

  chats.unshift(chat);
  currentChatId = chat.id;
  saveChats();
  renderChatHistory();
  renderMessages();
  chatTitle.textContent = chat.title;
  sidebar.classList.remove('open');
}

function deleteChat(chatId) {
  if (!confirm('Delete this chat?')) return;

  chats = chats.filter(chat => chat.id !== chatId);
  
  if (currentChatId === chatId) {
    currentChatId = chats.length > 0 ? chats[0].id : null;
  }

  saveChats();
  
  if (chats.length === 0) {
    createNewChat();
  } else {
    renderChatHistory();
    renderMessages();
  }
}

function selectChat(chatId) {
  currentChatId = chatId;
  const chat = getCurrentChat();
  chatTitle.textContent = chat.title;
  renderMessages();
  renderChatHistory();
  sidebar.classList.remove('open');
}

// ==================== MESSAGING ====================
function sendMessage() {
  const text = messageInput.value.trim();
  
  if (!text) return;

  // Add user message
  addMessage('user', text);
  messageInput.value = '';
  messageInput.focus();

  // Simulate AI response
  showTypingIndicator();
  
  setTimeout(() => {
    const aiResponse = generateAIResponse(text);
    removeTypingIndicator();
    addMessage('ai', aiResponse);
  }, 800);
}

function addMessage(role, content) {
  const chat = getCurrentChat();
  
  if (!chat) return;

  const message = {
    id: generateId(),
    role,
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  chat.messages.push(message);

  // Update chat title if it's the first message
  if (chat.title === 'New Chat' && role === 'user') {
    chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }

  saveChats();
  renderChatHistory();
  renderMessages();
  scrollToBottom();
}

function generateAIResponse(userMessage) {
  const responses = [
    'That\'s an interesting point! Let me think about that...',
    'I understand what you mean. Here\'s my perspective on it...',
    'Great question! Based on what you said, I would suggest...',
    'That\'s a good observation. In my experience...',
    'I appreciate your input. Consider this angle...',
    'Absolutely! That\'s a valid point. Additionally...',
    'I hear you. Let me offer some insights...'
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

// ==================== RENDERING ====================
function renderChatHistory() {
  chatHistory.innerHTML = '';

  if (chats.length === 0) {
    chatHistory.innerHTML = '<div class="empty-state">No chats yet</div>';
    return;
  }

  const filteredChats = filterChatsBySearch();

  filteredChats.forEach(chat => {
    const chatItem = document.createElement('div');
    chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
    
    chatItem.innerHTML = `
      <div class="chat-item-title">${escapeHtml(chat.title)}</div>
      <button class="chat-item-delete" data-chat-id="${chat.id}">×</button>
    `;

    chatItem.addEventListener('click', (e) => {
      if (!e.target.classList.contains('chat-item-delete')) {
        selectChat(chat.id);
      }
    });

    const deleteBtn = chatItem.querySelector('.chat-item-delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });

    chatHistory.appendChild(chatItem);
  });
}

function renderMessages() {
  const chat = getCurrentChat();
  messagesContainer.innerHTML = '';

  if (!chat || chat.messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="welcome-screen">
        <div class="welcome-content">
          <div class="welcome-logo">🤖</div>
          <h2>Welcome to FA AI Workspace</h2>
          <p>Start a conversation by typing a message below</p>
        </div>
      </div>
    `;
    return;
  }

  chat.messages.forEach((message, index) => {
    const messageDiv = createMessageElement(message, index);
    messagesContainer.appendChild(messageDiv);
  });

  scrollToBottom();
}

function createMessageElement(message, index) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.role}`;

  const isAI = message.role === 'ai';
  const avatarText = isAI ? 'AI' : 'U';

  messageDiv.innerHTML = `
    <div class="message-avatar">${avatarText}</div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(message.content)}</div>
      <div class="message-time">${message.timestamp}</div>
      ${isAI ? createActionRow(index) : ''}
    </div>
  `;

  return messageDiv;
}

function createActionRow(messageIndex) {
  return `
    <div class="message-actions">
      <button class="action-btn" data-action="copy" data-index="${messageIndex}" title="Copy message">
        📋 Copy
      </button>
      <button class="action-btn" data-action="like" data-index="${messageIndex}" title="Like this response">
        👍 Like
      </button>
      <button class="action-btn" data-action="voice" data-index="${messageIndex}" title="Speak message">
        🔊 Voice
      </button>
      <button class="action-btn" data-action="share" data-index="${messageIndex}" title="Share message">
        🔗 Share
      </button>
      <button class="action-btn" data-action="more" data-index="${messageIndex}" title="More options">
        ⋮ More
      </button>
    </div>
  `;
}

// Attach action handlers after rendering
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.action-btn');
  if (!btn) return;

  const action = btn.dataset.action;
  const index = parseInt(btn.dataset.index);

  handleAction(action, index, btn);
});

// ==================== ACTIONS ====================
function handleAction(action, messageIndex, button) {
  const chat = getCurrentChat();
  const message = chat.messages[messageIndex];

  switch (action) {
    case 'copy':
      copyToClipboard(message.content, button);
      break;
    case 'like':
      toggleLike(button);
      break;
    case 'voice':
      toggleVoice(message.content, button);
      break;
    case 'share':
      shareMessage(message.content);
      break;
    case 'more':
      showMoreOptions(messageIndex);
      break;
  }
}

function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = '✓ Copied';
    button.classList.add('active');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('active');
    }, 2000);
  });
}

function toggleLike(button) {
  button.classList.toggle('active');
  button.textContent = button.classList.contains('active') ? '❤️ Liked' : '👍 Like';
}

function toggleVoice(text, button) {
  if (isSpeaking) {
    speechSynthesis.cancel();
    isSpeaking = false;
    button.textContent = '🔊 Voice';
    return;
  }

  isSpeaking = true;
  button.textContent = '⏸️ Stop';

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onend = () => {
    isSpeaking = false;
    button.textContent = '🔊 Voice';
  };

  utterance.onerror = () => {
    isSpeaking = false;
    button.textContent = '🔊 Voice';
  };

  speechSynthesis.speak(utterance);
}

function shareMessage(text) {
  if (navigator.share) {
    navigator.share({
      title: 'FA AI Workspace',
      text: text
    }).catch(err => console.log('Error sharing:', err));
  } else {
    alert('Share feature not supported on this device');
  }
}

function showMoreOptions(messageIndex) {
  const options = ['Edit', 'Delete', 'Translate'];
  const chat = getCurrentChat();
  const message = chat.messages[messageIndex];

  // Simple implementation - can be enhanced with a modal
  const action = prompt(`Options:\n1. Delete\n\nEnter option number:`, '1');
  
  if (action === '1') {
    chat.messages.splice(messageIndex, 1);
    saveChats();
    renderMessages();
  }
}

// ==================== SEARCH & FILTER ====================
function filterChatsBySearch() {
  const query = searchInput.value.toLowerCase();

  if (!query) {
    return chats;
  }

  return chats.filter(chat => {
    const titleMatch = chat.title.toLowerCase().includes(query);
    const messageMatch = chat.messages.some(msg =>
      msg.content.toLowerCase().includes(query)
    );
    return titleMatch || messageMatch;
  });
}

function filterChats() {
  renderChatHistory();
}

// ==================== UTILITIES ====================
function getCurrentChat() {
  return chats.find(chat => chat.id === currentChatId);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showTypingIndicator() {
  const chat = getCurrentChat();
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message ai';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = `
    <div class="message-avatar">AI</div>
    <div class="message-content">
      <div class="message-bubble typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;

  messagesContainer.appendChild(typingDiv);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

function scrollToBottom() {
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 0);
}

// ==================== THEME ====================
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isDark = !document.body.classList.contains('light-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }
}

// ==================== STORAGE ====================
function saveChats() {
  localStorage.setItem('fa-ai-chats', JSON.stringify(chats));
}

function loadChats() {
  const saved = localStorage.getItem('fa-ai-chats');
  chats = saved ? JSON.parse(saved) : [];

  if (chats.length === 0) {
    createNewChat();
  } else {
    currentChatId = chats[0].id;
    renderChatHistory();
    renderMessages();
    chatTitle.textContent = getCurrentChat().title;
  }
}
