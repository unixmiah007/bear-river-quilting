import pool from '../db.js';
import { getDefaultCustomizeWizardConfig } from './customizeWizardDefaults.js';

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch ?? base;
  const out = { ...base };
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    const bv = base[key];
    if (pv && typeof pv === 'object' && !Array.isArray(pv) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      out[key] = deepMerge(bv, pv);
    } else if (pv !== undefined) {
      out[key] = pv;
    }
  }
  return out;
}

function normalizeOptionList(list, { requireValue = true } = {}) {
  if (!Array.isArray(list)) return [];
  return list
    .map((row) => {
      const value = String(row?.value ?? '').trim();
      if (requireValue && !value) return null;
      const enabled = row?.enabled !== false;
      const label = String(row?.label ?? value).trim() || value;
      const hint = String(row?.hint ?? '').trim() || undefined;
      const code = row?.code != null && String(row.code).trim() !== '' ? String(row.code).trim() : undefined;
      const image = row?.image != null && String(row.image).trim() !== '' ? String(row.image).trim() : undefined;
      let colors;
      if (Array.isArray(row?.colors)) {
        colors = row.colors
          .map((c) => String(c).trim())
          .filter((c) => /^#[0-9A-Fa-f]{3,8}$/.test(c));
      }
      const swatchLayout = row?.swatchLayout === 'stripes' ? 'stripes' : undefined;
      const out = { value, label, enabled };
      if (hint) out.hint = hint;
      if (code) out.code = code;
      if (image) out.image = image;
      if (colors?.length) out.colors = colors;
      if (swatchLayout) out.swatchLayout = swatchLayout;
      return out;
    })
    .filter(Boolean);
}

export function normalizeCustomizeWizardConfig(raw) {
  const defaults = getDefaultCustomizeWizardConfig();
  const merged = deepMerge(defaults, raw && typeof raw === 'object' ? raw : {});

  merged.enabled = merged.enabled !== false;
  merged.pay = {
    pauseSeconds: Math.min(30, Math.max(0, Number(merged.pay?.pauseSeconds ?? 4) || 0)),
  };

  merged.steps = (Array.isArray(merged.steps) ? merged.steps : defaults.steps)
    .map((s, i) => {
      const def = defaults.steps.find((d) => d.n === s.n) ?? defaults.steps[i] ?? {};
      return deepMerge(def, s);
    })
    .filter((s) => s && typeof s.n === 'number');

  merged.sizeOptions = normalizeOptionList(merged.sizeOptions);
  merged.colorOptions = normalizeOptionList(merged.colorOptions);
  merged.battingOptions = normalizeOptionList(merged.battingOptions);

  if (merged.sizeOptions.length === 0) merged.sizeOptions = defaults.sizeOptions;
  if (merged.colorOptions.length === 0) merged.colorOptions = defaults.colorOptions;
  if (merged.battingOptions.length === 0) merged.battingOptions = defaults.battingOptions;

  return merged;
}

export function getEnabledSteps(config) {
  return [...config.steps]
    .filter((s) => s.enabled !== false)
    .sort((a, b) => a.n - b.n);
}

export function getActiveSizeOptions(config) {
  return config.sizeOptions.filter((o) => o.enabled !== false);
}

export function getActiveColorOptions(config) {
  return config.colorOptions.filter((o) => o.enabled !== false && Array.isArray(o.colors) && o.colors.length > 0);
}

export function getActiveBattingOptions(config) {
  return config.battingOptions.filter((o) => o.enabled !== false);
}

export function getAllowedColorPaletteValues(config) {
  return new Set(getActiveColorOptions(config).map((o) => o.value));
}

export function getAllowedBattingValues(config) {
  return new Set(getActiveBattingOptions(config).map((o) => o.value));
}

export async function loadCustomizeWizardConfig() {
  const [[row]] = await pool.query(
    'SELECT config_json FROM customize_wizard_config WHERE id = 1'
  );
  if (!row?.config_json) {
    const config = getDefaultCustomizeWizardConfig();
    await pool.query(
      'INSERT INTO customize_wizard_config (id, config_json) VALUES (1, ?) ON DUPLICATE KEY UPDATE config_json = config_json',
      [JSON.stringify(config)]
    );
    return normalizeCustomizeWizardConfig(config);
  }
  const parsed =
    typeof row.config_json === 'string' ? JSON.parse(row.config_json) : row.config_json;
  return normalizeCustomizeWizardConfig(parsed);
}

export async function saveCustomizeWizardConfig(body) {
  const config = normalizeCustomizeWizardConfig(body);
  await pool.query(
    `INSERT INTO customize_wizard_config (id, config_json) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE config_json = VALUES(config_json)`,
    [JSON.stringify(config)]
  );
  return config;
}

export function labelForSizeFromConfig(config, value) {
  const o = config.sizeOptions.find((opt) => opt.value === value);
  if (!o) return value;
  const name = o.code ? `${o.label} ${o.code}` : o.label;
  return o.hint ? `${name} — ${o.hint}` : name;
}

export function labelForColorFromConfig(config, value) {
  const o = config.colorOptions.find((opt) => opt.value === value);
  if (!o) return value;
  return o.hint ? `${o.label} (${o.hint})` : o.label;
}

export function labelForBattingFromConfig(config, value) {
  const o = config.battingOptions.find((opt) => opt.value === value);
  if (!o) return value;
  return o.hint ? `${o.label} (${o.hint})` : o.label;
}
