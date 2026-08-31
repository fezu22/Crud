import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaLibraryScreen({
  media,
  uploading,
  onUpload,
  onDelete,
  onError,
}) {
  const [title, setTitle] = useState('');
  const libraryItems = useMemo(
    () => media.filter(item => item.kind === 'library'),
    [media],
  );

  async function chooseFile(mediaType) {
    try {
      const [file] = await pick({
        type: [mediaType === 'video' ? types.video : types.audio],
      });
      if (!file?.uri || file.hasRequestedType === false) {
        throw new Error(`Please choose a valid ${mediaType} file.`);
      }
      await onUpload(
        {
          uri: file.uri,
          type: file.type,
          fileName: file.name,
          size: file.size,
        },
        title.trim() || file.name || `${mediaType} upload`,
      );
      setTitle('');
    } catch (error) {
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      onError(error);
    }
  }

  return (
    <View className="flex-1 bg-canvas px-5 pt-5">
      <Text className="text-[10px] font-extrabold tracking-[2px] text-brand">
        CLOUD LIBRARY
      </Text>
      <Text className="mt-1 text-4xl font-extrabold tracking-tight text-ink">
        Videos & Audio
      </Text>
      <Text className="mt-2 text-sm leading-5 text-muted">
        Files are stored in Cloudinary. MongoDB only keeps their IDs and metadata.
      </Text>

      <TextInput
        className="mt-5 h-12 rounded-2xl border border-line bg-canvas px-4 text-ink"
        value={title}
        onChangeText={setTitle}
        placeholder="Optional title"
        placeholderTextColor="#817C94"
        editable={!uploading}
      />
      <View className="mt-3 flex-row">
        <TouchableOpacity
          className="mr-2 flex-1 items-center rounded-2xl bg-[#7C3AED] py-3.5"
          disabled={uploading}
          onPress={() => chooseFile('video')}
        >
          <Text className="font-extrabold text-white">Upload video / MP4</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="ml-2 flex-1 items-center rounded-2xl bg-[#4F6BED] py-3.5"
          disabled={uploading}
          onPress={() => chooseFile('audio')}
        >
          <Text className="font-extrabold text-white">Upload audio</Text>
        </TouchableOpacity>
      </View>

      {uploading ? (
        <View className="mt-5 flex-row items-center justify-center rounded-2xl bg-[#eeeaff] py-3">
          <ActivityIndicator color="#7C3AED" />
          <Text className="ml-2 font-semibold text-[#7C3AED]">Uploading…</Text>
        </View>
      ) : null}

      <FlatList
        className="mt-5"
        data={libraryItems}
        keyExtractor={item => item._id}
        contentContainerClassName={libraryItems.length ? 'pb-28' : 'flex-grow pb-28'}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pb-16">
            <Text className="text-4xl">♫</Text>
            <Text className="mt-3 text-lg font-extrabold text-ink">No media yet</Text>
            <Text className="mt-1 text-center text-sm text-muted">
              Upload an MP4, video, voice note, or audio file.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const url = item.mediaUrl || item.imageUrl;
          return (
            <View className="mb-3 rounded-3xl border border-line bg-canvas p-4">
              <View className="flex-row items-center">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#eeeaff]">
                  <Text className="text-xl text-[#7C3AED]">
                    {item.mediaType === 'video' ? '▶' : '♫'}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-extrabold text-ink" numberOfLines={1}>
                    {item.title || item.originalName || 'Untitled media'}
                  </Text>
                  <Text className="mt-1 text-xs font-semibold uppercase text-muted">
                    {item.mediaType} {formatBytes(item.bytes) ? `· ${formatBytes(item.bytes)}` : ''}
                  </Text>
                </View>
              </View>
              <View className="mt-3 flex-row">
                <TouchableOpacity
                  className="mr-2 flex-1 items-center rounded-xl bg-[#eeeaff] py-2.5"
                  onPress={() => Linking.openURL(url)}
                >
                  <Text className="font-bold text-[#5B5CE2]">Open / Play</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="ml-2 items-center rounded-xl bg-red-50 px-5 py-2.5"
                  onPress={() => onDelete(item)}
                >
                  <Text className="font-bold text-red-500">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
