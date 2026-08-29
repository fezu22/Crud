const BASE_URL = 'http://192.168.1.7:5000/api/tasks';

// Custom fetch with timeout so it doesn't load forever
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const getTasks = async () => {
  try {
    const response = await fetchWithTimeout(BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return await response.json();
  } catch (error) {
    console.error('getTasks Error:', error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await fetchWithTimeout(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return await response.json();
  } catch (error) {
    console.error('createTask Error:', error);
    throw error;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return await response.json();
  } catch (error) {
    console.error('updateTask Error:', error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return await response.json();
  } catch (error) {
    console.error('deleteTask Error:', error);
    throw error;
  }
};
