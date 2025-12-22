import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mapsApi } from '../../api/';
import './Maps.css';

const MapList = () => {
  const [maps, setMaps] = useState([]);
  const [sharedMaps, setSharedMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('my-maps');
  const navigate = useNavigate();

  useEffect(() => {
    loadMaps();
  }, []);

  const loadMaps = async () => {
    try {
      setLoading(true);
      const [myMapsData, sharedMapsData] = await Promise.all([
        mapsApi.maps.myMaps(),
        mapsApi.maps.sharedWithMe(),
      ]);
      setMaps(myMapsData.results || myMapsData);
      setSharedMaps(sharedMapsData.results || sharedMapsData);
    } catch (err) {
      setError('Failed to load maps');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMap = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this map? All points of interest will be deleted.')) {
      return;
    }

    try {
      await mapsApi.maps.delete(id);
      setMaps(maps.filter((map) => map.id !== id));
    } catch (err) {
      setError('Failed to delete map');
    }
  };

  const displayMaps = activeTab === 'my-maps' ? maps : sharedMaps;

  if (loading) {
    return (
      <div className="maps-container">
        <div className="loading">Loading maps...</div>
      </div>
    );
  }

  return (
    <div className="maps-container">
      <div className="maps-header">
        <h1>My Maps</h1>
        <button className="btn-primary" onClick={() => navigate('/maps/new')}>
          + Create Map
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="maps-tabs">
        <button
          className={`tab-btn ${activeTab === 'my-maps' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-maps')}
        >
          My Maps ({maps.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => setActiveTab('shared')}
        >
          Shared with Me ({sharedMaps.length})
        </button>
      </div>

      {displayMaps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗺️</div>
          <h3>{activeTab === 'my-maps' ? 'No maps yet' : 'No shared maps'}</h3>
          <p>
            {activeTab === 'my-maps'
              ? 'Create your first map to get started'
              : 'Maps shared with you will appear here'}
          </p>
          {activeTab === 'my-maps' && (
            <button className="btn-primary" onClick={() => navigate('/maps/new')}>
              Create Map
            </button>
          )}
        </div>
      ) : (
        <div className="maps-grid">
          {displayMaps.map((map) => (
            <Link to={`/maps/${map.id}`} key={map.id} className="map-card">
              <div className="map-card-preview">
                {map.file_type === 'image' ? (
                  <img src={map.file} alt={map.name} />
                ) : (
                  <div className="pdf-preview">
                    <span>📄</span>
                    <span>PDF</span>
                  </div>
                )}
              </div>
              <div className="map-card-content">
                <h3>{map.name}</h3>
                <p className="map-description">{map.description || 'No description'}</p>
                <div className="map-meta">
                  <span className="poi-count">{map.poi_count} points</span>
                  <span className="map-date">
                    {new Date(map.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {activeTab === 'my-maps' && (
                <div className="map-card-actions">
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/maps/${map.id}/edit`);
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={(e) => handleDeleteMap(map.id, e)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapList;
