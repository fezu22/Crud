import { useMemo } from 'react';

function localDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function useFeedItems({ tasks, media, search, filter }) {
  return useMemo(() => {
    const query = search.trim().toLowerCase();
    const todayKey = localDateKey(new Date());
    const taskItems = tasks
      .filter(task => {
        const matchesSearch =
          !query ||
          task.title?.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query);
        const dueKey = localDateKey(task.dueDate);
        const matchesFilter =
          filter === 'All' ||
          (filter === 'Today' && dueKey === todayKey && !task.completed) ||
          (filter === 'Upcoming' &&
            dueKey &&
            dueKey > todayKey &&
            !task.completed) ||
          (filter === 'Completed' && task.completed);
        return matchesSearch && matchesFilter;
      })
      .map(task => ({
        ...task,
        feedType: 'task',
        feedDate: task.createdAt || task.updatedAt,
      }));

    const taskImageUrls = new Set(
      tasks.flatMap(task =>
        task.imageUrls?.length
          ? task.imageUrls
          : task.imageUrl
            ? [task.imageUrl]
            : [],
      ),
    );
    const standaloneMedia = media.filter(
      item =>
        filter === 'All' &&
        item.kind !== 'taskAttachment' &&
        !taskImageUrls.has(item.imageUrl) &&
        (!query || item.title?.toLowerCase().includes(query)),
    );
    const batched = new Map();
    const singles = [];
    standaloneMedia.forEach(item => {
      if (item.batchId) {
        if (!batched.has(item.batchId)) batched.set(item.batchId, []);
        batched.get(item.batchId).push(item);
      } else {
        singles.push(item);
      }
    });
    const mediaItems = [
      ...Array.from(batched.values()).map(group => {
        const sorted = [...group].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
        const first = sorted[0];
        return {
          ...first,
          _id: first.batchId,
          mediaIds: sorted.map(entry => entry._id),
          imageUrls: sorted.map(entry => entry.imageUrl).filter(Boolean),
          feedType: 'media',
          feedDate: first.createdAt,
        };
      }),
      ...singles.map(item => ({
        ...item,
        imageUrls: item.imageUrl ? [item.imageUrl] : [],
        feedType: 'media',
        feedDate: item.createdAt,
      })),
    ];
    return [...taskItems, ...mediaItems].sort(
      (a, b) => new Date(b.feedDate) - new Date(a.feedDate),
    );
  }, [filter, media, search, tasks]);
}
