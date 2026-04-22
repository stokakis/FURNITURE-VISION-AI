/* ================================================
   claudeAI.js – Gemini AI Assistant Chat Tab
   FurnitureVision AI / ideaepipla.gr
   ================================================ */

const ClaudeAI = (() => {

  // Conversation history (for context)
  const history = [
    {
      role: 'model',
      content: `Είσαι ο AI βοηθός του ideaepipla.gr, ένα ελληνικό e-shop επίπλων. 
Βοηθάς τον ιδιοκτήτη με:
- Περιγραφές προϊόντων για το e-shop (στα ελληνικά και αγγλικά)
- Συμβουλές για φωτογράφιση επίπλων
- AI prompts για καλύτερα αποτελέσματα background generation
- Marketing και SEO για την ελληνική αγορά
- Γενικές συμβουλές για e-commerce επίπλων

Απαντάς στα ελληνικά εκτός αν σε ρωτήσουν αλλιώς. Είσαι φιλικός, επαγγελματικός και εξειδικευμένος στα έπιπλα.`
    }
  ];

  // DOM refs
  let chatMessages, chatInput, chatSendBtn;
  let isSending = false;

  // ── Init ───────────────────────────────────────
  function init() {
    chatMessages = document.getElementById('chatMessages');
    chatInput    = document.getElementById('chatInput');
    chatSendBtn  = document.getElementById('chatSendBtn');

    bindEvents();
  }

  // ── Bind events ────────────────────────────────
  function bindEvents() {
    // Send button
    chatSendBtn.addEventListener('click', handleSend);

    // Enter key (Shift+Enter = new line)
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // Suggestion buttons
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        chatInput.value = btn.dataset.msg;
        chatInput.focus();
        handleSend();
      });
    });
  }

  // ── Handle send ────────────────────────────────
  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text || isSending) return;

    isSending = true;
    chatSendBtn.disabled = true;
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Add user message to UI
    appendMessage('user', text);

    // Add to history
    history.push({ role: 'user', content: text });

    // Add loading indicator
    const loadingId = appendLoadingMessage();

    try {
      // Call Gemini API
      const reply = await chatWithGemini(history);

      // Remove loading, add reply
      removeMessage(loadingId);
      appendMessage('assistant', formatReply(reply));

      // Add to history
      history.push({ role: 'model', content: reply });

      // Scroll to bottom
      scrollToBottom();

    } catch (err) {
      removeMessage(loadingId);
      appendMessage('assistant', `❌ Σφάλμα: ${err.message}\n\nΠαρακαλώ δοκίμασε ξανά.`);
      console.error('Chat error:', err);
    } finally {
      isSending = false;
      chatSendBtn.disabled = false;
      chatInput.focus();
    }
  }

  // ── Append message to chat ─────────────────────
  function appendMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    msgDiv.id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const avatarLabel = role === 'user' ? 'ME' : 'AI';

    msgDiv.innerHTML = `
      <div class="chat-avatar">${avatarLabel}</div>
      <div class="chat-bubble">${content}</div>
    `;

    chatMessages.appendChild(msgDiv);
    scrollToBottom();
    return msgDiv.id;
  }

  // ── Append loading indicator ───────────────────
  function appendLoadingMessage() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message assistant';
    const id = `msg-loading-${Date.now()}`;
    msgDiv.id = id;
    msgDiv.innerHTML = `
      <div class="chat-avatar">AI</div>
      <div class="chat-bubble loading" style="min-width:60px">
        <span style="display:inline-flex;gap:4px;align-items:center">
          <span class="dot-pulse" style="animation:blink .8s 0s infinite">●</span>
          <span class="dot-pulse" style="animation:blink .8s .2s infinite">●</span>
          <span class="dot-pulse" style="animation:blink .8s .4s infinite">●</span>
        </span>
      </div>
    `;
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
    return id;
  }

  // ── Remove message by id ───────────────────────
  function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // ── Format reply text (basic markdown) ────────
  function formatReply(text) {
    return text
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic *text*
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code `text`
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
      // Newlines
      .replace(/\n/g, '<br>')
      // Bullet points (- item or • item)
      .replace(/^[•\-]\s+(.+)/gm, '<span style="display:block;padding-left:12px;margin:2px 0">• $1</span>')
      // Numbered lists
      .replace(/^(\d+)\.\s+(.+)/gm, '<span style="display:block;padding-left:12px;margin:2px 0">$1. $2</span>');
  }

  // ── Scroll chat to bottom ──────────────────────
  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
  }

  return { init };

})();