import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mapsApi } from '../../api/';
import './Maps.css';

const MapCreate = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please select an image (JPEG, PNG, GIF, WebP) or PDF file');
      return;
    }

    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File must be less than 100MB');
      return;
    }

    setFile(selectedFile);
    setError('');

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleFileChange = (e) => {
    handleFileSelect(e.target.files?.[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a map file');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter a map name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await mapsApi.maps.create({
        ...formData,
        file,
      });
      navigate(`/maps/${response.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create map');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-form-container">
      <div className="map-form-header">
        <button className="btn-back" onClick={() => navigate('/maps')}>
          ← Back to Maps
        </button>
        <h1>Create New Map</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="map-form">
        <div
          className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {file ? (
            <div className="file-preview">
              {preview ? (
                <img src={preview} alt="Map preview" />
              ) : (
                <div className="pdf-icon">
                  <span>📄</span>
                  <span>PDF</span>
                </div>
              )}
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <button
                type="button"
                className="btn-remove-file"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setPreview(null);
                }}
              >
                ✕ Remove
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📁</div>
              <p>Drag and drop a map image or PDF here</p>
              <p className="upload-hint">or click to browse</p>
              <p className="upload-formats">Supported: JPEG, PNG, GIF, WebP, PDF (max 10MB)</p>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
            hidden
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Map Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter map name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Add a description for your map..."
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
            />
            <span>Make this map public</span>
          </label>
          <small>Public maps can be viewed by anyone with the link</small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/maps')}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading || !file}>
            {loading ? 'Creating...' : 'Create Map'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MapCreate;
