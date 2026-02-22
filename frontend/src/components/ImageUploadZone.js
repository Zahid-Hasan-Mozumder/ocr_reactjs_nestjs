import React, { useRef, useState } from 'react';

function ImageUploadZone({ label, side, file, onFileSelect, onFileClear }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const preview = file ? URL.createObjectURL(file) : null;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) {
      onFileSelect(dropped);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) onFileSelect(selected);
    e.target.value = '';
  };

  return (
    <div className="upload-zone-wrapper">
      <h3 className="upload-label">{label}</h3>
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onClick={() => !file && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt={`${side} of insurance card`} className="card-preview" />
            <div className="preview-overlay">
              <button
                className="change-btn"
                onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
              >
                Change
              </button>
              <button
                className="remove-btn"
                onClick={(e) => { e.stopPropagation(); onFileClear(); }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="upload-text">Drop image here or <span className="browse-link">browse</span></p>
            <p className="upload-hint">JPEG, PNG or WebP · Max 10 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      {file && (
        <p className="file-name">{file.name} · {(file.size / 1024).toFixed(1)} KB</p>
      )}
    </div>
  );
}

export default ImageUploadZone;
