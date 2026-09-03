import React, { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

// Collects only the user's non-secret Cloudinary name and unsigned preset.
export default function ConnectCloudStorageScreen({ initialCloudName = '', initialUploadPreset = '', saving, onSave, onBack }) {
  const [cloudName, setCloudName] = useState(initialCloudName);
  const [uploadPreset, setUploadPreset] = useState(initialUploadPreset);
  const [guideOpen, setGuideOpen] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (!cloudName.trim() || !uploadPreset.trim()) return setError('Cloud Name and Upload Preset are required.');
    setError('');
    try { await onSave(cloudName.trim(), uploadPreset.trim()); } catch (e) { setError(e.message); }
  }
  return <ScrollView className="flex-1 bg-canvas px-6 pt-8" contentContainerClassName="pb-12">
    <Pressable onPress={onBack}><Text className="text-brand">‹ Back</Text></Pressable>
    <Text className="mt-8 text-4xl font-extrabold text-ink dark:text-white">Connect Cloud Storage</Text>
    <Text className="mt-3 text-sm text-muted dark:text-[#aaa5b5]">Use your Cloudinary account for uploads. No API key or secret is needed for unsigned uploads.</Text>
    <Text className="mt-8 mb-2 font-bold text-ink dark:text-white">Cloud ID / Cloud Name</Text>
    <TextInput value={cloudName} onChangeText={setCloudName} autoCapitalize="none" placeholder="Paste your Cloudinary cloud name" placeholderTextColor="#999" className="h-14 rounded-2xl border border-line px-4 text-ink dark:border-[#343140] dark:text-white" />
    <Text className="mt-5 mb-2 font-bold text-ink dark:text-white">Unsigned Upload Preset</Text>
    <TextInput value={uploadPreset} onChangeText={setUploadPreset} autoCapitalize="none" placeholder="e.g. medi_unsigned" placeholderTextColor="#999" className="h-14 rounded-2xl border border-line px-4 text-ink dark:border-[#343140] dark:text-white" />
    <Pressable onPress={() => setGuideOpen(value => !value)} className="mt-6"><Text className="font-bold text-brand">{guideOpen ? 'Hide guide' : "Don't have an account?"}</Text></Pressable>
    {guideOpen && <View className="mt-4 rounded-2xl bg-surface p-4 dark:bg-[#201e29]"><Text className="font-extrabold text-ink dark:text-white">Step 1 — Create an account</Text><Image source={require('../assets/cloud-step-signup.png')} resizeMode="contain" style={{ width: '100%', height: 360 }} /><Pressable onPress={() => Linking.openURL('https://cloudinary.com/users/register/free')}><Text className="text-brand">Open Cloudinary signup</Text></Pressable><Text className="mt-6 font-extrabold text-ink dark:text-white">Step 2 — Open the menu</Text><Image source={require('../assets/cloud-step-menu.png')} resizeMode="contain" style={{ width: '100%', height: 360 }} /><Text className="mt-6 font-extrabold text-ink dark:text-white">Step 3 — Copy Cloud Name</Text><Image source={require('../assets/cloud-step-name.png')} resizeMode="contain" style={{ width: '100%', height: 360 }} /><Text className="mt-6 font-extrabold text-ink dark:text-white">Step 4 — Open Settings</Text><Image source={require('../assets/cloud-step-settings.png')} resizeMode="contain" style={{ width: '100%', height: 360 }} /><Text className="mt-6 font-extrabold text-ink dark:text-white">Step 5 — Open Upload presets</Text><Image source={require('../assets/cloud-step-upload.png')} resizeMode="contain" style={{ width: '100%', height: 360 }} /><Text className="mt-3 leading-6 text-ink dark:text-white">Copy the unsigned preset name into the Upload Preset field above.</Text></View>}
    {!!error && <Text className="mt-4 text-red-500">{error}</Text>}
    <Pressable disabled={saving} onPress={save} className="mt-8 h-14 items-center justify-center rounded-2xl bg-brand"><Text className="font-extrabold text-white">{saving ? 'Saving…' : 'Save and continue'}</Text></Pressable>
  </ScrollView>;
}
