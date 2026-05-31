import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirnameRoot = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_UPLOAD_ROOT = path.join(__dirnameRoot, '..', 'uploads');
export const OWN_DESIGN_UPLOAD_DIR = 'customize-own-design';
export const OWN_DESIGN_URL_PREFIX = `/uploads/${OWN_DESIGN_UPLOAD_DIR}/`;

/**
 * @param {unknown} raw
 * @returns {string|null}
 */
export function normalizeOwnDesignImageUrl(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (!s.startsWith(OWN_DESIGN_URL_PREFIX)) return null;
  if (s.includes('..') || s.includes('\\')) return null;
  const rel = s.slice(OWN_DESIGN_URL_PREFIX.length);
  if (!rel || rel.includes('/')) return null;
  return s;
}

export function ownDesignImageExists(uploadRoot, webPath) {
  const normalized = normalizeOwnDesignImageUrl(webPath);
  if (!normalized) return false;
  const rel = normalized.slice('/uploads/'.length);
  const abs = path.join(uploadRoot, rel);
  return fs.existsSync(abs);
}

export function ownDesignUploadRoot(uploadRoot = SERVER_UPLOAD_ROOT) {
  return path.join(uploadRoot, OWN_DESIGN_UPLOAD_DIR);
}

/**
 * @param {unknown} raw
 * @param {string} [uploadRoot]
 * @returns {{ ok: true, url: string|null } | { ok: false, error: string }}
 */
export function resolveOwnDesignImageUrl(raw, uploadRoot = SERVER_UPLOAD_ROOT) {
  const trimmed = raw == null ? '' : String(raw).trim();
  if (!trimmed) return { ok: true, url: null };
  const url = normalizeOwnDesignImageUrl(trimmed);
  if (!url) {
    return { ok: false, error: 'Invalid reference image URL' };
  }
  if (!ownDesignImageExists(uploadRoot, url)) {
    return { ok: false, error: 'Reference image was not found. Please upload your design again.' };
  }
  return { ok: true, url };
}
