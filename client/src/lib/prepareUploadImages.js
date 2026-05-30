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
  const type = String(file.type || '').toLowerCase();
  if (HEIC_MIME.test(type)) return true;
  // macOS/iPhone picker often leaves type empty for HEIC.
  if (!type || type === 'application/octet-stream') {
    return HEIC_EXT.test(name);
  }
  return false;
}

async function sniffHeicFile(file) {
  if (isHeicFile(file)) return true;
  const type = String(file.type || '').toLowerCase();
  if (type && type !== 'application/octet-stream' && !type.startsWith('image/')) {
    return false;
  }
  try {
    const slice = file.slice(0, 32);
    const buf = await slice.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length < 12) return false;
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (ftyp !== 'ftyp') return false;
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    return ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'heif', 'mif1', 'msf1'].includes(
      brand
    );
  } catch {
    return false;
  }
}

/**
 * Optionally converts HEIC to PNG in the browser. On failure, returns the original file
 * so the server can convert (see server/lib/imageUpload.js).
 */
export async function prepareUploadImageFile(file) {
  const heic = await sniffHeicFile(file);
  if (!heic) return file;

  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/png',
    });

    const pngBlob = Array.isArray(result) ? result[0] : result;
    if (!pngBlob || !(pngBlob.size > 0)) {
      throw new Error('Empty PNG result from HEIC conversion');
    }

    const baseName = String(file.name || 'photo')
      .replace(/\.(heic|heif)$/i, '')
      .replace(/\.$/, '');
    const pngName = `${baseName || 'photo'}.png`;

    return new File([pngBlob], pngName, { type: 'image/png', lastModified: file.lastModified });
  } catch (err) {
    console.warn('[prepareUploadImageFile] browser HEIC convert failed; server will convert', err);
    return file;
  }
}

export async function prepareUploadImageFiles(files) {
  const list = Array.from(files || []);
  return Promise.all(list.map((f) => prepareUploadImageFile(f)));
}
