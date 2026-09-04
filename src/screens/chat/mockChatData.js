// Demo conversation for the Faraz chat screen. The Medi backend has real
// text chat APIs, but this screen is a self-contained design demo: it
// starts empty and simulates the other side with local mock replies.
export const farazContact = {
  id: 'demo-faraz',
  name: 'Faraz',
  online: false,
};

export const mockReplies = [
  'Got it, thanks!',
  'Sounds good — let me check and get back to you.',
  'Okay 👍',
  'Sure, I will update you soon.',
];

export function nextReply(previousCount) {
  return mockReplies[previousCount % mockReplies.length];
}

export function makeId() {
  return `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
