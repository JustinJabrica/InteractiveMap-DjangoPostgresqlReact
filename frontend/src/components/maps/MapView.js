import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mapsApi } from '../../api/';
import PoiModal from './PoiModal';
import PoiList from './PoiList';
import LayerPanel from './LayerPanel';
import ShareModal from './ShareModal';
import './Maps.css';

const MapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);

  const [map, setMap] = useState(null);
  const [pois, setPois] = useState([]);
  const [layers, setLayers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedPoi, setSelectedPoi] = useState(null);
  const [showPoiModal, setShowPoiModal] = useState(false);
  const [newPoiPosition, setNewPoiPosition] = useState(null);
  const [showPoiList, setShowPoiList] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState(new Set());

  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadMapData();
  }, [id]);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const [mapData, poisData, categoriesData] = await Promise.all([
        mapsApi.maps.get(id),
        mapsApi.maps.getPois(id, sortBy, sortOrder),
        mapsApi.categories.list(),
      ]);

      setMap(mapData);
      setPois(poisData);
      setLayers(mapData.layers || []);
      setCategories(categoriesData.results || categoriesData);

      // Set all layers visible by default
      const layerIds = new Set((mapData.layers || []).map((l) => l.id));
      layerIds.add(null); // Include POIs without a layer
      setVisibleLayers(layerIds);
    } catch (err) {
      setError('Failed to load map');
    } finally {
      setLoading(false);
    }
  };

  const loadPois = async () => {
    try {
      const poisData = await mapsApi.maps.getPois(id, sortBy, sortOrder);
      setPois(poisData);
    } catch (err) {
      console.error('Failed to reload POIs', err);
    }
  };

  useEffect(() => {
    if (map) {
      loadPois();
    }
  }, [sortBy, sortOrder]);

  const handleMapClick = (e) => {
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setNewPoiPosition({ x: x.toFixed(3), y: y.toFixed(3) });
    setSelectedPoi(null);
    setShowPoiModal(true);
  };

  const handlePoiClick = (poi, e) => {
    e.stopPropagation();
    setSelectedPoi(poi);
    setNewPoiPosition(null);
    setShowPoiModal(true);
  };

  const handlePoiSave = async (poiData) => {
    try {
      if (selectedPoi) {
        await mapsApi.pois.update(selectedPoi.id, poiData);
      } else {
        await mapsApi.pois.create({
          ...poiData,
          map: id,
          x_position: newPoiPosition.x,
          y_position: newPoiPosition.y,
        });
      }
      await loadPois();
      setShowPoiModal(false);
      setSelectedPoi(null);
      setNewPoiPosition(null);
    } catch (err) {
      throw err;
    }
  };

  const handlePoiDelete = async (poiId) => {
    try {
      await mapsApi.pois.delete(poiId);
      await loadPois();
      setShowPoiModal(false);
      setSelectedPoi(null);
    } catch (err) {
      console.error('Failed to delete POI', err);
    }
  };

  const toggleLayerVisibility = (layerId) => {
    setVisibleLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  };

  const isPoiVisible = (poi) => {
    return visibleLayers.has(poi.layer?.id || null);
  };

  if (loading) {
    return (
      <div className="map-view-container">
        <div className="loading">Loading map...</div>
      </div>
    );
  }

  if (error || !map) {
    return (
      <div className="map-view-container">
        <div className="alert alert-error">{error || 'Map not found'}</div>
        <button className="btn-primary" onClick={() => navigate('/maps')}>
          Back to Maps
        </button>
      </div>
    );
  }

  return (
    <div className="map-view-container">
      <div className="map-view-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/maps')}>
            ←
          </button>
          <div className="map-info">
            <h1>{map.name}</h1>
            {map.description && <p>{map.description}</p>}
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`btn-icon-lg ${showLayers ? 'active' : ''}`}
            onClick={() => setShowLayers(!showLayers)}
            title="Layers"
          >
            🗂️
          </button>
          <button
            className={`btn-icon-lg ${showPoiList ? 'active' : ''}`}
            onClick={() => setShowPoiList(!showPoiList)}
            title="Points List"
          >
            📋
          </button>
          <button
            className="btn-icon-lg"
            onClick={() => setShowShareModal(true)}
            title="Share"
          >
            🔗
          </button>
          <button
            className="btn-icon-lg"
            onClick={() => navigate(`/maps/${id}/edit`)}
            title="Edit Map"
          >
            ✏️
          </button>
        </div>
      </div>

      <div className="map-view-content">
        {showLayers && (
          <LayerPanel
            layers={layers}
            visibleLayers={visibleLayers}
            onToggleLayer={toggleLayerVisibility}
            mapId={id}
            onLayersChange={() => loadMapData()}
            onClose={() => setShowLayers(false)}
          />
        )}

        <div className="map-canvas-container">
          <div
            ref={mapContainerRef}
            className="map-canvas"
            onClick={handleMapClick}
          >
            {map.file_type === 'image' ? (
              <img src={map.file} alt={map.name} className="map-image" />
            ) : (
              <div className="pdf-container">
                <iframe
                  src={`${map.file}#toolbar=0`}
                  title={map.name}
                  className="pdf-iframe"
                />
              </div>
            )}

            {pois.filter(isPoiVisible).map((poi) => (
              <div
                key={poi.id}
                className="poi-marker"
                style={{
                  left: `${poi.x_position}%`,
                  top: `${poi.y_position}%`,
                  backgroundColor: poi.color || poi.category_color || '#e74c3c',
                }}
                onClick={(e) => handlePoiClick(poi, e)}
                title={poi.name}
              >
                <span className="poi-marker-icon">📍</span>
                <span className="poi-marker-label">{poi.name}</span>
              </div>
            ))}

            <div className="map-instructions">
              Click anywhere on the map to add a point of interest
            </div>
          </div>
        </div>

        {showPoiList && (
          <PoiList
            pois={pois}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(newSort, newOrder) => {
              setSortBy(newSort);
              setSortOrder(newOrder);
            }}
            onPoiClick={(poi) => {
              setSelectedPoi(poi);
              setNewPoiPosition(null);
              setShowPoiModal(true);
            }}
            onClose={() => setShowPoiList(false)}
          />
        )}
      </div>

      {showPoiModal && (
        <PoiModal
          poi={selectedPoi}
          position={newPoiPosition}
          categories={categories}
          layers={layers}
          onSave={handlePoiSave}
          onDelete={selectedPoi ? () => handlePoiDelete(selectedPoi.id) : null}
          onClose={() => {
            setShowPoiModal(false);
            setSelectedPoi(null);
            setNewPoiPosition(null);
          }}
        />
      )}

      {showShareModal && (
        <ShareModal
          mapId={id}
          mapName={map.name}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default MapView;
