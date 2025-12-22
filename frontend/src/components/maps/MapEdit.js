import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mapsApi } from '../../api';
import './Maps.css';

const MapEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
  });
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMap();
  }, [id]);

  const loadMap = async () => {
    try {
      const mapData = await mapsApi.maps.get(id);
      setMap(mapData);
      setFormData({
        name: mapData.name,
        description: mapData.description || '',
        is_public: mapData.is_public,
      });
    } catch (err) {
      setError('Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter a map name');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await mapsApi.maps.update(id, formData);
      navigate(`/maps/${id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update map');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this map? All points of interest will be deleted.')) {
      return;
    }

    try {
      await mapsApi.maps.delete(id);
      navigate('/maps');
    } catch (err) {
      setError('Failed to delete map');
    }
  };

  if (loading) {
    return (
      <div className="map-form-container">
        <div className="loading">Loading map...</div>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="map-form-container">
        <div className="alert alert-error">Map not found</div>
        <button className="btn-primary" onClick={() => navigate('/maps')}>
          Back to Maps
        </button>
      </div>
    );
  }

  return (
    <div className="map-form-container">
      <div className="map-form-header">
        <button className="btn-back" onClick={() => navigate(`/maps/${id}`)}>
          ← Back to Map
        </button>
        <h1>Edit Map</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="map-form">
        <div className="map-preview-section">
          <h3>Map File</h3>
          <div className="map-preview">
            {map.file_type === 'image' ? (
              <img src={map.file} alt={map.name} />
            ) : (
              <div className="pdf-preview">
                <span>📄</span>
                <span>PDF</span>
              </div>
            )}
          </div>
          <small>Map file cannot be changed after creation</small>
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
            className="btn-danger"
            onClick={handleDelete}
          >
            Delete Map
          </button>
          <div className="form-actions-right">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(`/maps/${id}`)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MapEdit;
