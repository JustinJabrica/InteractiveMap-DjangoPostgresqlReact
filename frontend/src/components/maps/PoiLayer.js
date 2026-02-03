/**
 * PoiLayer.js
 * 
 * A dedicated component for rendering Points of Interest (POI) markers on the map.
 * Handles POI visibility based on layers, color logic, click interactions,
 * and hover annotation cards.
 * 
 * This component is designed to be rendered inside the map content area and
 * receives all necessary data and callbacks as props from MapView.
 */

import React, { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import './PoiMarker.css';

/**
 * Annotation Card Component
 * Displays POI details on hover
 */
const PoiAnnotation = memo(({ poi, layerName }) => {
  return (
    <div className="poi-annotation">
      <div className="poi-annotation-content">
        <h4 className="poi-annotation-title">{poi.name}</h4>
        {layerName && (
          <span className="poi-annotation-category">{layerName}</span>
        )}
        {poi.description && (
          <p className="poi-annotation-description">{poi.description}</p>
        )}
      </div>
      <div className="poi-annotation-arrow"></div>
    </div>
  );
});

PoiAnnotation.displayName = 'PoiAnnotation';

PoiAnnotation.propTypes = {
  poi: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  layerName: PropTypes.string,
};

/**
 * Individual POI Marker Component
 * Memoized for performance - only re-renders when its specific POI data changes
 */
const PoiMarker = memo(({ poi, zoom, color, onClick, addPoiMode, layerName }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!addPoiMode) {
      onClick(poi, e);
    }
  }, [poi, onClick, addPoiMode]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div
      className={`poi-marker ${isHovered ? 'hovered' : ''}`}
      style={{
        left: `${poi.x_position}%`,
        top: `${poi.y_position}%`,
        // Counter-scale markers to keep them same size when zoomed
        transform: `translate(-50%, -50%) scale(${1 / zoom})`,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`Point of interest: ${poi.name}`}
    >
      {/* Circular marker */}
      <div 
        className="poi-marker-circle"
        style={{ backgroundColor: color }}
      >
        <div className="poi-marker-inner"></div>
      </div>

      {/* Annotation card on hover */}
      {isHovered && (
        <PoiAnnotation poi={poi} layerName={layerName} />
      )}
    </div>
  );
});

PoiMarker.displayName = 'PoiMarker';

PoiMarker.propTypes = {
  poi: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    x_position: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    y_position: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.string,
    display_color: PropTypes.string,
    layer_color: PropTypes.string,
    layer_id: PropTypes.number,
    layer_name: PropTypes.string,
  }).isRequired,
  zoom: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  addPoiMode: PropTypes.bool,
  layerName: PropTypes.string,
};

/**
 * PoiLayer Component
 * 
 * Renders all visible POI markers on the map.
 * Filters POIs based on layer visibility and handles color inheritance.
 * 
 * @param {Array} pois - Array of POI objects to potentially display
 * @param {Array} layers - Array of layer objects for category names
 * @param {Set} visibleLayers - Set of layer IDs that are currently visible (includes null for uncategorized)
 * @param {number} zoom - Current zoom level for counter-scaling markers
 * @param {boolean} addPoiMode - Whether the user is in "add POI" mode
 * @param {boolean} isPanning - Whether the user is currently panning the map
 * @param {Function} onPoiClick - Callback when a POI marker is clicked
 */
const PoiLayer = ({
  pois = [],
  layers = [],
  visibleLayers = new Set(),
  zoom = 1,
  addPoiMode = false,
  isPanning = false,
  onPoiClick,
}) => {
  /**
   * Creates a map of layer IDs to layer names for quick lookup
   */
  const layerNameMap = React.useMemo(() => {
    const map = new Map();
    layers.forEach(layer => {
      map.set(layer.id, layer.name);
    });
    return map;
  }, [layers]);

  /**
   * Determines if a POI should be visible based on its layer
   * @param {Object} poi - The POI object
   * @returns {boolean} - Whether the POI should be displayed
   */
  const isPoiVisible = useCallback((poi) => {
    const layerId = poi.layer_id || null;
    return visibleLayers.has(layerId);
  }, [visibleLayers]);

  /**
   * Gets the display color for a POI
   * Priority: POI custom color > display_color > layer_color > default red
   * @param {Object} poi - The POI object
   * @returns {string} - Hex color code
   */
  const getPoiColor = useCallback((poi) => {
    if (poi.color) return poi.color;
    if (poi.display_color) return poi.display_color;
    if (poi.layer_color) return poi.layer_color;
    return '#e74c3c'; // Default red
  }, []);

  /**
   * Gets the layer name for a POI
   * @param {Object} poi - The POI object
   * @returns {string|null} - Layer name or null if uncategorized
   */
  const getLayerName = useCallback((poi) => {
    if (poi.layer_name) return poi.layer_name;
    if (poi.layer_id) return layerNameMap.get(poi.layer_id) || null;
    return null;
  }, [layerNameMap]);

  /**
   * Handles POI click - prevents action if panning
   */
  const handlePoiClick = useCallback((poi, e) => {
    if (isPanning) return;
    onPoiClick(poi, e);
  }, [isPanning, onPoiClick]);

  // Filter visible POIs
  const visiblePois = pois.filter(isPoiVisible);

  // Don't render anything if no visible POIs
  if (visiblePois.length === 0) {
    return null;
  }

  return (
    <div className="poi-layer" aria-label="Points of interest layer">
      {visiblePois.map((poi) => (
        <PoiMarker
          key={poi.id}
          poi={poi}
          zoom={zoom}
          color={getPoiColor(poi)}
          onClick={handlePoiClick}
          addPoiMode={addPoiMode}
          layerName={getLayerName(poi)}
        />
      ))}
    </div>
  );
};

PoiLayer.propTypes = {
  pois: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      x_position: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      y_position: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      color: PropTypes.string,
      display_color: PropTypes.string,
      layer_color: PropTypes.string,
      layer_id: PropTypes.number,
      layer_name: PropTypes.string,
    })
  ),
  layers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  visibleLayers: PropTypes.instanceOf(Set),
  zoom: PropTypes.number,
  addPoiMode: PropTypes.bool,
  isPanning: PropTypes.bool,
  onPoiClick: PropTypes.func.isRequired,
};

export default memo(PoiLayer);
