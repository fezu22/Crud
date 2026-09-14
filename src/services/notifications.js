import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidStyle,
  AuthorizationStatus,
  EventType,
  TriggerType,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendChatMessage } from './api';
import { loadSession } from '../storage/sessionStorage';

const APP_NAME = 'Medi';
const CHANNEL_ID = 'medi-task-reminders';
const CHAT_CHANNEL_ID = 'medi-chat-messages';
const REMINDER_PREFIX = 'task-reminder-';
const LEGACY_TIMER_PREFIX = 'task-timer-';
const ADVANCE_MS = 2 * 60000;
const PENDING_NOTIFICATION_PRESS_KEY = '@medi_pending_notification_press';
const CHAT_REPLY_ACTION_ID = 'reply';

function getChatNotificationData(data = {}) {
  return {
    conversationId: String(data.conversationId || ''),
    messageId: String(data.messageId || ''),
    senderId: String(data.senderId || data.otherUserId || ''),
    otherUserId: String(data.otherUserId || data.senderId || ''),
    screen: 'chat',
  };
}

async function sendQuickReplyFromNotification(detail) {
  const data = getChatNotificationData(detail?.notification?.data || {});
  const replyText = String(detail?.input || '').trim();

  if (!replyText || !data.senderId) {
    return false;
  }

  const session = await loadSession();
  if (!session.token) {
    console.warn('[NOTIFICATION] quick reply failed', {
      reason: 'missing session',
      conversationId: data.conversationId,
      messageId: data.messageId,
    });
    return false;
  }

  await sendChatMessage(data.senderId, replyText, session.token);
  await cancelChatNotifications(data.conversationId, data.messageId ? [data.messageId] : []);
  console.info('[NOTIFICATION] quick reply sent', {
    conversationId: data.conversationId,
    messageId: data.messageId,
  });
  return true;
}

if (typeof notifee.onBackgroundEvent === 'function') {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) {
      return;
    }

    const data = detail?.notification?.data || null;
    if (
      type === EventType.ACTION_PRESS &&
      detail?.pressAction?.id === CHAT_REPLY_ACTION_ID
    ) {
      await sendQuickReplyFromNotification(detail);
      return;
    }

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
  senderProfileImageUrl,
  appState,
}) {
  if (appState === 'active') {
    console.info('[NOTIFICATION] suppressed because app foreground', {
      conversationId: String(conversationId || ''),
      messageId: String(messageId || ''),
    });
    return false;
  }

  if (!(await requestNotificationPermission())) return false;

  const channelId = await ensureChatChannel();
  const notificationData = getChatNotificationData({
    conversationId,
    messageId,
    senderId,
    otherUserId,
  });
  const resolvedSenderName = senderName || 'New chat message';
  const resolvedBody = text || 'Sent an attachment';
  const senderPerson = {
    name: resolvedSenderName,
    id: notificationData.senderId || resolvedSenderName,
    important: true,
    ...(senderProfileImageUrl ? { icon: senderProfileImageUrl } : {}),
  };

  await notifee.displayNotification({
    id: `chat-message-${String(messageId || Date.now())}`,
    title: resolvedSenderName,
    body: resolvedBody,
    data: notificationData,
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      largeIcon: senderProfileImageUrl || undefined,
      pressAction: { id: 'default' },
      color: '#6C4DF6',
      groupId: notificationData.conversationId
        ? `chat-${notificationData.conversationId}`
        : undefined,
      showTimestamp: true,
      actions: notificationData.senderId
        ? [{
          title: 'Reply',
          pressAction: { id: CHAT_REPLY_ACTION_ID },
          input: {
            allowFreeFormInput: true,
            placeholder: 'Reply...',
          },
        }]
        : undefined,
      style: {
        type: AndroidStyle.MESSAGING,
        person: {
          name: APP_NAME,
          id: 'medi-current-user',
        },
        messages: [{
          text: resolvedBody,
          timestamp: Date.now(),
          person: senderPerson,
        }],
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
  });
  console.info('[NOTIFICATION] displayed because app background', {
    conversationId: notificationData.conversationId,
    messageId: notificationData.messageId,
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
    if (
      type === EventType.ACTION_PRESS &&
      detail?.pressAction?.id === CHAT_REPLY_ACTION_ID
    ) {
      sendQuickReplyFromNotification(detail)
        .catch(error => console.warn('[NOTIFICATION] quick reply failed', {
          message: String(error?.message || 'Reply failed.').slice(0, 160),
        }));
      return;
    }

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
