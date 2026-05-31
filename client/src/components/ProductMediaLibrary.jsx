import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api.js';
import { IMAGE_UPLOAD_ACCEPT } from '../lib/prepareUploadImages.js';
import { MEDIA_LIBRARY_UPLOAD_MAX } from '../lib/mediaLibraryUpload.js';

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 30, 'all'];

function uploadPhaseLabel(phase) {
  if (phase === 'prepare') return 'Preparing';
  if (phase === 'upload') return 'Uploading';
  return 'Processing';
}

export default function ProductMediaLibrary({ productId, disabled, onImagesAdded, onError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [scanInfo, setScanInfo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameSavingId, setRenameSavingId] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.mediaLibrary();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      onError?.([e.body?.error, e.body?.hint].filter(Boolean).join(' ') || e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = useMemo(() => {
    if (pageSize === 'all' || items.length === 0) return 1;
    return Math.max(1, Math.ceil(items.length / pageSize));
  }, [items.length, pageSize]);

  const paginatedItems = useMemo(() => {
    if (items.length === 0) return [];
    if (pageSize === 'all') return items;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const listRange = useMemo(() => {
    if (items.length === 0) return { start: 0, end: 0 };
    if (pageSize === 'all') return { start: 1, end: items.length };
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, items.length);
    return { start, end };
  }, [items.length, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    if (files.length > MEDIA_LIBRARY_UPLOAD_MAX) {
      onError?.(
        `You can upload up to ${MEDIA_LIBRARY_UPLOAD_MAX} files at a time. You selected ${files.length}.`
      );
      return;
    }
    setBusy(true);
    setScanInfo(null);
    setUploadProgress(null);
    onError?.(null);
    try {
      const data = await adminApi.uploadMediaLibrary(files, setUploadProgress);
      const uploaded = Array.isArray(data?.items) ? data.items : [];
      const failed = Array.isArray(data?.errors) ? data.errors : [];

      if (uploaded.length) {
        setItems((prev) => {
          const newIds = new Set(uploaded.map((item) => item.id));
          const rest = prev.filter((item) => !newIds.has(item.id));
          return [...uploaded, ...rest];
        });
        setPage(1);
      } else if (!failed.length) {
        await load();
      }

      const parts = [];
      if (uploaded.length) {
        parts.push(
          `Added ${uploaded.length} image${uploaded.length === 1 ? '' : 's'} to the library.`
        );
      }
      if (failed.length) {
        const names = failed.slice(0, 3).map((f) => f.fileName).join(', ');
        const more = failed.length > 3 ? ` (+${failed.length - 3} more)` : '';
        parts.push(`${failed.length} failed${names ? `: ${names}${more}` : ''}.`);
      }
      if (parts.length) {
        setScanInfo(parts.join(' '));
      }

      if (failed.length && !uploaded.length) {
        onError?.(failed[0]?.error || `${failed.length} file(s) could not be uploaded.`);
      } else if (failed.length) {
        onError?.(
          `${failed.length} file${failed.length === 1 ? '' : 's'} failed. ${failed[0]?.fileName}: ${failed[0]?.error}`
        );
      }
    } catch (err) {
      onError?.(
        [err.body?.error, err.body?.hint, err.body?.detail, err.message].filter(Boolean).join(' — ')
      );
    } finally {
      setUploadProgress(null);
      setBusy(false);
    }
  }

  async function onScan() {
    setBusy(true);
    setScanInfo(null);
    onError?.(null);
    try {
      const data = await adminApi.scanMediaLibrary();
      setScanInfo(
        data.added > 0
          ? `Added ${data.added} image(s) from the uploads folder.`
          : 'No new images found in uploads.'
      );
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      onError?.(err.body?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id) {
    setBusy(true);
    onError?.(null);
    try {
      await adminApi.deleteMediaLibraryItem(id);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (renamingId === id) {
        setRenamingId(null);
        setRenameValue('');
      }
      await load();
    } catch (err) {
      onError?.(err.body?.error || err.message);
    } finally {
      setBusy(false);
    }
  }

  function startRename(item) {
    if (isDisabled) return;
    setRenamingId(item.id);
    setRenameValue(item.filename);
    onError?.(null);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue('');
  }

  async function saveRename(item) {
    const nextName = renameValue.trim();
    if (!nextName || nextName === item.filename) {
      cancelRename();
      return;
    }
    setRenameSavingId(item.id);
    onError?.(null);
    try {
      const data = await adminApi.renameMediaLibraryItem(item.id, nextName);
      const updated = data?.item;
      if (updated?.id) {
        setItems((prev) => prev.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)));
        setScanInfo(`Renamed to ${updated.filename} on disk.`);
      } else {
        await load();
      }
      cancelRename();
    } catch (err) {
      onError?.(
        [err.body?.error, err.body?.detail].filter(Boolean).join(' — ') || err.message
      );
    } finally {
      setRenameSavingId(null);
    }
  }

  function onRenameKeyDown(e, item) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename(item);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  }

  async function onAddToProduct() {
    if (!productId || selected.size === 0) return;
    setBusy(true);
    onError?.(null);
    try {
      const data = await adminApi.addProductImagesFromLibrary(
        productId,
        Array.from(selected)
      );
      setSelected(new Set());
      onImagesAdded?.(data.images);
    } catch (err) {
      onError?.(
        [err.body?.error, err.body?.hint].filter(Boolean).join(' — ') || err.message
      );
    } finally {
      setBusy(false);
    }
  }

  const isDisabled = disabled || busy || renameSavingId != null || renamingId != null;

  return (
    <div className="admin-media-library">
      <h4 className="admin-media-library__title">Media gallery</h4>
      <p className="muted" style={{ marginTop: 0 }}>
        Upload up to {MEDIA_LIBRARY_UPLOAD_MAX} images at a time to the site library (including iPhone
        HEIC — converted to high-quality PNG) or scan the server <code>/uploads</code> folder for
        existing files. Click <strong>Rename</strong> on any image to change its filename on disk. Select
        images below to attach copies to this product.
      </p>
      <div className="row" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <label className="btn" style={{ cursor: isDisabled ? 'wait' : 'pointer' }}>
          {uploadProgress
            ? `${uploadPhaseLabel(uploadProgress.phase)} ${uploadProgress.current}/${uploadProgress.total}…`
            : busy
              ? 'Working…'
              : 'Upload to library'}
          <input
            type="file"
            accept={IMAGE_UPLOAD_ACCEPT}
            multiple
            disabled={isDisabled}
            onChange={onUpload}
            style={{ display: 'none' }}
          />
        </label>
        <button type="button" className="btn" onClick={onScan} disabled={isDisabled}>
          Scan uploads folder
        </button>
        {productId ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddToProduct}
            disabled={isDisabled || selected.size === 0}
          >
            Add selected to product ({selected.size})
          </button>
        ) : null}
      </div>
      {uploadProgress ? (
        <div className="admin-upload-progress" role="status" aria-live="polite">
          <div className="admin-upload-progress__header">
            <span className="admin-upload-progress__phase">
              {uploadPhaseLabel(uploadProgress.phase)}{' '}
              <strong>{uploadProgress.current}</strong> of <strong>{uploadProgress.total}</strong>
            </span>
            <span className="admin-upload-progress__counts muted">
              {uploadProgress.uploaded} added
              {uploadProgress.failed > 0 ? ` · ${uploadProgress.failed} failed` : ''}
            </span>
          </div>
          <p className="admin-upload-progress__file" title={uploadProgress.fileName}>
            {uploadProgress.fileName}
          </p>
          <div
            className="admin-upload-progress__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={uploadProgress.total}
            aria-valuenow={uploadProgress.current}
            aria-label={`Upload progress: ${uploadProgress.current} of ${uploadProgress.total}`}
          >
            <div
              className="admin-upload-progress__bar-fill"
              style={{
                width: `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      ) : null}
      {scanInfo ? (
        <p className="muted" style={{ marginTop: 0 }}>
          {scanInfo}
        </p>
      ) : null}
      {loading ? (
        <p className="muted">Loading media…</p>
      ) : items.length === 0 ? (
        <p className="muted">
          No library images yet. Upload files or scan the uploads folder to import images already on
          disk.
        </p>
      ) : (
        <>
          <div className="admin-pagination">
            <div className="admin-pagination__size">
              <label htmlFor="admin-media-page-size">Show</label>
              <select
                id="admin-media-page-size"
                value={String(pageSize)}
                disabled={isDisabled}
                onChange={(e) => {
                  const v = e.target.value;
                  setPageSize(v === 'all' ? 'all' : Number(v));
                }}
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={String(n)}>
                    {n === 'all' ? 'All images' : n}
                  </option>
                ))}
              </select>
              <span className="muted">
                {pageSize === 'all'
                  ? `All ${items.length} image${items.length === 1 ? '' : 's'}`
                  : `Showing ${listRange.start}–${listRange.end} of ${items.length}`}
              </span>
            </div>
            {pageSize !== 'all' && totalPages > 1 ? (
              <div className="admin-pagination__nav row">
                <button
                  type="button"
                  className="btn"
                  disabled={isDisabled || page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="muted admin-pagination__status">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn"
                  disabled={isDisabled || page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
          <div className="admin-media-grid" role="list">
          {paginatedItems.map((item) => {
            const isSelected = selected.has(item.id);
            const isRenaming = renamingId === item.id;
            const isSavingRename = renameSavingId === item.id;
            return (
              <div key={item.id} className="admin-media-item" role="listitem">
                <button
                  type="button"
                  className={`admin-media-item__select${isSelected ? ' admin-media-item__select--on' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  title={isSelected ? 'Deselect' : 'Select for product'}
                >
                  <img src={item.path} alt={item.filename} />
                  {isSelected ? <span className="admin-media-item__check" aria-hidden="true">✓</span> : null}
                </button>
                <div className="admin-media-item__meta">
                  {item.source === 'scan' ? (
                    <span className="admin-media-item__badge">on disk</span>
                  ) : null}
                </div>
                {isRenaming ? (
                  <div className="admin-media-item__rename">
                    <input
                      id={`media-rename-${item.id}`}
                      className="admin-media-item__rename-input"
                      type="text"
                      value={renameValue}
                      disabled={isSavingRename}
                      aria-label={`Filename for ${item.filename}`}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => onRenameKeyDown(e, item)}
                      autoFocus
                    />
                    <div className="admin-media-item__rename-actions row">
                      <button
                        type="button"
                        className="btn btn-primary admin-media-item__rename-save"
                        onClick={() => saveRename(item)}
                        disabled={isSavingRename || !renameValue.trim()}
                      >
                        {isSavingRename ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="btn admin-media-item__rename-cancel"
                        onClick={cancelRename}
                        disabled={isSavingRename}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="admin-media-item__filename-row">
                    <a
                      className="admin-media-item__name admin-media-item__name-link"
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${item.filename} at full size`}
                    >
                      {item.filename}
                    </a>
                    <button
                      type="button"
                      className="btn admin-media-item__rename-btn"
                      onClick={() => startRename(item)}
                      disabled={isDisabled}
                    >
                      Rename
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-danger admin-media-item__delete"
                  onClick={() => onDelete(item.id)}
                  disabled={isDisabled}
                  aria-label={`Remove ${item.filename} from library`}
                >
                  Delete
                </button>
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
