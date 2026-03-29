const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function authHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data as { token: string; user: { id: string; email: string; username: string } };
}

export async function signup(email: string, password: string, username: string) {
  const res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Signup failed');
  return data as { token: string; user: { id: string; email: string; username: string } };
}

export async function logout(token: string) {
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: authHeaders(token),
  }).catch(() => {});
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function getPosts() {
  const res = await fetch(`${BASE_URL}/api/posts`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function createPost(token: string, body: {
  name?: string;
  description?: string;
  address?: string;
  lat: number;
  lng: number;
  images?: string[];
}) {
  const res = await fetch(`${BASE_URL}/api/posts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to create post');
  return res.json();
}

export async function deletePost(token: string, postId: string) {
  const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to delete post');
  return res.json();
}

export async function likePost(token: string, postId: string) {
  const res = await fetch(`${BASE_URL}/api/posts/${postId}/like`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to like post');
  return res.json();
}

export async function addComment(token: string, postId: string, text: string) {
  const res = await fetch(`${BASE_URL}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to add comment');
  return res.json();
}

export async function viewPost(postId: string) {
  await fetch(`${BASE_URL}/api/posts/${postId}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const res = await fetch(`${BASE_URL}/api/profile/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json() as Promise<{ display_name?: string; bio?: string; avatar_url?: string }>;
}

export async function updateProfilePhoto(token: string, base64: string, ext: string) {
  const res = await fetch(`${BASE_URL}/api/profile/photo`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ base64, ext }),
  });
  if (!res.ok) throw new Error('Failed to upload photo');
  return res.json() as Promise<{ avatarUrl: string }>;
}

export async function updateBio(token: string, bio: string) {
  const res = await fetch(`${BASE_URL}/api/profile/bio`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ bio }),
  });
  if (!res.ok) throw new Error('Failed to update bio');
}

export async function updateDisplayName(token: string, displayName: string) {
  const res = await fetch(`${BASE_URL}/api/profile/name`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) throw new Error('Failed to update display name');
}
