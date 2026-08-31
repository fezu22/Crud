import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import formatTimestamp from '../utils/formatTimestamp';

const filters = ['All', 'Today', 'Upcoming', 'Completed'];
const statThemes = [
  ['bg-[#eeeaff]', 'text-brand'],
  ['bg-[#e2f7f3]', 'text-[#168b7b]'],
  ['bg-[#fff0e5]', 'text-[#bd4a13]'],
];

function EmptyFeed() {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-[#eeeaff]">
        <Text className="text-3xl text-brand">✓</Text>
      </View>
      <Text className="mt-5 text-xl font-extrabold text-ink">
        Your task list is empty
      </Text>
      <Text className="mt-2 text-center text-sm leading-5 text-muted">
        Tap the + button to create your first task.
      </Text>
    </View>
  );
}

function TaskCard({ item, onPress }) {
  const images = item.imageUrls?.length
    ? item.imageUrls
    : item.imageUrl
    ? [item.imageUrl]
    : [];
  return (
    <TouchableOpacity
      className="mb-4 overflow-hidden rounded-3xl border border-line bg-canvas p-4"
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View className="flex-row items-start">
        <View
          className={`mr-3 h-7 w-7 items-center justify-center rounded-lg border-2 ${
            item.completed ? 'border-brand bg-brand' : 'border-brand'
          }`}
        >
          {item.completed && (
            <Text className="font-extrabold text-white">✓</Text>
          )}
        </View>
        <View className="flex-1">
          <Text
            className={`text-base font-extrabold ${
              item.completed ? 'text-muted line-through' : 'text-ink'
            }`}
          >
            {item.title}
          </Text>
          {item.description ? (
            <Text className="mt-1 text-sm leading-5 text-muted">
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
      {images.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
        >
          {images.map((uri, index) => (
            <Image
              key={uri + index}
              source={{ uri }}
              className="mr-2 h-24 w-32 rounded-2xl"
            />
          ))}
        </ScrollView>
      ) : null}
      <View className="mt-4 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-muted">
          {formatTimestamp(item.feedDate)}
        </Text>
        <Text className="text-xs font-semibold text-muted">
          {item.category || 'Personal'} · {item.priority || 'Medium'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function MediaCard({ item, onDelete }) {
  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-line bg-canvas p-4">
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          className="h-52 w-full rounded-2xl"
          resizeMode="cover"
        />
      ) : null}
      <Text className="mt-3 text-base font-extrabold text-ink">
        {item.title || 'Uploaded image'}
      </Text>
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-muted">
          {formatTimestamp(item.feedDate)}
        </Text>
        <TouchableOpacity
          className="h-9 w-9 items-center justify-center rounded-xl bg-red-50"
          onPress={onDelete}
        >
          <Text className="text-lg text-red-500">×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen({
  user,
  tasks,
  items,
  loading,
  refreshing,
  searchText,
  onSearch,
  filter,
  onFilter,
  onRefresh,
  onTask,
  onDeleteMedia,
}) {
  const stats = [
    [tasks.length, 'Total'],
    [tasks.filter(t => !t.completed).length, 'Open'],
    [tasks.filter(t => t.completed).length, 'Done'],
  ];
  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-5 pb-3 pt-5">
        <View>
          <Text className="text-base font-semibold text-muted">
            Good morning
          </Text>
          <Text className="mt-1 text-4xl font-extrabold tracking-tight text-ink">
            My Tasks
          </Text>
        </View>
        <View className="h-14 w-14 items-center justify-center rounded-3xl bg-brand">
          <Text className="text-lg font-extrabold text-white">
            {(user?.name || user?.phoneNumber || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      <View className="mb-4 flex-row px-4">
        {stats.map(([value, label], index) => (
          <View
            key={label}
            className={`mx-1 flex-1 rounded-3xl p-4 ${statThemes[index][0]}`}
          >
            <Text className={`text-2xl font-extrabold ${statThemes[index][1]}`}>
              {value}
            </Text>
            <Text className={`mt-1 text-sm font-bold ${statThemes[index][1]}`}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View className="mx-4 mb-3 h-14 flex-row items-center rounded-2xl border border-line bg-canvas px-4">
        <Text className="mr-2 text-2xl text-muted">⌕</Text>
        <TextInput
          className="flex-1 text-base text-ink"
          value={searchText}
          onChangeText={onSearch}
          placeholder="Search tasks..."
          placeholderTextColor="#817C94"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-14 flex-grow-0"
        contentContainerClassName="px-4 pb-2"
      >
        {filters.map(value => (
          <TouchableOpacity
            key={value}
            className={`mr-2 rounded-full border px-5 py-2.5 ${
              filter === value
                ? 'border-brand bg-brand'
                : 'border-line bg-canvas'
            }`}
            onPress={() => onFilter(value)}
          >
            <Text
              className={`text-xs font-extrabold ${
                filter === value ? 'text-white' : 'text-muted'
              }`}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View className="flex-1 px-4">
        {loading ? (
          <ActivityIndicator size="large" color={P} className="mt-12" />
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => item._id}
            renderItem={({ item }) =>
              item.feedType === 'media' ? (
                <MediaCard item={item} onDelete={() => onDeleteMedia(item)} />
              ) : (
                <TaskCard item={item} onPress={() => onTask(item)} />
              )
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerClassName={items.length ? 'pb-28' : 'flex-grow'}
            ListEmptyComponent={EmptyFeed}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const P = '#1d1d1fff';
