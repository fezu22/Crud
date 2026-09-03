import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

export default function UploadScreen({ user, uploading, onUpload, onNeedCloudConnection, onError }) {
  const [selecting, setSelecting] = useState(false);
  async function choose(mediaType) {
    try {
      if (!(await onNeedCloudConnection())) return;
      setSelecting(true);
      const result = await launchImageLibrary({ mediaType, selectionLimit: 1, videoQuality: 'high' });
      if (result.didCancel) return;
      if (result.errorMessage) throw new Error(result.errorMessage);
      const asset = result.assets?.[0];
      if (!asset?.uri) throw new Error('Please choose an image or video.');
      await onUpload({ uri: asset.uri, type: asset.type, fileName: asset.fileName, size: asset.fileSize });
    } catch (error) { onError(error); } finally { setSelecting(false); }
  }
  const busy = selecting || uploading;
  return <View className="flex-1 bg-canvas px-6 pt-10">
    <Text className="text-4xl font-extrabold text-ink dark:text-white">Upload</Text>
    <Text className="mt-3 text-sm text-muted dark:text-[#aaa5b5]">Upload directly to your Cloudinary account.</Text>
    <Text className="mt-8 text-xs text-muted dark:text-[#aaa5b5]">{user?.cloudName} · {user?.uploadPreset}</Text>
    {busy ? <View className="mt-8 flex-row items-center"><ActivityIndicator color="#7C3AED" /><Text className="ml-3 font-bold text-ink dark:text-white">Uploading…</Text></View> : null}
    <Pressable disabled={busy} onPress={() => choose('photo')} className="mt-8 h-14 items-center justify-center rounded-2xl bg-brand"><Text className="font-extrabold text-white">Choose image</Text></Pressable>
    <Pressable disabled={busy} onPress={() => choose('video')} className="mt-4 h-14 items-center justify-center rounded-2xl border border-brand"><Text className="font-extrabold text-brand">Choose video</Text></Pressable>
  </View>;
}
