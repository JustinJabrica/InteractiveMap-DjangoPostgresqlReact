import React, { useState, useEffect } from 'react';
import './Maps.css';

const PoiModal = ({ poi, position, layers = [], onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    layer_id: '',
    icon: '',
    color: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (poi) {
      setFormData({
        name: poi.name || '',
        description: poi.description || '',
        layer_id: poi.layer?.id || poi.layer_id || '',
        icon: poi.icon || '',
        color: poi.color || '',
      });
    }
  }, [poi]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear custom color when layer changes (will use layer color)
    if (name === 'layer_id') {
      setFormData((prev) => ({
        ...prev,
        layer_id: value,
        color: '', // Reset to use layer color
      }));
    }
  };

  const getDisplayColor = () => {
    if (formData.color) {
      return formData.color;
    }
    if (formData.layer_id) {
      const layer = layers.find((l) => l.id === parseInt(formData.layer_id));
      if (layer) {
        return layer.color;
      }
    }
    return '#e74c3c'; // Default red
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);

    if (!formData.name.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        layer_id: formData.layer_id || null,
        icon: formData.icon,
        color: formData.color,
      };
      await onSave(dataToSave);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save point of interest');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this point of interest?')) {
      onDelete();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{poi ? 'Edit Point of Interest' : 'New Point of Interest'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter point name"
              autoFocus
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
              rows={3}
              placeholder="Add a description..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="layer_id">Layer / Category</label>
            <select
              id="layer_id"
              name="layer_id"
              value={formData.layer_id}
              onChange={handleChange}
            >
              <option value="">Uncategorized</option>
              {layers.map((layer) => (
                <option key={layer.id} value={layer.id}>
                  {layer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="color">Marker Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                id="color"
                name="color"
                value={getDisplayColor()}
                onChange={handleChange}
              />
              <span className="color-value">{getDisplayColor()}</span>
              {formData.color && (
                <button
                  type="button"
                  className="btn-clear-color"
                  onClick={() => setFormData({ ...formData, color: '' })}
                >
                  Use layer color
                </button>
              )}
            </div>
            <small className="color-hint">
              {formData.color ? 'Custom color' : 'Using layer color'}
            </small>
          </div>

          {position && (
            <div className="position-info">
              <span>Position: ({position.x}%, {position.y}%)</span>
            </div>
          )}

          <div className="modal-actions">
            {poi && onDelete && (
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            )}
            <div className="modal-actions-right">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : poi ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PoiModal;
