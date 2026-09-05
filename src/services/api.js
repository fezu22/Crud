import { API_BASE_URL } from '../config/apiConfig';
import { encryptFile } from './privateCrypto';
import RNFS from 'react-native-fs';

// ================= NETWORK =================

export async function apiFetch(url, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const attempts = method === 'GET' ? 2 : 1;
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (options.signal?.aborted || error?.name === 'AbortError') {
        throw error;
      }

      lastError = error;

      // Retry reads only. Never automatically repeat a write request.
      if (attempt + 1 < attempts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }

  const isProduction = API_BASE_URL.startsWith('https://');

  const message = isProduction
    ? 'Cannot connect to the server. Check your internet connection and try again shortly.'
    : 'Cannot connect to the local backend. Start the backend and run adb reverse tcp:5000 tcp:5000.';

  const networkError = new Error(message);
  networkError.name = 'NetworkError';
  networkError.cause = lastError;
  throw networkError;
}

const getHeaders = token => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

async function readResponse(response, fallbackMessage) {
  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    const error = new Error(
      `Server returned an invalid response (${response.status}). Please try again shortly.`,
    );
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || fallbackMessage || 'Request failed',
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

async function request(
  path,
  {
    method = 'GET',
    token,
    body,
    headers: extraHeaders,
    fallbackMessage,
  } = {},
) {
  const response = await apiFetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...getHeaders(token),
      ...(extraHeaders || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return readResponse(response, fallbackMessage);
}

// ================= AUTH API =================

export async function registerUser(
  name,
  emailOrPhone,
  password,
  extraPhone,
) {
  const isEmail =
    typeof emailOrPhone === 'string' &&
    emailOrPhone.includes('@');

  return request('/auth/register', {
    method: 'POST',
    body: {
      name,
      password,
      email: isEmail ? emailOrPhone : undefined,
      phone: !isEmail
        ? emailOrPhone || extraPhone
        : extraPhone,
    },
    fallbackMessage: 'Registration failed',
  });
}

export async function loginUser(identifier, password) {
  return request('/auth/login', {
    method: 'POST',
    body: {
      identifier,
      email: identifier,
      phone: identifier,
      password,
    },
    fallbackMessage: 'Login failed',
  });
}

export async function loginWithTruecaller(truecallerPayload) {
  return request('/auth/truecaller-login', {
    method: 'POST',
    body: truecallerPayload,
    fallbackMessage: 'Truecaller authentication failed',
  });
}

export async function getCurrentUser(token) {
  return request('/auth/me', {
    token,
    fallbackMessage: 'Failed to fetch user profile',
  });
}

// ================= CLOUDINARY CONNECTION =================

export async function saveCloudinaryConnection(
  cloudName,
  uploadPreset,
  token,
) {
  if (!cloudName?.trim() || !uploadPreset?.trim()) {
    throw new Error(
      'Cloudinary Cloud Name and unsigned Upload Preset are required.',
    );
  }

  return request('/auth/cloudinary-connection', {
    method: 'PUT',
    token,
    body: {
      cloudName: cloudName.trim(),
      uploadPreset: uploadPreset.trim(),
    },
    fallbackMessage: 'Could not save Cloudinary connection',
  });
}

export async function removeCloudinaryConnection(token) {
  return request('/auth/cloudinary-connection', {
    method: 'DELETE',
    token,
    fallbackMessage: 'Could not disconnect Cloudinary',
  });
}

// ================= TASK API =================

export async function getTasks(token) {
  return request('/tasks', {
    token,
    fallbackMessage: 'Failed to fetch tasks',
  });
}

export async function createTask(taskData, token) {
  return request('/tasks', {
    method: 'POST',
    token,
    body: taskData,
    fallbackMessage: 'Failed to create task',
  });
}

export async function updateTask(id, taskData, token) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    token,
    body: taskData,
    fallbackMessage: 'Failed to update task',
  });
}

export async function deleteTask(id, token) {
  return request(`/tasks/${id}`, {
    method: 'DELETE',
    token,
    fallbackMessage: 'Failed to delete task',
  });
}

// ================= PROJECT API =================

export async function getProjects(token) {
  return request('/projects', { token });
}

export async function createProject(projectData, token) {
  return request('/projects', {
    method: 'POST',
    token,
    body: projectData,
  });
}

export async function updateProject(id, projectData, token) {
  return request(`/projects/${id}`, {
    method: 'PUT',
    token,
    body: projectData,
  });
}

export async function deleteProject(id, token) {
  return request(`/projects/${id}`, {
    method: 'DELETE',
    token,
  });
}

// ================= CHAT API =================

export async function getChatUsers(token, query = '') {
  return request(
    `/chat/users?q=${encodeURIComponent(query)}`,
    { token },
  );
}

export async function getAdminChat(token) {
  return request('/chat/admin', { token });
}

export async function getConversations(token) {
  return request('/chat/conversations', { token });
}

export async function getAllUsers(token, query = '') {
  return request(
    `/chat/all-users?q=${encodeURIComponent(query)}`,
    { token },
  );
}

export async function pingActive(token) {
  return request('/auth/ping', { token });
}

export async function getChatMessages(userId, token) {
  return request(`/chat/${userId}`, { token });
}

export async function sendChatMessage(userId, text, token) {
  return request(`/chat/${userId}`, {
    method: 'POST',
    token,
    body: { text },
  });
}

// ================= CLOUDINARY MEDIA API =================

async function uploadToPersonalCloudinary(
  file,
  title,
  kind,
  batchId,
  token,
  isPrivate = false,
  cloudStorage,
) {
  if (
    !cloudStorage?.cloudName?.trim() ||
    !cloudStorage?.uploadPreset?.trim()
  ) {
    throw new Error(
      'Add your Cloudinary Cloud Name and unsigned Upload Preset before uploading.',
    );
  }

  const resourceType = isPrivate
    ? 'raw'
    : file.type?.startsWith('image/')
      ? 'image'
      : 'video';

  let uploadFile = file;
  let encryption;

  if (isPrivate) {
    const encrypted = await encryptFile(file);

    uploadFile = {
      uri: encrypted.path,
      type: 'application/octet-stream',
      fileName: `blob_${Date.now()}.bin`,
    };

    encryption = {
      algorithm: 'AES-256-GCM',
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      encryptedMimeType: encrypted.encryptedMimeType,
    };
  }

  const body = new FormData();

  body.append('file', {
    uri: uploadFile.uri,
    type: uploadFile.type || 'application/octet-stream',
    name: uploadFile.fileName || `blob_${Date.now()}.bin`,
  });

  body.append(
    'upload_preset',
    cloudStorage.uploadPreset.trim(),
  );

  const uploadCloudName = cloudStorage.cloudName.trim();

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${uploadCloudName}/${resourceType}/upload`,
    {
      method: 'POST',
      body,
    },
  );

  const uploaded = await response.json();

  if (!response.ok || !uploaded.public_id) {
    throw new Error(
      uploaded.error?.message || 'Cloudinary upload failed',
    );
  }

  if (isPrivate) {
    await RNFS.unlink(uploadFile.uri).catch(() => {});
  }

  return registerMedia(
    {
      ...uploaded,
      cloudName: uploadCloudName,
      title,
      kind,
      batchId,
      isPrivate,
      encryption,
    },
    token,
  );
}

async function registerMedia(metadata, token) {
  return request('/media/register', {
    method: 'POST',
    token,
    body: metadata,
  });
}

export async function uploadMedia(
  file,
  title,
  token,
  kind = 'upload',
  batchId = null,
  isPrivate = false,
  cloudStorage,
) {
  return uploadToPersonalCloudinary(
    file,
    title,
    kind,
    batchId,
    token,
    isPrivate,
    cloudStorage,
  );
}

export async function uploadLibraryMedia(
  file,
  title,
  token,
  isPrivate = false,
  cloudStorage,
) {
  return uploadToPersonalCloudinary(
    file,
    title,
    'library',
    null,
    token,
    isPrivate,
    cloudStorage,
  );
}

export async function getMyMedia(token, cloudName) {
  const query = cloudName
    ? `?cloudName=${encodeURIComponent(cloudName)}`
    : '';

  return request(`/media/my-uploads${query}`, {
    token,
    fallbackMessage: 'Failed to fetch user uploads',
  });
}

export async function getPrivateMedia(token) {
  return request('/media/private', { token });
}

export async function deleteMedia(id, token) {
  return request(`/media/${id}`, {
    method: 'DELETE',
    token,
    fallbackMessage: 'Failed to delete media',
  });
}

export async function deleteMediaByUrl(imageUrl, token) {
  return request('/media/by-url', {
    method: 'DELETE',
    token,
    body: { imageUrl },
    fallbackMessage: 'Failed to delete image from Cloudinary',
  });
}

export async function updateMedia(
  id,
  { title, image },
  token,
) {
  const formData = new FormData();

  formData.append('title', title || '');

  if (image) {
    formData.append('image', {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.fileName || `replacement_${Date.now()}.jpg`,
    });
  }

  const response = await apiFetch(
    `${API_BASE_URL}/media/${id}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  return readResponse(response, 'Failed to update media');
}