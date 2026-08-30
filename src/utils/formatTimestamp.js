export default function formatTimestamp(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const elapsedMilliseconds = Date.now() - date.getTime();
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000);
  const elapsedHours = Math.floor(elapsedMilliseconds / 3600000);
  const elapsedDays = Math.floor(elapsedMilliseconds / 86400000);

  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  if (elapsedDays < 7) return `${elapsedDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
