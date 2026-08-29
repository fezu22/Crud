import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getTasks, createTask, updateTask, deleteTask } from './api';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch tasks');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTasks().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleSaveTask = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }

    try {
      if (editingId) {
        const updated = await updateTask(editingId, { title, description });
        setTasks((prev) =>
          prev.map((t) => (t._id === editingId ? updated : t))
        );
        setEditingId(null);
      } else {
        const newTask = await createTask({ title, description });
        setTasks((prev) => [newTask, ...prev]);
      }
      setTitle('');
      setDescription('');
    } catch (error) {
      Alert.alert('Error', 'Could not save task');
    }
  };

  const handleEdit = (task) => {
    setEditingId(task._id);
    setTitle(task.title);
    setDescription(task.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
  };

  const handleToggleComplete = async (task) => {
    try {
      const updated = await updateTask(task._id, {
        completed: !task.completed,
      });
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
    } catch (error) {
      Alert.alert('Error', 'Could not update task status');
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(id);
            setTasks((prev) => prev.filter((t) => t._id !== id));
          } catch (error) {
            Alert.alert('Error', 'Could not delete task');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity
        style={styles.taskContent}
        onPress={() => handleToggleComplete(item)}
      >
        <Text
          style={[styles.taskTitle, item.completed && styles.completedText]}
        >
          {item.title}
        </Text>
        {item.description ? (
          <Text
            style={[styles.taskDesc, item.completed && styles.completedText]}
          >
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>
      <View style={styles.taskActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item._id)}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Manager</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Task Title"
          placeholderTextColor="#9ca3af"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
        <View style={styles.formActions}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSaveTask}>
            <Text style={styles.submitBtnText}>
              {editingId ? 'Update Task' : 'Add Task'}
            </Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={
              tasks.length === 0 ? styles.emptyList : styles.listContent
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No tasks found. Add one above!</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#1e293b',
    marginBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 15,
    color: '#f8fafc',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 5,
  },
  cancelBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 50,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#1e293b',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskContent: {
    flex: 1,
    marginRight: 10,
  },
  taskTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  taskDesc: {
    color: '#94a3b8',
    fontSize: 14,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  taskActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 5,
  },
  editBtnText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
});

export default App;
