import React, { useState } from 'react';
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const palette = ['#6750E8', '#F08A74', '#47B8A5', '#E0A93A', '#7994E8'];
export default function ProjectsScreen({ projects, tasks, onOpen, onAdd }) {
  const [query, setQuery] = useState('');
  const shown = projects.filter(p =>
    p.name?.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row items-center justify-between px-6 pb-5 pt-6">
        <View>
          <Text className="text-[10px] font-extrabold tracking-[2px] text-brand">
            YOUR WORKSPACE
          </Text>
          <Text className="mt-1 text-4xl font-extrabold text-ink">
            Projects
          </Text>
        </View>
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-2xl bg-[#f0edfa]"
          onPress={onAdd}
        >
          <Text className="text-2xl text-ink">＋</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        className="mx-6 h-14 rounded-2xl border border-line bg-surface px-4 text-ink"
        value={query}
        onChangeText={setQuery}
        placeholder="Search projects"
        placeholderTextColor="#817C94"
      />
      <ScrollView contentContainerClassName="px-6 pb-28 pt-5">
        {shown.map((project, index) => {
          const projectTasks = tasks.filter(
              t => (t.projectId?._id || t.projectId) === project._id,
            ),
            done = projectTasks.filter(t => t.completed).length,
            color = project.color || palette[index % palette.length],
            progress = projectTasks.length
              ? (done / projectTasks.length) * 100
              : 0;
          return (
            <TouchableOpacity
              key={project._id}
              className="mb-5 overflow-hidden rounded-3xl border border-line bg-canvas"
              onPress={() => onOpen(project)}
            >
              <View
                className="h-28 items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <Text className="text-4xl text-white">✦</Text>
              </View>
              <View className="p-5">
                <View className="flex-row items-center justify-between">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Text className="text-xs text-muted">
                    {projectTasks.length} tasks
                  </Text>
                </View>
                <Text className="mt-3 text-xl font-extrabold text-ink">
                  {project.name}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-muted">
                  {project.description || 'Keep related plans together.'}
                </Text>
                <View className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#efedf4]">
                  <View
                    className="h-full rounded-full"
                    style={{ backgroundColor: color, width: `${progress}%` }}
                  />
                </View>
                <Text className="mt-2 text-xs text-muted">
                  {done} of {projectTasks.length} completed
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {!shown.length ? (
          <View className="items-center py-16">
            <Text className="text-3xl text-brand">✓</Text>
            <Text className="mt-4 text-xl font-extrabold text-ink">
              No projects yet
            </Text>
            <Text className="mt-2 text-sm text-muted">
              Create a project to organize tasks.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
