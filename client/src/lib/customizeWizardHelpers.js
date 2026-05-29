export function interpolate(template, vars = {}) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : ''
  );
}

export function getWizardStep(config, n) {
  return config?.steps?.find((s) => s.n === n) ?? null;
}

export function isWizardStepEnabled(config, n) {
  const step = getWizardStep(config, n);
  return step ? step.enabled !== false : false;
}

export function getEnabledWizardSteps(config) {
  return [...(config?.steps ?? [])]
    .filter((s) => s.enabled !== false)
    .sort((a, b) => a.n - b.n);
}

export function nextWizardStep(config, current) {
  for (let n = current + 1; n <= 5; n++) {
    if (isWizardStepEnabled(config, n)) return n;
  }
  return current;
}

export function prevWizardStep(config, current) {
  for (let n = current - 1; n >= 1; n--) {
    if (isWizardStepEnabled(config, n)) return n;
  }
  return current;
}

export function labelForSizeOption(config, value) {
  const o = config?.sizeOptions?.find((opt) => opt.value === value);
  if (!o) return value;
  const name = o.code ? `${o.label} ${o.code}` : o.label;
  return o.hint ? `${name} — ${o.hint}` : name;
}

export function labelForColorOption(config, value) {
  const o = config?.colorOptions?.find((opt) => opt.value === value);
  if (!o) return value;
  return o.hint ? `${o.label} (${o.hint})` : o.label;
}

export function labelForBattingOption(config, value) {
  const o = config?.battingOptions?.find((opt) => opt.value === value);
  if (!o) return value;
  return o.hint ? `${o.label} (${o.hint})` : o.label;
}

export function activeSizeOptions(config) {
  return (config?.sizeOptions ?? []).filter((o) => o.enabled !== false);
}

export function activeColorOptions(config) {
  return (config?.colorOptions ?? []).filter(
    (o) => o.enabled !== false && Array.isArray(o.colors) && o.colors.length > 0
  );
}

export function activeBattingOptions(config) {
  return (config?.battingOptions ?? []).filter((o) => o.enabled !== false);
}
