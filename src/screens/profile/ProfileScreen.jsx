import React from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

const Stat = ({ value, label }) => (
  <View className="flex-1 items-center">
    <Text className="text-2xl font-extrabold text-ink dark:text-white">
      {value}
    </Text>
    <Text className="mt-1 text-xs text-muted dark:text-[#aaa5b5]">{label}</Text>
  </View>
);
const Setting = ({ icon, title, subtitle, value, onChange }) => (
  <View className="h-[72px] flex-row items-center border-b border-line px-4 dark:border-[#343140]">
    <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#f1eefc] dark:bg-[#2c2840]">
      <Text className="dark:text-white">{icon}</Text>
    </View>
    <View className="flex-1">
      <Text className="font-bold text-ink dark:text-white">{title}</Text>
      <Text className="mt-0.5 text-xs text-muted dark:text-[#aaa5b5]">
        {subtitle}
      </Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: '#D8D4E1', true: '#A99AF7' }}
      thumbColor={value ? '#6750E8' : '#FFFFFF'}
    />
  </View>
);

export default function ProfileScreen({
  user,
  tasks,
  projects,
  onLogout,
  theme,
  notifications,
  onToggleTheme,
  onToggleNotifications,
}) {
  const dark = theme === 'dark';
  return (
    <ScrollView
      className="flex-1 bg-canvas dark:bg-[#12111a]"
      contentContainerClassName="px-6 pb-28 pt-6"
    >
      <Text className="text-[10px] font-extrabold tracking-[2px] text-brand">
        YOUR SPACE
      </Text>
      <Text className="mt-1 text-4xl font-extrabold tracking-tight text-ink dark:text-white">
        Profile
      </Text>
      <View className="items-center py-8">
        <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-[#eae5ff] dark:bg-[#2c2840]">
          <Text className="text-4xl font-extrabold text-brand">
            {(user?.name || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text className="mt-4 text-2xl font-extrabold text-ink dark:text-white">
          {user?.name || 'Tidy User'}
        </Text>
        <Text className="mt-1 text-sm text-muted dark:text-[#aaa5b5]">
          {user?.email || user?.phoneNumber || 'Welcome back'}
        </Text>
      </View>
      <View className="mb-8 flex-row rounded-3xl bg-surface py-5 dark:bg-[#201e29]">
        <Stat value={tasks.length} label="Tasks" />
        <Stat value={tasks.filter(t => t.completed).length} label="Completed" />
        <Stat value={projects.length} label="Projects" />
      </View>
      <Text className="mb-3 text-[10px] font-extrabold tracking-[2px] text-muted dark:text-[#aaa5b5]">
        PREFERENCES
      </Text>
      <View className="overflow-hidden rounded-3xl border border-line dark:border-[#343140] dark:bg-[#1b1923]">
        <Setting
          icon="♢"
          title="Notifications"
          subtitle={
            notifications
              ? 'Task reminders are enabled'
              : 'Task reminders are muted'
          }
          value={notifications}
          onChange={onToggleNotifications}
        />
        <Setting
          icon={dark ? '☀' : '☾'}
          title="Dark theme"
          subtitle={dark ? 'Dark appearance' : 'Light appearance'}
          value={dark}
          onChange={onToggleTheme}
        />
        <TouchableOpacity className="h-[72px] flex-row items-center px-4">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#f1eefc] dark:bg-[#2c2840]">
            <Text className="dark:text-white">?</Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-ink dark:text-white">
              Help & Support
            </Text>
            <Text className="mt-0.5 text-xs text-muted dark:text-[#aaa5b5]">
              Get help with Tidy
            </Text>
          </View>
          <Text className="text-2xl text-[#b0acb9]">›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        className="mt-6 h-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-[#351f25]"
        onPress={onLogout}
      >
        <Text className="font-extrabold text-red-500">Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
