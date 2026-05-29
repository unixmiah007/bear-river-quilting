import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link'],
  ['clean'],
];

export default function RichTextEditor({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  minHeight = 140,
}) {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR,
    }),
    []
  );

  const formats = useMemo(
    () => ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'],
    []
  );

  return (
    <div
      className={`rich-text-editor${disabled ? ' rich-text-editor--disabled' : ''}`}
      style={{ '--rich-text-min-height': `${minHeight}px` }}
    >
      <ReactQuill
        id={id}
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
      />
    </div>
  );
}
