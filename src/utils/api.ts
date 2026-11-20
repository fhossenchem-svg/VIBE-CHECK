import { handleStaticApiFallback, readFileAsStaticMedia } from './staticFallback';

const TOKEN_KEY = 'vibecheck_token';
const DEVICE_KEY = 'vibecheck_device_id';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage restriction
  }
}

export function getDeviceId(): string {
  try {
    let existing = localStorage.getItem(DEVICE_KEY);
    if (!existing) {
      existing = 'dev_' + Math.random().toString(36).slice(2, 12);
      localStorage.setItem(DEVICE_KEY, existing);
    }
    return existing;
  } catch {
    return 'dev_session';
  }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('x-vibe-device', getDeviceId());

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    if (url.startsWith('/api/') && typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
      return handleStaticApiFallback<T>(url, options);
    }
    throw err;
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (url.startsWith('/api/') && !contentType.includes('application/json')) {
    return handleStaticApiFallback<T>(url, options);
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errMessage =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new Error(errMessage);
  }

  return data as T;
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

export function normalizeMediaMime(rawType: string): string {
  return rawType.split(';')[0].trim().toLowerCase();
}

export function validateMediaFile(file: File): {
  mime: string;
  mediaType: 'image' | 'video';
} {
  const mime = normalizeMediaMime(file.type || '');
  const isImage = ALLOWED_IMAGE_TYPES.has(mime);
  const isVideo = ALLOWED_VIDEO_TYPES.has(mime);

  if (!isImage && !isVideo) {
    throw new Error('Please upload a PNG, JPG, WEBP, GIF photo or MP4, WEBM, MOV video.');
  }
  if (isImage && file.size > 10 * 1024 * 1024) {
    throw new Error('Photos must be 10MB or smaller.');
  }
  if (isVideo && file.size > 25 * 1024 * 1024) {
    throw new Error('Videos must be 25MB or smaller.');
  }
  return { mime, mediaType: isImage ? 'image' : 'video' };
}

export function uploadMediaWithProgress(
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<{ url: string; mediaType: 'image' | 'video' }> {
  const { mime } = validateMediaFile(file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/media/upload');
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', mime);
    xhr.setRequestHeader('x-vibe-device', getDeviceId());
    const token = getAuthToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (signal) {
      if (signal.aborted) {
        reject(new Error('Upload cancelled.'));
        return;
      }
      signal.addEventListener(
        'abort',
        () => {
          xhr.abort();
          reject(new Error('Upload cancelled.'));
        },
        { once: true }
      );
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      const contentType = (xhr.getResponseHeader('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        readFileAsStaticMedia(file, onProgress).then(resolve).catch(reject);
        return;
      }
      let data: { url?: string; mediaType?: 'image' | 'video'; error?: string } | null = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.url && data?.mediaType) {
        onProgress?.(100);
        resolve({ url: data.url, mediaType: data.mediaType });
      } else {
        reject(new Error(data?.error || `Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      if (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
        readFileAsStaticMedia(file, onProgress).then(resolve).catch(reject);
        return;
      }
      reject(new Error('Network error while uploading media.'));
    };

    xhr.send(file);
  });
}

export async function uploadMediaFile(
  file: File
): Promise<{ url: string; mediaType: 'image' | 'video' }> {
  return uploadMediaWithProgress(file);
}

