import { useId, useRef } from 'react';
import { IMAGE_UPLOAD_ACCEPT } from '../lib/prepareUploadImages.js';

export default function CustomizeOwnDesignUpload({
  previewUrl,
  uploading,
  uploadError,
  onPickFile,
  onClear,
}) {
  const inputId = useId();
  const inputRef = useRef(null);

  function openPicker() {
    inputRef.current?.click();
  }

  return (
    <section className="customize-own-design" aria-labelledby={`${inputId}-heading`}>
      <h3 id={`${inputId}-heading`} className="customize-choices__heading">
        Bring my own design
      </h3>
      <p className="muted customize-own-design__intro">
        Optional — upload a photo or sketch of the quilt design you have in mind. Our designer will
        use it as a reference.
      </p>

      {uploadError ? <p className="error customize-own-design__error">{uploadError}</p> : null}

      {previewUrl ? (
        <div className="customize-own-design__preview card">
          <img src={previewUrl} alt="Your uploaded design reference" />
          <div className="customize-own-design__actions">
            <button type="button" className="btn" onClick={openPicker} disabled={uploading}>
              Replace image
            </button>
            <button
              type="button"
              className="btn customize-own-design__remove"
              onClick={onClear}
              disabled={uploading}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="customize-own-design__drop card">
          <p className="customize-own-design__hint muted">JPEG, PNG, WebP, GIF, or iPhone HEIC</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openPicker}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Choose image'}
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        className="customize-own-design__input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPickFile(file);
        }}
        disabled={uploading}
      />
    </section>
  );
}
