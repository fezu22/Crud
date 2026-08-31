import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';

const LAST_REMINDER = '@medi_last_reminder';

export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

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
    id: 'task-reminders',
    name: 'Task reminders',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    id: `due-tasks-${today}`,
    title: "Today's tasks",
    body: `You have ${due.length} task${due.length === 1 ? '' : 's'} due today.`,
    android: {
      channelId,
      smallIcon: 'ic_launcher',
      pressAction: { id: 'default' },
    },
  });

  await AsyncStorage.setItem(LAST_REMINDER, today);
  return true;
}
