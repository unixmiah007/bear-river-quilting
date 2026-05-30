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
const HEIC_FTYP_BRANDS = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
  'heif',
  'mif1',
  'msf1',
]);
const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

/** Max bytes for a single gallery upload (HEIC originals can be large). */
export const IMAGE_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export function bufferLooksLikeHeic(buffer) {
  if (!buffer || buffer.length < 12) return false;
  if (buffer.toString('ascii', 4, 8) !== 'ftyp') return false;
  const brand = buffer.toString('ascii', 8, 12).toLowerCase();
  return HEIC_FTYP_BRANDS.has(brand);
}

export function bufferLooksLikeJpeg(buffer) {
  return buffer && buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

export function bufferLooksLikePng(buffer) {
  return (
    buffer &&
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer.toString('ascii', 1, 4) === 'PNG'
  );
}

export function readFileHead(filePath, length = 32) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.alloc(length);
    const bytes = fs.readSync(fd, buf, 0, length, 0);
    return buf.subarray(0, bytes);
  } finally {
    fs.closeSync(fd);
  }
}

export function isHeicUpload(file, fileHead = null) {
  const ext = path.extname(file?.originalname || file?.filename || '').toLowerCase();
  if (HEIC_EXT.has(ext)) return true;
  const mime = String(file?.mimetype || '').toLowerCase();
  if (HEIC_MIME.has(mime)) return true;
  if (fileHead && bufferLooksLikeHeic(fileHead)) return true;
  if (file?.path && fs.existsSync(file.path)) {
    try {
      return bufferLooksLikeHeic(readFileHead(file.path));
    } catch {
      return false;
    }
  }
  return false;
}

export function isAllowedImageUpload(file) {
  if (!file) return false;
  const mime = String(file.mimetype || '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (RASTER_EXT.has(ext) || HEIC_EXT.has(ext)) return true;
  // iPhone/macOS often send HEIC as application/octet-stream or with an empty type.
  if (mime === 'application/octet-stream' || mime === '') return true;
  return false;
}

export function imageUploadFilename(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = String(file?.mimetype || '').toLowerCase();
  if (HEIC_EXT.has(ext) || HEIC_MIME.has(mime)) {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.heic`;
  }
  if (RASTER_EXT.has(ext)) {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.upload`;
}

export function imageUploadFileFilter(_req, file, cb) {
  if (!isAllowedImageUpload(file)) {
    cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF, HEIC)'));
    return;
  }
  cb(null, true);
}

async function heicBufferToPng(inputBuffer) {
  const out = await convert({
    buffer: inputBuffer,
    format: 'PNG',
    quality: 1,
  });
  return Buffer.from(out);
}

/**
 * Converts iPhone HEIC/HEIF on disk to high-quality PNG and updates the multer file record.
 */
export async function normalizeUploadedImageFile(file) {
  if (!file?.path || !fs.existsSync(file.path)) return file;

  const head = readFileHead(file.path);
  const ext = path.extname(file.path).toLowerCase();
  const isHeic = isHeicUpload(file, head);
  const dir = path.dirname(file.path);

  if (!isHeic) {
    if (ext === '.heic' || ext === '.heif') {
      throw new Error('File has a HEIC extension but is not a valid HEIC image');
    }
    if (!RASTER_EXT.has(ext) && ext !== '.upload') {
      throw new Error('Unsupported image format. Use JPEG, PNG, WebP, GIF, or iPhone HEIC.');
    }
    if (ext === '.upload') {
      let outExt = '.jpg';
      if (bufferLooksLikePng(head)) outExt = '.png';
      else if (!bufferLooksLikeJpeg(head)) {
        throw new Error('Unsupported image format. Use JPEG, PNG, WebP, GIF, or iPhone HEIC.');
      }
      const renamed = `${path.basename(file.path, ext)}${outExt}`;
      const renamedPath = path.join(dir, renamed);
      fs.renameSync(file.path, renamedPath);
      file.path = renamedPath;
      file.filename = renamed;
      file.mimetype = outExt === '.png' ? 'image/png' : 'image/jpeg';
    }
    return file;
  }

  const inputBuffer = fs.readFileSync(file.path);
  const pngBuffer = await heicBufferToPng(inputBuffer);

  const base = path.basename(file.path, path.extname(file.path));
  const pngName = `${base}.png`;
  const pngPath = path.join(dir, pngName);

  fs.writeFileSync(pngPath, pngBuffer);
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
