// Demo conversation used by the premium chat experience. The Medi backend
// currently supports text chat only, so media, document and voice messages
// are local demo data until a real API exists for them.
import demoImage from '../../assets/cloudinary-guide.png';

export const drAhmadContact = {
  id: 'demo-dr-ahmad',
  name: 'Dr. Ahmad',
  specialty: 'Cardiologist',
  online: true,
  premium: true,
};

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

export function buildSeedMessages() {
  return [
    {
      _id: 'seed-1',
      type: 'text',
      text: 'Good morning! This is a reminder about your cardiology follow-up.',
      sender: 'them',
      createdAt: minutesAgo(190),
      status: 'read',
    },
    {
      _id: 'seed-2',
      type: 'text',
      text: 'Thanks Dr. Ahmad. My blood pressure readings have been stable this week.',
      sender: 'me',
      createdAt: minutesAgo(184),
      status: 'read',
    },
    {
      _id: 'seed-3',
      type: 'text',
      text: 'That is great to hear. Keep taking the medication after breakfast and stay hydrated.',
      sender: 'them',
      createdAt: minutesAgo(180),
      status: 'read',
    },
    {
      _id: 'seed-4',
      type: 'image',
      imageUrl: demoImage,
      caption: 'Here is the diet plan we discussed.',
      sender: 'them',
      createdAt: minutesAgo(176),
      status: 'read',
    },
    {
      _id: 'seed-5',
      type: 'document',
      fileName: 'Blood_Test_Results.pdf',
      fileType: 'application/pdf',
      fileSize: 384512,
      sender: 'me',
      createdAt: minutesAgo(172),
      status: 'read',
    },
    {
      _id: 'seed-6',
      type: 'voice',
      duration: 14,
      sender: 'them',
      createdAt: minutesAgo(168),
      status: 'read',
    },
  ];
}

export const mockReplies = [
  'Noted. I will review this during your next consultation.',
  'Thank you for the update. Keep monitoring and rest well.',
  'That sounds good. Let me know if you notice any changes.',
  'Perfect. Stay on the current plan and we will adjust if needed.',
];

export function nextReply(previousCount) {
  return mockReplies[previousCount % mockReplies.length];
}

export function makeId() {
  return `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}
