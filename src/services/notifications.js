import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';

const LAST_REMINDER = '@todi_last_reminder';
const APP_NAME = 'Todi';

export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

// Daily due tasks reminder (app open pe)
export async function showDueTaskReminder(tasks, enabled) {
  if (!enabled || !tasks.length) return false;
  if (!(await requestNotificationPermission())) return false;

  const today = new Date().toISOString().slice(0, 10);
  if ((await AsyncStorage.getItem(LAST_REMINDER)) === today) return false;

  const due = tasks.filter(
    task =>
      !task.completed &&
      task.dueDate &&
      new Date(task.dueDate).toISOString().slice(0, 10) === today,
  );
  if (!due.length) return false;

  const channelId = await notifee.createChannel({
    id: 'todi-reminders',
    name: 'Todi Reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  await notifee.displayNotification({
    id: `due-tasks-${today}`,
    title: `📋 ${APP_NAME}`,
    body: due.length === 1
      ? `You have 1 task due today: "${due[0].title}"`
      : `You have ${due.length} tasks due today. Stay on track!`,
    subtitle: 'Daily Reminder',
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      pressAction: { id: 'default' },
      color: '#7C3AED',          // purple brand color
      style: {
        type: AndroidStyle.BIGTEXT,
        text: due.map((t, i) => `${i + 1}. ${t.title}`).join('\n'),
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

  await AsyncStorage.setItem(LAST_REMINDER, today);
  return true;
}

// Smart timer reminder (duration khatam hone pe)
export async function scheduleTaskReminders(task) {
  if (!task?._id || task.completed) return;

  const totalMinutes = Math.max(1, task.durationMinutes || 30);

  // Pehle purani cancel karo
  await cancelTaskReminders(task._id);

  if (!(await requestNotificationPermission())) return;

  const channelId = await notifee.createChannel({
    id: 'todi-timer',
    name: 'Todi Timer',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  const triggerTime = Date.now() + totalMinutes * 60 * 1000;

  await notifee.createTriggerNotification(
    {
      id: `task-timer-${task._id}`,
      title: `⏰ ${APP_NAME}`,
      body: `Time's up! "${task.title}" is complete.`,
      subtitle: 'Timer Finished',
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        largeIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        color: '#7C3AED',
        showChronometer: true,
        chronometerDirection: 'down',
        timestamp: triggerTime,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: `Your ${totalMinutes} min timer for "${task.title}" has ended.\n\nOpen ${APP_NAME} to mark it done or start the next task.`,
        },
        actions: [
          {
            title: '✅ Mark Done',
            pressAction: { id: 'mark-done' },
          },
          {
            title: '👀 Open App',
            pressAction: { id: 'default' },
          },
        ],
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
      timestamp: triggerTime,
    },
  );
}

export async function cancelTaskReminders(taskId) {
  if (!taskId) return;
  try {
    await notifee.cancelNotification(`task-timer-${taskId}`);
    // safety: cancel old style ids bhi
    for (let i = 1; i <= 6; i++) {
      await notifee.cancelNotification(`task-${taskId}-${i}`);
    }
  } catch (e) {
    console.log('Cancel reminders error:', e);
  }
}