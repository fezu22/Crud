import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidStyle,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';

const APP_NAME = 'Medi';
const CHANNEL_ID = 'medi-task-reminders';
const REMINDER_PREFIX = 'task-reminder-';
const LEGACY_TIMER_PREFIX = 'task-timer-';
const ADVANCE_MS = 2 * 60000;

function getReminderTimestamp(task) {
  if (!task?.reminderAt) return null;
  const selectedTime = new Date(task.reminderAt).getTime();
  if (!Number.isFinite(selectedTime)) return null;
  return selectedTime - ADVANCE_MS;
}

async function ensureChannel() {
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Task reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

async function createTaskReminder(task, channelId) {
  const timestamp = getReminderTimestamp(task);
  if (!timestamp || timestamp <= Date.now()) return false;

  const settings = await notifee.getNotificationSettings();
  const exactAlarmsEnabled =
    settings.android?.alarm === AndroidNotificationSetting.ENABLED;
  const selectedTime = new Date(task.reminderAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  await notifee.createTriggerNotification(
    {
      id: `${REMINDER_PREFIX}${task._id}`,
      title: `Task starts in 2 minutes · ${APP_NAME}`,
      body: `"${task.title}" is scheduled for ${selectedTime}.`,
      subtitle: 'Task reminder',
      data: { taskId: String(task._id) },
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        color: '#7C3AED',
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `Get ready for "${task.title}". It starts at ${selectedTime}.`,
        },
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp,
      ...(exactAlarmsEnabled
        ? { alarmManager: { allowWhileIdle: true } }
        : {}),
    },
  );
  return true;
}

export async function scheduleTaskReminders(task) {
  if (!task?._id) return false;
  await cancelTaskReminders(task._id);
  if (task.completed || !getReminderTimestamp(task)) return false;
  if (!(await requestNotificationPermission())) return false;
  return createTaskReminder(task, await ensureChannel());
}

export async function cancelTaskReminders(taskId) {
  if (!taskId) return;
  try {
    await Promise.all([
      notifee.cancelNotification(`${REMINDER_PREFIX}${taskId}`),
      notifee.cancelNotification(`${LEGACY_TIMER_PREFIX}${taskId}`),
      ...Array.from({ length: 6 }, (_, index) =>
        notifee.cancelNotification(`task-${taskId}-${index + 1}`),
      ),
    ]);
  } catch (error) {
    console.warn('Could not cancel task reminder:', error);
  }
}

export async function cancelAllTaskReminders() {
  try {
    const triggerIds = await notifee.getTriggerNotificationIds();
    await Promise.all(
      triggerIds
        .filter(
          id =>
            id.startsWith(REMINDER_PREFIX) ||
            id.startsWith(LEGACY_TIMER_PREFIX) ||
            id.startsWith('task-'),
        )
        .map(id => notifee.cancelNotification(id)),
    );
    await notifee.cancelAllNotifications();
  } catch (error) {
    console.warn('Could not clear notifications:', error);
  }
}

export async function syncTaskReminders(tasks = [], enabled) {
  if (!enabled) {
    await cancelAllTaskReminders();
    return;
  }
  if (!(await requestNotificationPermission())) return;

  const channelId = await ensureChannel();
  const schedulable = tasks
    .filter(
      task =>
        task?._id &&
        !task.completed &&
        getReminderTimestamp(task) > Date.now(),
    )
    .sort((a, b) => getReminderTimestamp(a) - getReminderTimestamp(b))
    .slice(0, 50);
  const wantedIds = new Set(
    schedulable.map(task => `${REMINDER_PREFIX}${task._id}`),
  );
  const triggerIds = await notifee.getTriggerNotificationIds();

  await Promise.all(
    triggerIds
      .filter(
        id =>
          (id.startsWith(REMINDER_PREFIX) && !wantedIds.has(id)) ||
          id.startsWith(LEGACY_TIMER_PREFIX),
      )
      .map(id => notifee.cancelNotification(id)),
  );
  await Promise.all(schedulable.map(task => createTaskReminder(task, channelId)));
}
