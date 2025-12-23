import React, { useState } from 'react';
import { mapsApi } from '../../api';
import './Maps.css';

const LayerPanel = ({
  layers = [],
  visibleLayers = new Set(),
  onToggleLayer,
  mapId,
  onLayersChange,
  onClose,
  canEdit = false,
  canDelete = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLayer, setEditingLayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3498db',
    icon: 'marker',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3498db',
      icon: 'marker',
    });
    setShowAddForm(false);
    setEditingLayer(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter a layer name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (editingLayer) {
        await mapsApi.layers.update(editingLayer.id, formData);
      } else {
        await mapsApi.layers.create({
          ...formData,
          map: mapId,
        });
      }
      resetForm();
      onLayersChange();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save layer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (layer) => {
    setFormData({
      name: layer.name,
      description: layer.description || '',
      color: layer.color || '#3498db',
      icon: layer.icon || 'marker',
    });
    setEditingLayer(layer);
    setShowAddForm(true);
  };

  const handleDelete = async (layerId) => {
    if (!window.confirm('Delete this layer/category? POIs in this layer will become uncategorized.')) {
      return;
    }

    try {
      await mapsApi.layers.delete(layerId);
      onLayersChange();
    } catch (err) {
      setError('Failed to delete layer');
    }
  };

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <h3>Layers / Categories</h3>
        <button className="panel-close" onClick={onClose}>
          ✕
        </button>
      </div>

      {error && <div className="alert alert-error small">{error}</div>}

      <div className="layer-list">
        {/* Default layer for POIs without a layer */}
        <div className="layer-item">
          <label className="layer-checkbox">
            <input
              type="checkbox"
              checked={visibleLayers.has(null)}
              onChange={() => onToggleLayer(null)}
            />
            <span
              className="layer-color"
              style={{ backgroundColor: '#999' }}
            />
            <span className="layer-name">Uncategorized</span>
          </label>
        </div>

        {layers.map((layer) => (
          <div key={layer.id} className="layer-item">
            <label className="layer-checkbox">
              <input
                type="checkbox"
                checked={visibleLayers.has(layer.id)}
                onChange={() => onToggleLayer(layer.id)}
              />
              <span
                className="layer-color"
                style={{ backgroundColor: layer.color || '#3498db' }}
              />
              <span className="layer-name">{layer.name}</span>
              <span className="layer-count">({layer.poi_count})</span>
            </label>
            {(canEdit || canDelete) && (
              <div className="layer-actions">
                {canEdit && (
                  <button
                    className="btn-icon-sm"
                    onClick={() => handleEdit(layer)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn-icon-sm"
                    onClick={() => handleDelete(layer.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        showAddForm ? (
          <form onSubmit={handleSubmit} className="layer-form">
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Layer/category name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description (optional)"
              />
            </div>
            <div className="form-group">
              <label>Color:</label>
              <div className="color-input-row">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                />
                <span className="color-value">{formData.color}</span>
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-sm"
                disabled={loading}
              >
                {loading ? 'Saving...' : editingLayer ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        ) : (
          <button
            className="btn-add-layer"
            onClick={() => setShowAddForm(true)}
          >
            + Add Layer / Category
          </button>
        )
      )}
    </div>
  );
};

export default LayerPanel;