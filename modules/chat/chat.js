/**
 * Chat - Real-time secure chat between user and support (admin)
 * Uses Firestore for messages; user sees own conversation, admin sees all
 */

function useFirebase() {
  return typeof firebase !== 'undefined' && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

const BOT_REPLIES = [
  "Thanks for your message. Our team will look into this.",
  "You can track your complaint using the Track Complaint section.",
  "For urgent issues, please call the helpline: 1800-XXX-XXXX",
  "Is there anything else I can help you with?",
  "Your feedback helps us improve city services."
];

document.addEventListener('DOMContentLoaded', () => {
  const messagesDiv = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  function addBubble(text, isBot) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isBot ? 'bot' : 'user'}`;
    bubble.innerHTML = `<p>${escapeHtml(text)}</p>`;
    messagesDiv.appendChild(bubble);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  if (useFirebase()) {
    initFirebase();
    onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = '../../index.html';
        return;
      }
      const convId = await getOrCreateUserConversation();
      if (!convId) return;
      messagesDiv.innerHTML = '';
      addBubble('Hello! Chat with support. Your messages are secure and real-time.', true);
      let lastCount = 0;
      subscribeChatMessages(convId, (messages) => {
        while (messagesDiv.querySelectorAll('.chat-bubble').length > 1) messagesDiv.lastElementChild.remove();
        messages.forEach((msg) => addBubble(msg.text, msg.isAdmin));
      });
    });

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      const uid = getCurrentUserId();
      if (!uid) return;
      input.value = '';
      try {
        await sendChatMessage(uid, text, false);
      } catch (err) {
        showToast(err.message || 'Failed to send', 'error');
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    return;
  }

  addBubble('Hello! I\'m your Smart City assistant. How can I help you today?', true);
  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addBubble(text, false);
    input.value = '';
    setTimeout(() => addBubble(BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)], true), 800);
  }
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
});
