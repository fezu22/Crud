import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidStyle,
  AuthorizationStatus,
  EventType,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_NAME = 'Medi';
const CHANNEL_ID = 'medi-task-reminders';
const CHAT_CHANNEL_ID = 'medi-chat-messages';
const REMINDER_PREFIX = 'task-reminder-';
const LEGACY_TIMER_PREFIX = 'task-timer-';
const ADVANCE_MS = 2 * 60000;
const PENDING_NOTIFICATION_PRESS_KEY = '@medi_pending_notification_press';

if (typeof notifee.onBackgroundEvent === 'function') {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) {
      return;
    }

    const data = detail?.notification?.data || null;
    if (data?.screen === 'chat') {
      await AsyncStorage.setItem(PENDING_NOTIFICATION_PRESS_KEY, JSON.stringify(data));
    }
  });
}

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

async function ensureChatChannel() {
  return notifee.createChannel({
    id: CHAT_CHANNEL_ID,
    name: 'Chat messages',
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

export async function showChatNotification({
  senderName,
  text,
  messageId,
  conversationId,
  senderId,
  otherUserId,
}) {
  if (!(await requestNotificationPermission())) return false;

  const channelId = await ensureChatChannel();
  await notifee.displayNotification({
    id: `chat-message-${String(messageId || Date.now())}`,
    title: senderName || 'New chat message',
    body: text || 'Sent an attachment',
    data: {
      conversationId: String(conversationId || ''),
      messageId: String(messageId || ''),
      senderId: String(senderId || otherUserId || ''),
      screen: 'chat',
    },
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
      color: '#6C4DF6',
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
  });
  return true;
}

export async function cancelChatNotifications(conversationId, messageIds = []) {
  try {
    const ids = new Set((messageIds || []).filter(Boolean).map(id => `chat-message-${String(id)}`));
    await Promise.all([...ids].map(id => notifee.cancelNotification(id)));

    if (conversationId) {
      const displayed = await notifee.getDisplayedNotifications();
      const matchingIds = displayed
        .filter(item => String(item?.notification?.data?.conversationId || '') === String(conversationId))
        .map(item => item.notification.id)
        .filter(Boolean);
      await Promise.all(matchingIds.map(id => notifee.cancelNotification(id)));
    }

    console.info('[NOTIFICATION] cancelled because read', {
      conversationId: String(conversationId || ''),
      count: ids.size,
    });
  } catch (error) {
    console.warn('Could not cancel chat notifications:', error);
  }
}

export async function getInitialNotificationData() {
  const initial = await notifee.getInitialNotification();
  if (initial?.notification?.data) {
    return initial.notification.data;
  }

  const pending = await AsyncStorage.getItem(PENDING_NOTIFICATION_PRESS_KEY);
  if (!pending) return null;
  await AsyncStorage.removeItem(PENDING_NOTIFICATION_PRESS_KEY);
  try {
    return JSON.parse(pending);
  } catch {
    return null;
  }
}

export function onNotificationPress(listener) {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      listener(detail?.notification?.data || null);
    }
  });
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
