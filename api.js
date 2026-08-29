const API_BASE = 'http://192.168.1.4:5000/api'; // Use PC's local IP for physical device / emulator

const getHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ================= AUTH API =================

export async function registerUser(name, email, password) {
  const url = `${API_BASE}/auth/register`;
  console.log('REGISTER REQUEST URL:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password }),
  });

  const rawText = await response.text();
  console.log('REGISTER RAW RESPONSE STATUS:', response.status);
  console.log('REGISTER RAW RESPONSE BODY:', rawText);

  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error('Server returned non-JSON: ' + rawText.substring(0, 200));
  }

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user profile');
  }
  return data;
}

// ================= TASK API =================

export async function getTasks(token) {
  const response = await fetch(`${API_BASE}/tasks`, {
    headers: getHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tasks');
  }
  return data;
}

export async function createTask(taskData, token) {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(taskData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create task');
  }
  return data;
}

export async function updateTask(id, taskData, token) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(taskData),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update task');
  }
  return data;
}

export async function deleteTask(id, token) {
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete task');
  }
  return data;
}
