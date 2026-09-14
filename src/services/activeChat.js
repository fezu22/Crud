let activeConversationId = null;
let activeContactId = null;

export function setActiveChat(conversationId, contactId) {
  activeConversationId = conversationId ? String(conversationId) : null;
  activeContactId = contactId ? String(contactId) : null;
}

export function clearActiveChat(conversationId) {
  if (!conversationId || String(conversationId) === activeConversationId) {
    activeConversationId = null;
    activeContactId = null;
  }
}

export function getActiveChat() {
  return {
    conversationId: activeConversationId,
    contactId: activeContactId,
  };
}
