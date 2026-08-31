import { API_BASE_URL } from '../config/apiConfig';

const getHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: getHeaders(token),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ================= AUTH API =================

export async function registerUser(name, emailOrPhone, password, extraPhone) {
  const url = `${API_BASE_URL}/auth/register`;
  const isEmail = typeof emailOrPhone === 'string' && emailOrPhone.includes('@');

  const payload = {
    name,
    password,
    email: isEmail ? emailOrPhone : undefined,
    phone: !isEmail ? (emailOrPhone || extraPhone) : extraPhone,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }
  return data;
}

export async function loginUser(identifier, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ identifier, email: identifier, phone: identifier, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

export async function loginWithTruecaller(truecallerPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/truecaller-login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(truecallerPayload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Truecaller authentication failed');
  }
  return data;
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: getHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch tasks');
  }
  return data;
}

export async function createTask(taskData, token) {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
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
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete task');
  }
  return data;
}

// ================= PROJECT API =================

export async function getProjects(token) {
  return request('/projects', { token });
}

export async function createProject(projectData, token) {
  return request('/projects', { method: 'POST', token, body: projectData });
}

export async function updateProject(id, projectData, token) {
  return request(`/projects/${id}`, { method: 'PUT', token, body: projectData });
}

export async function deleteProject(id, token) {
  return request(`/projects/${id}`, { method: 'DELETE', token });
}

// ================= CLOUDINARY MEDIA API =================

export async function uploadMedia(file, title, token, kind = 'upload', batchId = null) {
  const formData = new FormData();
  formData.append('image', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.fileName || `upload_${Date.now()}.jpg`,
  });

  if (title) {
    formData.append('title', title);
  }
  formData.append('kind', kind);
  if (batchId) {
    formData.append('batchId', batchId);
  }

  const response = await fetch(`${API_BASE_URL}/media/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // In React Native fetch, leaving out Content-Type sets the multipart boundary automatically
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Media upload to Cloudinary failed');
  }
  return data;
}

export async function getMyMedia(token) {
  const response = await fetch(`${API_BASE_URL}/media/my-uploads`, {
    headers: getHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user uploads');
  }
  return data;
}

export async function deleteMedia(id, token) {
  const response = await fetch(`${API_BASE_URL}/media/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete media');
  }
  return data;
}

export async function updateMedia(id, { title, image }, token) {
  const formData = new FormData();
  formData.append('title', title || '');
  if (image) {
    formData.append('image', {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.fileName || `replacement_${Date.now()}.jpg`,
    });
  }
  const response = await fetch(`${API_BASE_URL}/media/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to update media');
  return data;
}