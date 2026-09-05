import React, { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const addProfileImageIcon = require('../../assets/add-profile-image.png');

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
  onConnectCloud,
  profileImage,
  onEditProfileImage,
  onError,
}) {
  const dark = theme === 'dark';
  const [choosingImage, setChoosingImage] = useState(false);
  const displayName = user?.name || user?.email || user?.phoneNumber || 'Your account';
  const avatarInitial = displayName[0]?.toUpperCase() || 'U';
  const cloudConnected = Boolean(user?.cloudName && user?.uploadPreset);

  async function chooseProfileImage() {
    if (choosingImage) return;
    setChoosingImage(true);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.85,
        selectionLimit: 1,
      });
      if (result.didCancel) return;
      if (result.errorMessage) throw new Error(result.errorMessage);
      const uri = result.assets?.[0]?.uri;
      if (!uri) throw new Error('Please choose a profile photo.');
      await onEditProfileImage?.(uri);
    } catch (error) {
      onError?.(error);
    } finally {
      setChoosingImage(false);
    }
  }

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
        <TouchableOpacity
          className="relative"
          onPress={chooseProfileImage}
          disabled={choosingImage}
          accessibilityRole="button"
          accessibilityLabel="Edit profile photo"
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} className="h-24 w-24 rounded-[32px]" />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-[#eae5ff] dark:bg-[#2c2840]">
              <Text className="text-4xl font-extrabold text-brand">
                {avatarInitial}
              </Text>
            </View>
          )}
          <View className="absolute -bottom-2 -right-2 h-9 w-9 items-center justify-center rounded-full border-4 border-canvas bg-brand dark:border-[#12111a]">
            {choosingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Image
                source={addProfileImageIcon}
                className="h-5 w-5"
                resizeMode="contain"
              />
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={chooseProfileImage} disabled={choosingImage}>
          <Text className="mt-4 text-xs font-extrabold text-brand">Edit profile photo</Text>
        </TouchableOpacity>
        <Text className="mt-4 text-2xl font-extrabold text-ink dark:text-white">
          {displayName}
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
        {!cloudConnected && (
          <TouchableOpacity onPress={onConnectCloud} className="h-[72px] flex-row items-center border-b border-line px-4 dark:border-[#343140]">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#f1eefc] dark:bg-[#2c2840]"><Text className="dark:text-white">☁</Text></View>
            <View className="flex-1"><Text className="font-bold text-ink dark:text-white">Cloud storage</Text><Text className="mt-0.5 text-xs text-muted dark:text-[#aaa5b5]">Connect before uploading</Text></View><Text className="text-2xl text-[#b0acb9]">›</Text>
          </TouchableOpacity>
        )}
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
