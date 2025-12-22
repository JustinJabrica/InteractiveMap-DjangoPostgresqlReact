import React, { useState, useEffect } from 'react';
import './Maps.css';

const PoiModal = ({ poi, position, categories, layers, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    layer_id: '',
    icon: '',
    color: '#e74c3c',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (poi) {
      setFormData({
        name: poi.name || '',
        description: poi.description || '',
        category_id: poi.category?.id || '',
        layer_id: poi.layer?.id || '',
        icon: poi.icon || '',
        color: poi.color || poi.category_color || '#e74c3c',
      });
    }
  }, [poi]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Update color when category changes
    if (name === 'category_id' && value) {
      const category = categories.find((c) => c.id === parseInt(value));
      if (category) {
        setFormData((prev) => ({
          ...prev,
          category_id: value,
          color: category.color,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        category_id: formData.category_id || null,
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category_id">Category</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="layer_id">Layer</label>
              <select
                id="layer_id"
                name="layer_id"
                value={formData.layer_id}
                onChange={handleChange}
              >
                <option value="">No layer</option>
                {layers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="color">Marker Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
              <span className="color-value">{formData.color}</span>
            </div>
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
