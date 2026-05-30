import fs from 'node:fs';
import path from 'node:path';
import convert from 'heic-convert';

const HEIC_EXT = new Set(['.heic', '.heif']);
const HEIC_MIME = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);
const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** Max bytes for a single gallery upload (HEIC originals can be large). */
export const IMAGE_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export function isHeicUpload(file) {
  const ext = path.extname(file?.originalname || file?.filename || '').toLowerCase();
  if (HEIC_EXT.has(ext)) return true;
  const mime = String(file?.mimetype || '').toLowerCase();
  return HEIC_MIME.has(mime);
}

export function isAllowedImageUpload(file) {
  if (!file) return false;
  const mime = String(file.mimetype || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  if (mime === 'application/octet-stream' || !mime) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    return RASTER_EXT.has(ext) || HEIC_EXT.has(ext);
  }
  const ext = path.extname(file.originalname || '').toLowerCase();
  return RASTER_EXT.has(ext) || HEIC_EXT.has(ext);
}

export function imageUploadFilename(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (HEIC_EXT.has(ext) || isHeicUpload(file)) {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.heic`;
  }
  if (RASTER_EXT.has(ext)) {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
}

export function imageUploadFileFilter(_req, file, cb) {
  if (!isAllowedImageUpload(file)) {
    cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF, HEIC)'));
    return;
  }
  cb(null, true);
}

/**
 * Converts iPhone HEIC/HEIF on disk to high-quality PNG and updates the multer file record.
 */
export async function normalizeUploadedImageFile(file) {
  if (!file?.path || !fs.existsSync(file.path)) return file;
  if (!isHeicUpload(file)) return file;

  const inputBuffer = fs.readFileSync(file.path);
  const pngBuffer = await convert({
    buffer: inputBuffer,
    format: 'PNG',
    quality: 1,
  });

  const dir = path.dirname(file.path);
  const base = path.basename(file.path, path.extname(file.path));
  const pngName = `${base}.png`;
  const pngPath = path.join(dir, pngName);

  fs.writeFileSync(pngPath, Buffer.from(pngBuffer));
  try {
    fs.unlinkSync(file.path);
  } catch {
    /* ignore */
  }

  file.path = pngPath;
  file.filename = pngName;
  file.mimetype = 'image/png';
  file.size = fs.statSync(pngPath).size;
  return file;
}

export async function normalizeUploadedImageFiles(files) {
  if (!Array.isArray(files) || files.length === 0) return [];
  const out = [];
  for (const file of files) {
    try {
      out.push(await normalizeUploadedImageFile(file));
    } catch (err) {
      try {
        if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch {
        /* ignore */
      }
      const message = err?.message || 'HEIC conversion failed';
      const convErr = new Error(`Could not convert HEIC to PNG: ${message}`);
      convErr.cause = err;
      throw convErr;
    }
  }
  return out;
}
