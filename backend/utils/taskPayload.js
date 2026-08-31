const TASK_UPDATE_FIELDS = [
  'title',
  'description',
  'imageUrl',
  'imageUrls',
  'completed',
  'dueDate',
  'reminderAt',
  'priority',
  'category',
  'projectId',
  'subtasks',
];

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeOptionalDate(value, fieldName) {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`${fieldName} must be a valid date`);
  }
  return date;
}

function buildTaskCreatePayload(body, userId) {
  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter(Boolean)
    : [];
  return {
    user: userId,
    title: body.title ? body.title.trim() : '',
    description: body.description ? body.description.trim() : '',
    imageUrl: body.imageUrl || '',
    imageUrls,
    dueDate: normalizeOptionalDate(body.dueDate, 'dueDate'),
    reminderAt: normalizeOptionalDate(body.reminderAt, 'reminderAt'),
    priority: body.priority || 'Medium',
    category: body.category || 'Personal',
    projectId: body.projectId || null,
    subtasks: Array.isArray(body.subtasks) ? body.subtasks : [],
  };
}

function pickTaskUpdates(body) {
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => TASK_UPDATE_FIELDS.includes(key)),
  );
  if (Object.hasOwn(updates, 'dueDate')) {
    updates.dueDate = normalizeOptionalDate(updates.dueDate, 'dueDate');
  }
  if (Object.hasOwn(updates, 'reminderAt')) {
    updates.reminderAt = normalizeOptionalDate(updates.reminderAt, 'reminderAt');
  }
  return updates;
}

module.exports = {
  TASK_UPDATE_FIELDS,
  buildTaskCreatePayload,
  normalizeOptionalDate,
  pickTaskUpdates,
};
