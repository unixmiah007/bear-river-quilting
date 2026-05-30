import heic2any from 'heic2any';

/** File input accept list — includes iPhone HEIC/HEIF. */
export const IMAGE_UPLOAD_ACCEPT =
  'image/*,.heic,.heif,image/heic,image/heif';

const HEIC_EXT = /\.(heic|heif)$/i;
const HEIC_MIME = /^image\/hei[cf]/i;

export function isHeicFile(file) {
  if (!file) return false;
  const name = String(file.name || '');
  if (HEIC_EXT.test(name)) return true;
  return HEIC_MIME.test(String(file.type || ''));
}

/**
 * Converts iPhone HEIC/HEIF to PNG in the browser before upload (server converts as fallback).
 */
export async function prepareUploadImageFile(file) {
  if (!isHeicFile(file)) return file;

  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 0.92,
    });

    const pngBlob = Array.isArray(result) ? result[0] : result;
    const baseName = String(file.name || 'photo')
      .replace(HEIC_EXT, '')
      .replace(/\.$/, '');
    const pngName = `${baseName || 'photo'}.png`;

    return new File([pngBlob], pngName, { type: 'image/png', lastModified: file.lastModified });
  } catch (err) {
    const detail = err?.message || String(err);
    throw new Error(`Could not convert ${file.name || 'HEIC image'} to PNG: ${detail}`);
  }
}

export async function prepareUploadImageFiles(files) {
  const list = Array.from(files || []);
  return Promise.all(list.map((f) => prepareUploadImageFile(f)));
}
