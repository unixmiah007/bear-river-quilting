import { prepareUploadImageFile } from './prepareUploadImages.js';

/** Max files per “Upload to library” action on /admin/products. */
export const MEDIA_LIBRARY_UPLOAD_MAX = 100;

async function postMediaFile(file) {
  const fd = new FormData();
  fd.append('images', file);
  const res = await fetch('/api/admin/media', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'Upload failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

/**
 * Uploads up to {@link MEDIA_LIBRARY_UPLOAD_MAX} files sequentially with progress callbacks.
 * @param {FileList|File[]} files
 * @param {(progress: {
 *   phase: 'prepare' | 'upload',
 *   current: number,
 *   total: number,
 *   fileName: string,
 *   uploaded: number,
 *   failed: number,
 * }) => void} [onProgress]
 */
export async function uploadMediaLibraryWithProgress(files, onProgress) {
  const list = Array.from(files || []);
  if (list.length === 0) {
    return { ok: true, items: [], errors: [] };
  }
  if (list.length > MEDIA_LIBRARY_UPLOAD_MAX) {
    const err = new Error(
      `You can upload up to ${MEDIA_LIBRARY_UPLOAD_MAX} files at a time (selected ${list.length}).`
    );
    err.code = 'TOO_MANY_FILES';
    throw err;
  }

  const items = [];
  const errors = [];
  const total = list.length;

  for (let i = 0; i < list.length; i += 1) {
    const file = list[i];
    const current = i + 1;

    onProgress?.({
      phase: 'prepare',
      current,
      total,
      fileName: file.name,
      uploaded: items.length,
      failed: errors.length,
    });

    let prepared = file;
    try {
      prepared = await prepareUploadImageFile(file);
    } catch (err) {
      errors.push({
        fileName: file.name,
        error: err?.message || 'Could not prepare image',
      });
      continue;
    }

    onProgress?.({
      phase: 'upload',
      current,
      total,
      fileName: prepared.name,
      uploaded: items.length,
      failed: errors.length,
    });

    try {
      const data = await postMediaFile(prepared);
      const uploaded = Array.isArray(data?.items) ? data.items : [];
      if (uploaded[0]) {
        items.push(uploaded[0]);
      }
    } catch (err) {
      const detail = [err.body?.error, err.body?.detail].filter(Boolean).join(' — ');
      errors.push({
        fileName: file.name,
        error: detail || err.message || 'Upload failed',
      });
    }
  }

  return { ok: true, items, errors };
}
