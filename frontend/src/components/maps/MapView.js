/**
 * MapView.js
 * 
 * Main container component for viewing and interacting with maps.
 * Handles:
 * - Map data loading and state management
 * - Zoom and pan functionality
 * - Fullscreen mode
 * - Toolbar and side panel management
 * - Modal coordination (POI, Share)
 * 
 * POI rendering is delegated to the PoiLayer component for better
 * performance and separation of concerns.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mapsApi } from '../../api';
import PoiLayer from './PoiLayer';
import PoiModal from './PoiModal';
import PoiList from './PoiList';
import LayerPanel from './LayerPanel';
import ShareModal from './ShareModal';
import './Maps.css';

// Zoom constants
const MIN_ZOOM = 1;
const MAX_ZOOM = 25;
const ZOOM_STEP = 0.25;

const MapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Refs
  const mapContainerRef = useRef(null);
  const mapContentRef = useRef(null);
  const fullscreenContainerRef = useRef(null);
  const initialLoadRef = useRef(true);

  // Core data state
  const [map, setMap] = useState(null);
  const [pois, setPois] = useState([]);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // User permissions for this map
  const [permissions, setPermissions] = useState({
    permission: null,
    can_edit: false,
    can_delete_map: false,
    can_add_poi: false,
    can_edit_poi: false,
    can_delete_poi: false,
    can_share: false,
    can_manage_shares: false,
  });

  // POI interaction state
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [showPoiModal, setShowPoiModal] = useState(false);
  const [newPoiPosition, setNewPoiPosition] = useState(null);
  const [addPoiMode, setAddPoiMode] = useState(false);

  // Panel visibility state
  const [showPoiList, setShowPoiList] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Layer visibility state
  const [visibleLayers, setVisibleLayers] = useState(new Set());

  // Sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // ==================== DATA LOADING ====================

  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      const [mapData, poisData, permissionData] = await Promise.all([
        mapsApi.maps.get(id),
        mapsApi.maps.getPois(id),
        mapsApi.maps.getUserPermission(id),
      ]);

      setMap(mapData);
      setPois(poisData);
      setLayers(mapData.layers || []);
      setPermissions(permissionData);

      // Set all layers visible by default
      const layerIds = new Set((mapData.layers || []).map((l) => l.id));
      layerIds.add(null); // Include POIs without a layer
      setVisibleLayers(layerIds);
    } catch (err) {
      setError('Failed to load map');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadPois = useCallback(async () => {
    try {
      const poisData = await mapsApi.maps.getPois(id, sortBy, sortOrder);
      setPois(poisData);
    } catch (err) {
      console.error('Failed to reload POIs', err);
    }
  }, [id, sortBy, sortOrder]);

  // Load map data on mount or when id changes
  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Reload POIs when sort changes (but not on initial load)
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (map) {
      loadPois();
    }
  }, [sortBy, sortOrder, map, loadPois]);

  // ==================== ZOOM HANDLING ====================

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    const container = mapContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    
    // Mouse position relative to container (0-1)
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    // Calculate new zoom
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));

    if (newZoom !== zoom) {
      // Adjust pan to zoom toward mouse position
      const zoomRatio = newZoom / zoom;
      
      // Calculate the point we're zooming toward in the current view
      const pointX = (mouseX - 0.5) * rect.width;
      const pointY = (mouseY - 0.5) * rect.height;
      
      // Adjust pan to keep that point stationary
      const newPanX = pan.x * zoomRatio + pointX * (1 - zoomRatio);
      const newPanY = pan.y * zoomRatio + pointY * (1 - zoomRatio);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  }, [zoom, pan]);

  // Add wheel event listener
  useEffect(() => {
    const container = mapContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP * 2));
  }, [zoom]);

  const zoomOut = useCallback(() => {
    const newZoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP * 2);
    setZoom(newZoom);
    if (newZoom === 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  // ==================== PAN HANDLING ====================

  const handleMouseDown = (e) => {
    // Don't pan if in add POI mode
    if (addPoiMode) return;
    
    if (zoom > 1 && e.button === 0) {
      // Only pan when zoomed in and left mouse button
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const newPanX = e.clientX - panStart.x;
      const newPanY = e.clientY - panStart.y;
      
      // Limit panning to keep map in view
      const container = mapContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const maxPan = ((zoom - 1) / 2) * Math.max(rect.width, rect.height);
        
        setPan({
          x: Math.max(-maxPan, Math.min(maxPan, newPanX)),
          y: Math.max(-maxPan, Math.min(maxPan, newPanY)),
        });
      }
    }
  }, [isPanning, panStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Add mouse move/up listeners for panning
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // ==================== KEYBOARD HANDLING ====================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && addPoiMode) {
        setAddPoiMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addPoiMode]);

  // ==================== FULLSCREEN HANDLING ====================

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      fullscreenContainerRef.current?.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ==================== POI HANDLING ====================

  const handleMapClick = (e) => {
    if (isPanning) return;
    if (!addPoiMode) return;
    if (!mapContentRef.current) return;

    const rect = mapContentRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Only add POI if click is within bounds
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      setNewPoiPosition({ x: x.toFixed(3), y: y.toFixed(3) });
      setSelectedPoi(null);
      setShowPoiModal(true);
      setAddPoiMode(false);
    }
  };

  const handlePoiClick = useCallback((poi, e) => {
    if (isPanning) return;
    if (addPoiMode) return;
    setSelectedPoi(poi);
    setNewPoiPosition(null);
    setShowPoiModal(true);
  }, [isPanning, addPoiMode]);

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
      await loadMapData();
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
      await loadMapData();
      setShowPoiModal(false);
      setSelectedPoi(null);
    } catch (err) {
      console.error('Failed to delete POI', err);
    }
  };

  const closePoiModal = useCallback(() => {
    setShowPoiModal(false);
    setSelectedPoi(null);
    setNewPoiPosition(null);
  }, []);

  // ==================== LAYER HANDLING ====================

  const toggleLayerVisibility = useCallback((layerId) => {
    setVisibleLayers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  }, []);

  // ==================== RENDER HELPERS ====================

  const getCursorClass = () => {
    if (addPoiMode) return 'add-poi-mode';
    if (isPanning) return 'panning';
    if (zoom > 1) return 'zoomed';
    return '';
  };

  // ==================== LOADING & ERROR STATES ====================

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

  // ==================== MAIN RENDER ====================

  return (
    <div className={`map-view-container ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      {/* Header */}
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
          {permissions.can_add_poi && (
            <button
              className={`btn-icon-lg add-poi-btn ${addPoiMode ? 'active' : ''}`}
              onClick={() => setAddPoiMode(!addPoiMode)}
              title={addPoiMode ? 'Cancel Adding Point' : 'Add Point of Interest'}
            >
              ➕
            </button>
          )}
          <button
            className={`btn-icon-lg ${showLayers ? 'active' : ''}`}
            onClick={() => setShowLayers(!showLayers)}
            title="Layers / Categories"
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
          {permissions.can_share && (
            <button
              className="btn-icon-lg"
              onClick={() => setShowShareModal(true)}
              title="Share"
            >
              🔗
            </button>
          )}
          {permissions.can_edit && (
            <button
              className="btn-icon-lg"
              onClick={() => navigate(`/maps/${id}/edit`)}
              title="Edit Map"
            >
              ✏️
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="map-view-content">
        {/* Layers Panel */}
        {showLayers && (
          <LayerPanel
            layers={layers}
            visibleLayers={visibleLayers}
            onToggleLayer={toggleLayerVisibility}
            mapId={id}
            onLayersChange={() => loadMapData()}
            onClose={() => setShowLayers(false)}
            canEdit={permissions.can_edit_poi}
            canDelete={permissions.can_delete_poi}
          />
        )}

        {/* Map Canvas Area */}
        <div className="map-canvas-container" ref={fullscreenContainerRef}>
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button
              className="zoom-btn"
              onClick={zoomIn}
              title="Zoom In"
            >
              +
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button
              className="zoom-btn"
              onClick={zoomOut}
              title="Zoom Out"
            >
              −
            </button>
            {zoom > 1 && (
              <button className="zoom-btn reset" onClick={resetZoom} title="Reset Zoom">
                ⟲
              </button>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen'}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>

          {/* Add POI Mode Indicator */}
          {addPoiMode && (
            <div className="add-poi-indicator">
              Click on the map to place a point • Press ESC to cancel
            </div>
          )}

          {/* Map Canvas */}
          <div
            ref={mapContainerRef}
            className={`map-canvas ${getCursorClass()}`}
            onMouseDown={handleMouseDown}
            onClick={handleMapClick}
          >
            <div
              ref={mapContentRef}
              className="map-content"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Map Image/PDF */}
              {map.file_type === 'image' ? (
                <img src={map.file} alt={map.name} className="map-image" draggable={false} />
              ) : (
                <div className="pdf-container">
                  <iframe
                    src={`${map.file}#toolbar=0`}
                    title={map.name}
                    className="pdf-iframe"
                  />
                </div>
              )}

              {/* POI Layer - Delegated Component */}
              <PoiLayer
                pois={pois}
                layers={layers}
                visibleLayers={visibleLayers}
                zoom={zoom}
                addPoiMode={addPoiMode}
                isPanning={isPanning}
                onPoiClick={handlePoiClick}
              />
            </div>

            {/* Map Instructions */}
            {!addPoiMode && (
              <div className="map-instructions">
                {zoom > 1 
                  ? 'Drag to pan • Scroll to zoom'
                  : 'Scroll to zoom • Click ➕ to add points'
                }
              </div>
            )}
          </div>
        </div>

        {/* POI List Panel */}
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
            canEdit={permissions.can_edit_poi}
            canDelete={permissions.can_delete_poi}
          />
        )}
      </div>

      {/* POI Modal */}
      {showPoiModal && (
        <PoiModal
          poi={selectedPoi}
          position={newPoiPosition}
          layers={layers}
          onSave={permissions.can_edit_poi ? handlePoiSave : null}
          onDelete={selectedPoi && permissions.can_delete_poi ? () => handlePoiDelete(selectedPoi.id) : null}
          onClose={closePoiModal}
          readOnly={!permissions.can_edit_poi}
        />
      )}

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          mapId={id}
          mapName={map.name}
          canManageShares={permissions.can_manage_shares}
          canShare={permissions.can_share}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default MapView;
