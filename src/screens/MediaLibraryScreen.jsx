import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, ImageBackground, Modal, Pressable,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import Video from 'react-native-video';
import { useColorScheme } from 'nativewind';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';

const FILTERS = ['all', 'video', 'audio'];
const WAVE_BARS = [11, 20, 14, 28, 18, 24, 13, 22, 16, 27, 12, 20];

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (!value) return 'Unknown size';
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function displayTitle(item) {
  return (item.title || item.originalName || 'Untitled media').replace(/\.[^/.]+$/, '');
}
function videoThumbnail(url) {
  if (!url?.includes('/video/upload/')) return '';
  return url.replace('/video/upload/', '/video/upload/so_0,w_900,h_500,c_fill,q_auto/')
    .replace(/\.[a-z0-9]+(?=\?|$)/i, '.jpg');
}
function MetaLine({ item }) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const date = formatDate(item.createdAt);
  return <Text style={[styles.meta, dark && darkStyles.mutedText]} numberOfLines={1}>{formatBytes(item.bytes)}{date ? `  •  ${date}` : ''}</Text>;
}
function TypeBadge({ type }) {
  const isVideo = type === 'video';
  return (
    <View style={[styles.typeBadge, isVideo ? styles.videoBadge : styles.audioBadge]}>
      <Text style={[styles.typeText, isVideo ? styles.videoTypeText : styles.audioTypeText]}>{isVideo ? 'VIDEO' : 'AUDIO'}</Text>
    </View>
  );
}
function Waveform({ dark = false }) {
  return (
    <View style={styles.waveform} accessibilityElementsHidden>
      {WAVE_BARS.map((height, index) => (
        <View key={`${height}-${index}`} style={[styles.waveBar, dark ? styles.waveBarDark : styles.waveBarLight, { height }]} />
      ))}
    </View>
  );
}
function VideoCard({ item, onOpen, onDelete }) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const thumbnail = videoThumbnail(item.mediaUrl || item.imageUrl);
  return (
    <Pressable style={[styles.videoCard, dark && darkStyles.card]} onPress={onOpen}>
      <ImageBackground source={thumbnail ? { uri: thumbnail } : undefined} style={styles.thumbnail} imageStyle={styles.thumbnailImage}>
        <View style={styles.thumbnailTint} />
        <View style={styles.playButtonLarge}><Text style={styles.playIcon}>▶</Text></View>
        <View style={styles.cardTypePosition}><TypeBadge type="video" /></View>
      </ImageBackground>
      <View style={styles.videoDetails}>
        <View style={styles.flexOne}>
          <Text style={[styles.cardTitle, dark && darkStyles.text]} numberOfLines={1}>{displayTitle(item)}</Text>
          <MetaLine item={item} />
        </View>
        <TouchableOpacity accessibilityLabel={`Delete ${displayTitle(item)}`} hitSlop={10} style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}
function AudioCard({ item, onOpen, onDelete }) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  return (
    <Pressable style={[styles.audioCard, dark && darkStyles.card]} onPress={onOpen}>
      <View style={styles.audioArtwork}><Text style={styles.micIcon}>♫</Text></View>
      <View style={styles.audioInfo}>
        <TypeBadge type="audio" />
        <Text style={[styles.cardTitle, dark && darkStyles.text]} numberOfLines={1}>{displayTitle(item)}</Text>
        <MetaLine item={item} />
        <Waveform />
      </View>
      <TouchableOpacity accessibilityLabel={`Delete ${displayTitle(item)}`} hitSlop={8} style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
      <View style={styles.playButtonSmall}><Text style={styles.playIconSmall}>▶</Text></View>
    </Pressable>
  );
}
function PlayerModal({ item, onClose, onError }) {
  if (!item) return null;
  const isVideo = item.mediaType === 'video';
  const url = item.mediaUrl || item.imageUrl;
  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.playerScreen}>
        <View style={styles.playerHeader}>
          <View style={styles.flexOne}>
            <Text style={styles.playerTitle} numberOfLines={1}>{displayTitle(item)}</Text>
            <Text style={styles.playerMeta}>{isVideo ? 'Video' : 'Audio'}  •  {formatBytes(item.bytes)}</Text>
          </View>
          <TouchableOpacity accessibilityLabel="Close player" style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.playerBody}>
          {isVideo ? (
            <Video source={{ uri: url }} style={styles.videoPlayer} controls resizeMode="contain" paused={false}
              onError={() => onError(new Error('This video could not be played.'))} />
          ) : (
            <View style={styles.audioPlayerCard}>
              <View style={styles.audioPlayerArtwork}><Text style={styles.audioPlayerIcon}>♫</Text></View>
              <Text style={styles.audioPlayerTitle} numberOfLines={2}>{displayTitle(item)}</Text>
              <Text style={styles.audioPlayerMeta}>{formatBytes(item.bytes)}  •  {formatDate(item.createdAt)}</Text>
              <Waveform dark />
              <Video source={{ uri: url }} style={styles.audioControls} controls paused={false} playInBackground={false}
                onError={() => onError(new Error('This audio file could not be played.'))} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
export default function MediaLibraryScreen({ media, uploading, onUpload, onDelete, onError }) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const [filter, setFilter] = useState('all');
  const [playingItem, setPlayingItem] = useState(null);
  const libraryItems = useMemo(() => media.filter(item => item.kind === 'library'), [media]);
  const visibleItems = useMemo(() => filter === 'all' ? libraryItems : libraryItems.filter(item => item.mediaType === filter), [filter, libraryItems]);
  const videoCount = libraryItems.filter(item => item.mediaType === 'video').length;
  const audioCount = libraryItems.filter(item => item.mediaType === 'audio').length;

  async function chooseFile(mediaType) {
    try {
      const [file] = await pick({ type: [mediaType === 'video' ? types.video : types.audio] });
      if (!file?.uri || file.hasRequestedType === false) throw new Error(`Please choose a valid ${mediaType} file.`);
      await onUpload(
        { uri: file.uri, type: file.type, fileName: file.name, size: file.size },
        (file.name || `${mediaType} upload`).replace(/\.[^/.]+$/, ''),
      );
    } catch (error) {
      if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) return;
      onError(error);
    }
  }

  return (
    <View style={[styles.screen, dark && darkStyles.screen]}>
      <FlatList
        data={visibleItems}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View><Text style={[styles.eyebrow, dark && darkStyles.mutedText]}>Library</Text><Text style={[styles.title, dark && darkStyles.text]}>Media</Text></View>
              <View style={styles.headerActions}>
                <TouchableOpacity disabled={uploading} style={styles.videoUploadButton} onPress={() => chooseFile('video')}>
                  <Text style={styles.videoUploadIcon}>▣</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={uploading} style={styles.audioUploadButton} onPress={() => chooseFile('audio')}>
                  <Text style={styles.audioUploadIcon}>♫</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.statsRow}>
              {[
                ['Total', libraryItems.length, '#EDE9FE', '#7C3AED'],
                ['Videos', videoCount, '#DBEAFE', '#1D4ED8'],
                ['Audio', audioCount, '#E0F2F1', '#0F766E'],
              ].map(([label, count, backgroundColor, color]) => (
                <View key={label} style={[styles.statCard, { backgroundColor }, dark && darkStyles.statCard]}>
                  <Text style={[styles.statCount, { color }]}>{count}</Text>
                  <Text style={[styles.statLabel, { color }]}>{label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.filters}>
              {FILTERS.map(value => {
                const active = value === filter;
                return (
                  <TouchableOpacity key={value} style={[styles.filterButton, dark && darkStyles.filterButton, active && styles.filterButtonActive]} onPress={() => setFilter(value)}>
                    <Text style={[styles.filterText, dark && darkStyles.mutedText, active && styles.filterTextActive]}>
                      {value === 'all' ? 'All' : value === 'video' ? 'Videos' : 'Audio'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {uploading ? (
              <View style={styles.uploadingBanner}>
                <ActivityIndicator color="#7C3AED" />
                <Text style={styles.uploadingText}>Uploading to your cloud library…</Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}><Text style={styles.emptyIcon}>▣</Text></View>
            <Text style={[styles.emptyTitle, dark && darkStyles.text]}>{libraryItems.length ? `No ${filter} files` : 'No media yet'}</Text>
            <Text style={[styles.emptyCopy, dark && darkStyles.mutedText]}>Keep your videos and audio in one place. Choose a file to add it to your library.</Text>
            {!libraryItems.length ? (
              <View style={styles.emptyActions}>
                <TouchableOpacity disabled={uploading} style={styles.emptyVideoButton} onPress={() => chooseFile('video')}>
                  <Text style={styles.emptyVideoText}>▣  Add video</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={uploading} style={styles.emptyAudioButton} onPress={() => chooseFile('audio')}>
                  <Text style={styles.emptyAudioText}>♫  Add audio</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => item.mediaType === 'video' ? (
          <VideoCard item={item} onOpen={() => setPlayingItem(item)} onDelete={() => onDelete(item)} />
        ) : (
          <AudioCard item={item} onOpen={() => setPlayingItem(item)} onDelete={() => onDelete(item)} />
        )}
      />
      <PlayerModal item={playingItem} onClose={() => setPlayingItem(null)} onError={onError} />
    </View>
  );
}

const shadow = {
  shadowColor: '#312E81', shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.09, shadowRadius: 14, elevation: 3,
};
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  listContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#8B8598', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  title: { color: '#181622', fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -1 },
  headerActions: { flexDirection: 'row', gap: 10 },
  videoUploadButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDE9FE' },
  videoUploadIcon: { color: '#7C3AED', fontSize: 22, fontWeight: '900' },
  audioUploadButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', ...shadow },
  audioUploadIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  statCard: { flex: 1, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14 },
  statCount: { fontSize: 23, fontWeight: '900' },
  statLabel: { marginTop: 1, fontSize: 12, fontWeight: '700', opacity: 0.78 },
  filters: { flexDirection: 'row', gap: 9, marginTop: 20, marginBottom: 16 },
  filterButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEAF2' },
  filterButtonActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED', ...shadow },
  filterText: { color: '#777181', fontSize: 13, fontWeight: '800' },
  filterTextActive: { color: '#FFFFFF' },
  uploadingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#F0ECFF', paddingVertical: 12, marginBottom: 14 },
  uploadingText: { color: '#6D28D9', fontSize: 13, fontWeight: '800', marginLeft: 9 },
  videoCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 15, overflow: 'hidden', ...shadow },
  thumbnail: { height: 154, backgroundColor: '#312E81', alignItems: 'center', justifyContent: 'center' },
  thumbnailImage: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  thumbnailTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,16,48,0.28)' },
  playButtonLarge: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  playIcon: { color: '#7C3AED', fontSize: 20, marginLeft: 3 },
  cardTypePosition: { position: 'absolute', left: 14, bottom: 12 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  videoBadge: { backgroundColor: '#DBEAFE' },
  audioBadge: { backgroundColor: '#CCFBF1' },
  typeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  videoTypeText: { color: '#1D4ED8' },
  audioTypeText: { color: '#0F766E' },
  videoDetails: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  flexOne: { flex: 1 },
  cardTitle: { color: '#211E2B', fontSize: 15, fontWeight: '800', marginTop: 6 },
  meta: { color: '#8B8598', fontSize: 11, fontWeight: '600', marginTop: 4 },
  deleteButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  deleteText: { color: '#EF4444', fontSize: 21, lineHeight: 23, fontWeight: '500' },
  chevron: { color: '#7C3AED', fontSize: 28, marginLeft: 9 },
  audioCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, marginBottom: 13, ...shadow },
  audioArtwork: { width: 62, height: 72, borderRadius: 17, backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center' },
  micIcon: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  audioInfo: { flex: 1, marginLeft: 13 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 30, marginTop: 7 },
  waveBar: { width: 3, borderRadius: 2 },
  waveBarDark: { backgroundColor: '#5EEAD4' },
  waveBarLight: { backgroundColor: '#99F6E4' },
  playButtonSmall: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center', marginLeft: 9 },
  playIconSmall: { color: '#FFFFFF', fontSize: 13, marginLeft: 2 },
  emptyState: { flex: 1, minHeight: 350, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 },
  emptyIconBox: { width: 76, height: 76, borderRadius: 25, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { color: '#7C3AED', fontSize: 34, fontWeight: '900' },
  emptyTitle: { color: '#211E2B', fontSize: 20, fontWeight: '900', marginTop: 18 },
  emptyCopy: { color: '#8B8598', fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280, marginTop: 7 },
  emptyActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  emptyVideoButton: { borderRadius: 14, backgroundColor: '#EDE9FE', paddingHorizontal: 16, paddingVertical: 12 },
  emptyVideoText: { color: '#6D28D9', fontWeight: '800' },
  emptyAudioButton: { borderRadius: 14, backgroundColor: '#7C3AED', paddingHorizontal: 16, paddingVertical: 12 },
  emptyAudioText: { color: '#FFFFFF', fontWeight: '800' },
  playerScreen: { flex: 1, backgroundColor: '#111018' },
  playerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 18 },
  playerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  playerMeta: { color: '#A8A3B3', fontSize: 12, fontWeight: '600', marginTop: 5 },
  closeButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginLeft: 15 },
  closeText: { color: '#FFFFFF', fontSize: 29, lineHeight: 31 },
  playerBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  videoPlayer: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000000', borderRadius: 18 },
  audioPlayerCard: { width: '100%', maxWidth: 430, borderRadius: 28, padding: 24, backgroundColor: '#201E2B', alignItems: 'center' },
  audioPlayerArtwork: { width: 118, height: 118, borderRadius: 34, backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  audioPlayerIcon: { color: '#FFFFFF', fontSize: 50, fontWeight: '900' },
  audioPlayerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  audioPlayerMeta: { color: '#A8A3B3', fontSize: 12, marginTop: 7, marginBottom: 9 },
  audioControls: { width: '100%', height: 58, marginTop: 12, backgroundColor: '#111018' },
});

const darkStyles = StyleSheet.create({
  screen: { backgroundColor: '#12111A' },
  card: { backgroundColor: '#201E29', shadowColor: '#000000' },
  text: { color: '#F8F7FC' },
  mutedText: { color: '#AAA5B5' },
  statCard: { borderWidth: 1, borderColor: '#343140' },
  filterButton: { backgroundColor: '#201E29', borderColor: '#343140' },
});