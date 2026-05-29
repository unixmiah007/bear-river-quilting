import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api.js';

function Field({ label, children, hint }) {
  return (
    <div className="field admin-customize-field">
      <label>{label}</label>
      {children}
      {hint ? <p className="muted admin-customize-field__hint">{hint}</p> : null}
    </div>
  );
}

function updateStep(config, n, patch) {
  return {
    ...config,
    steps: config.steps.map((s) => (s.n === n ? { ...s, ...patch } : s)),
  };
}

function updateOptionList(list, index, patch) {
  return list.map((row, i) => (i === index ? { ...row, ...patch } : row));
}

export default function AdminCustomizeWizardPanel() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.customizeConfig();
      setConfig(data);
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave(e) {
    e.preventDefault();
    if (!config) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const result = await adminApi.saveCustomizeConfig(config);
      setConfig(result.config);
      setInfo('Customize wizard saved. Changes appear on /customize immediately.');
    } catch (err) {
      setError(err.body?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  function patch(path, value) {
    setConfig((c) => {
      if (!c) return c;
      const next = { ...c };
      if (path === 'enabled') next.enabled = value;
      else if (path === 'page') next.page = { ...c.page, ...value };
      else if (path === 'pay') next.pay = { ...c.pay, ...value };
      else if (path === 'defaults') next.defaults = { ...c.defaults, ...value };
      else if (path === 'messages') next.messages = { ...c.messages, ...value };
      else if (path === 'sections') next.sections = { ...c.sections, ...value };
      return next;
    });
  }

  function patchSection(key, field, value) {
    setConfig((c) => ({
      ...c,
      sections: {
        ...c.sections,
        [key]: { ...c.sections[key], [field]: value },
      },
    }));
  }

  return (
    <section className="admin-customize-wizard card" aria-labelledby="admin-customize-wizard-heading">
      <header className="admin-customize-wizard__head">
        <div>
          <h2 id="admin-customize-wizard-heading" style={{ margin: 0 }}>
            Customize page (/customize)
          </h2>
          <p className="muted" style={{ margin: '0.35rem 0 0' }}>
            Edit wizard steps, copy, size/color/batting options, and pay-step behavior shown on the
            public customize flow.
          </p>
        </div>
        <div className="row">
          <Link className="btn" to="/customize" target="_blank" rel="noopener noreferrer">
            Preview
          </Link>
          <button
            type="button"
            className="btn"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </header>

      {open ? (
        <>
          {error ? <p className="error">{error}</p> : null}
          {info ? <p className="muted">{info}</p> : null}
          {loading ? (
            <p className="muted">Loading customize settings…</p>
          ) : !config ? (
            <p className="muted">Could not load settings.</p>
          ) : (
            <form className="form admin-customize-wizard__form" onSubmit={onSave}>
              <div className="admin-customize-wizard__grid">
                <fieldset className="admin-customize-wizard__block">
                  <legend>Page header</legend>
                  <Field label="Wizard enabled">
                    <label className="row" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={config.enabled !== false}
                        onChange={(e) => patch('enabled', e.target.checked)}
                      />
                      <span>Show /customize to shoppers</span>
                    </label>
                  </Field>
                  <Field label="Eyebrow">
                    <input
                      value={config.page?.eyebrow ?? ''}
                      onChange={(e) => patch('page', { eyebrow: e.target.value })}
                    />
                  </Field>
                  <Field label="Title">
                    <input
                      value={config.page?.title ?? ''}
                      onChange={(e) => patch('page', { title: e.target.value })}
                    />
                  </Field>
                  <Field label="Intro">
                    <textarea
                      rows={3}
                      value={config.page?.intro ?? ''}
                      onChange={(e) => patch('page', { intro: e.target.value })}
                    />
                  </Field>
                </fieldset>

                <fieldset className="admin-customize-wizard__block">
                  <legend>Pay step</legend>
                  <Field label="Review pause (seconds)" hint="Delay before Pay with Stripe unlocks.">
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={config.pay?.pauseSeconds ?? 4}
                      onChange={(e) =>
                        patch('pay', { pauseSeconds: Number(e.target.value) || 0 })
                      }
                    />
                  </Field>
                  <Field label="Stripe intro" hint="Use {amount} for formatted price.">
                    <textarea
                      rows={2}
                      value={config.steps?.find((s) => s.n === 5)?.stripeIntro ?? ''}
                      onChange={(e) =>
                        setConfig((c) => updateStep(c, 5, { stripeIntro: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="Fine print">
                    <textarea
                      rows={2}
                      value={config.steps?.find((s) => s.n === 5)?.finePrint ?? ''}
                      onChange={(e) =>
                        setConfig((c) => updateStep(c, 5, { finePrint: e.target.value }))
                      }
                    />
                  </Field>
                </fieldset>
              </div>

              <fieldset className="admin-customize-wizard__block">
                <legend>Wizard steps</legend>
                <div className="admin-customize-steps">
                  {config.steps?.map((step) => (
                    <article key={step.n} className="admin-customize-step-card">
                      <header className="admin-customize-step-card__head">
                        <strong>
                          Step {step.n}: {step.key}
                        </strong>
                        <label className="row" style={{ margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={step.enabled !== false}
                            onChange={(e) =>
                              setConfig((c) => updateStep(c, step.n, { enabled: e.target.checked }))
                            }
                          />
                          <span>Enabled</span>
                        </label>
                      </header>
                      <div className="admin-customize-step-card__fields">
                        <Field label="Progress label">
                          <input
                            value={step.label ?? ''}
                            onChange={(e) =>
                              setConfig((c) => updateStep(c, step.n, { label: e.target.value }))
                            }
                          />
                        </Field>
                        <Field label="Step title (H2)">
                          <input
                            value={step.title ?? ''}
                            onChange={(e) =>
                              setConfig((c) => updateStep(c, step.n, { title: e.target.value }))
                            }
                          />
                        </Field>
                        {(step.n === 1 || step.n === 2) && (
                          <Field label="Description / helper text">
                            <textarea
                              rows={2}
                              value={step.description ?? ''}
                              onChange={(e) =>
                                setConfig((c) =>
                                  updateStep(c, step.n, { description: e.target.value })
                                )
                              }
                            />
                          </Field>
                        )}
                        {step.n === 3 && (
                          <>
                            <Field label="Notes label">
                              <input
                                value={step.notesLabel ?? ''}
                                onChange={(e) =>
                                  setConfig((c) =>
                                    updateStep(c, step.n, { notesLabel: e.target.value })
                                  )
                                }
                              />
                            </Field>
                            <Field label="Notes placeholder">
                              <input
                                value={step.notesPlaceholder ?? ''}
                                onChange={(e) =>
                                  setConfig((c) =>
                                    updateStep(c, step.n, { notesPlaceholder: e.target.value })
                                  )
                                }
                              />
                            </Field>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </fieldset>

              <fieldset className="admin-customize-wizard__block">
                <legend>Step 2 sections</legend>
                <div className="admin-customize-wizard__grid">
                  {['sizes', 'colors', 'batting'].map((key) => (
                    <div key={key} className="admin-customize-section-toggle">
                      <label className="row">
                        <input
                          type="checkbox"
                          checked={config.sections?.[key]?.enabled !== false}
                          onChange={(e) => patchSection(key, 'enabled', e.target.checked)}
                        />
                        <span>{key}</span>
                      </label>
                      <input
                        placeholder="Section heading"
                        value={config.sections?.[key]?.heading ?? ''}
                        onChange={(e) => patchSection(key, 'heading', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </fieldset>

              <fieldset className="admin-customize-wizard__block">
                <legend>Quilt sizes</legend>
                <div className="table-wrap">
                  <table className="admin-customize-options-table">
                    <thead>
                      <tr>
                        <th>On</th>
                        <th>Value</th>
                        <th>Label</th>
                        <th>Code</th>
                        <th>Hint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.sizeOptions?.map((row, index) => (
                        <tr key={row.value}>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.enabled !== false}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  sizeOptions: updateOptionList(c.sizeOptions, index, {
                                    enabled: e.target.checked,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <code>{row.value}</code>
                          </td>
                          <td>
                            <input
                              value={row.label ?? ''}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  sizeOptions: updateOptionList(c.sizeOptions, index, {
                                    label: e.target.value,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={row.code ?? ''}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  sizeOptions: updateOptionList(c.sizeOptions, index, {
                                    code: e.target.value,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={row.hint ?? ''}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  sizeOptions: updateOptionList(c.sizeOptions, index, {
                                    hint: e.target.value,
                                  }),
                                }))
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>

              <fieldset className="admin-customize-wizard__block">
                <legend>Color palettes</legend>
                <p className="muted admin-customize-field__hint">
                  Swatch colors: comma-separated hex values (e.g. #f7f2ea, #e8d4b8). Use stripes
                  layout only on scrappy-rainbow (set in JSON via API if needed).
                </p>
                <div className="table-wrap">
                  <table className="admin-customize-options-table">
                    <thead>
                      <tr>
                        <th>On</th>
                        <th>Value</th>
                        <th>Label</th>
                        <th>Hint</th>
                        <th>Colors (hex)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.colorOptions?.map((row, index) => (
                        <tr key={row.value}>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.enabled !== false}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  colorOptions: updateOptionList(c.colorOptions, index, {
                                    enabled: e.target.checked,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <code>{row.value}</code>
                          </td>
                          <td>
                            <input
                              value={row.label ?? ''}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  colorOptions: updateOptionList(c.colorOptions, index, {
                                    label: e.target.value,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={row.hint ?? ''}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  colorOptions: updateOptionList(c.colorOptions, index, {
                                    hint: e.target.value,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={(row.colors ?? []).join(', ')}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  colorOptions: updateOptionList(c.colorOptions, index, {
                                    colors: e.target.value
                                      .split(',')
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  }),
                                }))
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>

              <fieldset className="admin-customize-wizard__block">
                <legend>Batting options</legend>
                <div className="table-wrap">
                  <table className="admin-customize-options-table">
                    <thead>
                      <tr>
                        <th>On</th>
                        <th>Value</th>
                        <th>Label</th>
                        <th>Hint</th>
                        <th>Image URL</th>
                        <th>Symbol</th>
                      </tr>
                    </thead>
                    <tbody>
                      {config.battingOptions?.map((row, index) => (
                        <tr key={row.value}>
                          <td>
                            <input
                              type="checkbox"
                              checked={row.enabled !== false}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  battingOptions: updateOptionList(c.battingOptions, index, {
                                    enabled: e.target.checked,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <code>{row.value}</code>
                          </td>
                          <td>
                            <input
                              value={row.label ?? ''}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  battingOptions: updateOptionList(c.battingOptions, index, {
                                    label: e.target.value,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={row.hint ?? ''}
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  battingOptions: updateOptionList(c.battingOptions, index, {
                                    hint: e.target.value,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={row.image ?? ''}
                              placeholder="/assets/… or https://"
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  battingOptions: updateOptionList(c.battingOptions, index, {
                                    image: e.target.value || undefined,
                                  }),
                                }))
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={row.code ?? ''}
                              placeholder="?"
                              onChange={(e) =>
                                setConfig((c) => ({
                                  ...c,
                                  battingOptions: updateOptionList(c.battingOptions, index, {
                                    code: e.target.value || undefined,
                                  }),
                                }))
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </fieldset>

              <fieldset className="admin-customize-wizard__block">
                <legend>Validation messages</legend>
                <div className="admin-customize-wizard__grid">
                  {Object.entries(config.messages ?? {}).map(([key, text]) => (
                    <Field key={key} label={key}>
                      <input
                        value={text ?? ''}
                        onChange={(e) =>
                          patch('messages', { [key]: e.target.value })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </fieldset>

              <div className="row">
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save customize wizard'}
                </button>
                <button type="button" className="btn" onClick={load} disabled={busy}>
                  Reload
                </button>
              </div>
            </form>
          )}
        </>
      ) : null}
    </section>
  );
}
